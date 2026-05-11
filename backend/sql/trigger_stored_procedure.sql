SET search_path TO aeromiles, public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION prevent_duplicate_pengguna_email()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email := LOWER(TRIM(NEW.email));

    IF TG_OP = 'UPDATE' AND LOWER(OLD.email) = NEW.email THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pengguna
        WHERE LOWER(email) = NEW.email
    ) THEN
        RAISE EXCEPTION 'ERROR: Email "%" sudah terdaftar, silakan gunakan email lain.', NEW.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_pengguna_email ON pengguna;

CREATE TRIGGER trg_prevent_duplicate_pengguna_email
BEFORE INSERT OR UPDATE OF email ON pengguna
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_pengguna_email();

DROP TRIGGER IF EXISTS trg_prevent_negative_member_miles ON member;
DROP FUNCTION IF EXISTS fn_prevent_negative_member_miles();

CREATE OR REPLACE FUNCTION fn_prevent_negative_member_miles()
RETURNS TRIGGER AS $$
BEGIN
    IF COALESCE(NEW.award_miles, 0) < 0 THEN
        RAISE EXCEPTION 'ERROR: award_miles tidak boleh bernilai negatif.';
    END IF;

    IF COALESCE(NEW.total_miles, 0) < 0 THEN
        RAISE EXCEPTION 'ERROR: total_miles tidak boleh bernilai negatif.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_negative_member_miles
BEFORE INSERT OR UPDATE OF award_miles, total_miles ON member
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_negative_member_miles();

CREATE OR REPLACE FUNCTION verify_pengguna_credentials(
    p_email VARCHAR,
    p_password TEXT
)
RETURNS TABLE (
    email VARCHAR,
    role TEXT,
    first_mid_name VARCHAR,
    last_name VARCHAR,
    nomor_member VARCHAR,
    id_staf VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.email,
        CASE
            WHEN m.email IS NOT NULL THEN 'member'
            WHEN s.email IS NOT NULL THEN 'staff'
            ELSE 'user'
        END AS role,
        p.first_mid_name,
        p.last_name,
        m.nomor_member,
        s.id_staf
    FROM pengguna p
    LEFT JOIN member m ON m.email = p.email
    LEFT JOIN staf s ON s.email = p.email
    WHERE LOWER(p.email) = LOWER(TRIM(p_email))
      AND p.pwd = ENCODE(DIGEST(COALESCE(p_password, ''), 'sha256'), 'hex')
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email atau password salah, silakan coba lagi.';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TRIGGER/STORED PROCEDURE GROUP 3
-- 3.1 Safe Miles Transfer With Balance Validation
-- 3.2 Redeem Award Miles Validation
-- 3.3 Award Miles Package Purchase Synchronization
-- =========================================================

------------------------------------------------------------
-- 3.1 Safe Miles Transfer With Balance Validation
------------------------------------------------------------

DROP FUNCTION IF EXISTS process_transfer_miles(VARCHAR, VARCHAR, VARCHAR, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION process_transfer_miles(
    p_sender_email VARCHAR,
    p_recipient_email VARCHAR,
    p_recipient_nomor_member VARCHAR,
    p_jumlah INTEGER,
    p_catatan TEXT DEFAULT ''
)
RETURNS TABLE (
    message TEXT,
    sender_email VARCHAR,
    recipient_email VARCHAR,
    jumlah INTEGER,
    catatan TEXT,
    time_stamp TIMESTAMP,
    sender_award_miles INTEGER,
    recipient_award_miles INTEGER,
    recipient_total_miles INTEGER
) AS $$
DECLARE
    v_sender_email VARCHAR;
    v_recipient_email VARCHAR;
    v_sender_balance INTEGER;
    v_transfer_time TIMESTAMP;
BEGIN
    IF p_jumlah IS NULL OR p_jumlah <= 0 THEN
        RAISE EXCEPTION 'ERROR: Jumlah transfer harus lebih dari 0 miles.';
    END IF;

    SELECT m.email
    INTO v_sender_email
    FROM member m
    WHERE LOWER(m.email) = LOWER(TRIM(p_sender_email))
    LIMIT 1;

    IF v_sender_email IS NULL THEN
        RAISE EXCEPTION 'ERROR: Member pengirim tidak ditemukan.';
    END IF;

    SELECT m.email
    INTO v_recipient_email
    FROM member m
    WHERE (
        p_recipient_email IS NOT NULL
        AND TRIM(p_recipient_email) <> ''
        AND LOWER(m.email) = LOWER(TRIM(p_recipient_email))
    ) OR (
        p_recipient_nomor_member IS NOT NULL
        AND TRIM(p_recipient_nomor_member) <> ''
        AND UPPER(m.nomor_member) = UPPER(TRIM(p_recipient_nomor_member))
    )
    ORDER BY m.email
    LIMIT 1;

    IF v_recipient_email IS NULL THEN
        RAISE EXCEPTION 'ERROR: Member penerima tidak ditemukan.';
    END IF;

    IF LOWER(v_sender_email) = LOWER(v_recipient_email) THEN
        RAISE EXCEPTION 'ERROR: Member penerima tidak boleh sama dengan pengirim.';
    END IF;

    PERFORM 1
    FROM member m
    WHERE m.email IN (v_sender_email, v_recipient_email)
    ORDER BY m.email
    FOR UPDATE;

    SELECT m.award_miles
    INTO v_sender_balance
    FROM member m
    WHERE m.email = v_sender_email;

    IF v_sender_balance < p_jumlah THEN
        RAISE EXCEPTION 'ERROR: Saldo award miles tidak mencukupi. Saldo Anda saat ini: % miles, jumlah transfer: % miles.',
            v_sender_balance,
            p_jumlah;
    END IF;

    UPDATE member
    SET award_miles = member.award_miles - p_jumlah
    WHERE member.email = v_sender_email;

    UPDATE member
    SET
        award_miles = member.award_miles + p_jumlah,
        total_miles = member.total_miles + p_jumlah
    WHERE member.email = v_recipient_email;

    INSERT INTO transfer (
        email_member_1,
        email_member_2,
        time_stamp,
        jumlah,
        catatan
    )
    VALUES (
        v_sender_email,
        v_recipient_email,
        CURRENT_TIMESTAMP,
        p_jumlah,
        COALESCE(p_catatan, '')
    )
    RETURNING transfer.time_stamp INTO v_transfer_time;

    RETURN QUERY
    SELECT
        FORMAT(
            'SUKSES: Transfer %s miles dari "%s" ke "%s" berhasil dicatat.',
            p_jumlah,
            v_sender_email,
            v_recipient_email
        ) AS message,
        v_sender_email AS sender_email,
        v_recipient_email AS recipient_email,
        p_jumlah AS jumlah,
        COALESCE(p_catatan, '') AS catatan,
        v_transfer_time AS time_stamp,
        sender_member.award_miles AS sender_award_miles,
        recipient_member.award_miles AS recipient_award_miles,
        recipient_member.total_miles AS recipient_total_miles
    FROM member sender_member
    CROSS JOIN member recipient_member
    WHERE sender_member.email = v_sender_email
      AND recipient_member.email = v_recipient_email;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- 3.2 Redeem Award Miles Validation
------------------------------------------------------------

DROP FUNCTION IF EXISTS process_redeem_reward(VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION process_redeem_reward(
    p_member_email VARCHAR,
    p_kode_hadiah VARCHAR
)
RETURNS TABLE (
    message TEXT,
    email_member VARCHAR,
    kode_hadiah VARCHAR,
    nama_hadiah VARCHAR,
    jumlah_miles INTEGER,
    time_stamp TIMESTAMP,
    award_miles INTEGER
) AS $$
DECLARE
    v_member_email VARCHAR;
    v_award_miles INTEGER;
    v_reward_name VARCHAR;
    v_reward_miles INTEGER;
    v_redeem_time TIMESTAMP;
BEGIN
    SELECT m.email
    INTO v_member_email
    FROM member m
    WHERE LOWER(m.email) = LOWER(TRIM(p_member_email))
    LIMIT 1;

    IF v_member_email IS NULL THEN
        RAISE EXCEPTION 'ERROR: Member tidak ditemukan.';
    END IF;

    SELECT h.nama, h.miles
    INTO v_reward_name, v_reward_miles
    FROM hadiah h
    WHERE h.kode_hadiah = p_kode_hadiah
    LIMIT 1;

    IF v_reward_name IS NULL THEN
        RAISE EXCEPTION 'ERROR: Hadiah tidak ditemukan.';
    END IF;

    PERFORM 1
    FROM member m
    WHERE m.email = v_member_email
    FOR UPDATE;

    SELECT m.award_miles
    INTO v_award_miles
    FROM member m
    WHERE m.email = v_member_email;

    IF v_award_miles < v_reward_miles THEN
        RAISE EXCEPTION 'ERROR: Saldo award miles tidak mencukupi. Dibutuhkan % miles, saldo Anda: % miles.',
            v_reward_miles,
            v_award_miles;
    END IF;

    UPDATE member
    SET award_miles = member.award_miles - v_reward_miles
    WHERE member.email = v_member_email;

    INSERT INTO redeem (
        email_member,
        kode_hadiah,
        time_stamp
    )
    VALUES (
        v_member_email,
        p_kode_hadiah,
        CURRENT_TIMESTAMP
    )
    RETURNING redeem.time_stamp INTO v_redeem_time;

    RETURN QUERY
    SELECT
        FORMAT(
            'SUKSES: Redeem hadiah "%s" berhasil. Award miles Anda berkurang %s miles.',
            v_reward_name,
            v_reward_miles
        ) AS message,
        v_member_email AS email_member,
        p_kode_hadiah AS kode_hadiah,
        v_reward_name AS nama_hadiah,
        v_reward_miles AS jumlah_miles,
        v_redeem_time AS time_stamp,
        m.award_miles
    FROM member m
    WHERE m.email = v_member_email;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- 3.3 Award Miles Package Purchase Synchronization
------------------------------------------------------------

DROP FUNCTION IF EXISTS process_purchase_miles_package(VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION process_purchase_miles_package(
    p_member_email VARCHAR,
    p_package_id VARCHAR
)
RETURNS TABLE (
    message TEXT,
    email_member VARCHAR,
    id_award_miles_package VARCHAR,
    jumlah_award_miles INTEGER,
    time_stamp TIMESTAMP,
    award_miles INTEGER,
    total_miles INTEGER
) AS $$
DECLARE
    v_member_email VARCHAR;
    v_package_miles INTEGER;
    v_purchase_time TIMESTAMP;
BEGIN
    SELECT m.email
    INTO v_member_email
    FROM member m
    WHERE LOWER(m.email) = LOWER(TRIM(p_member_email))
    LIMIT 1;

    IF v_member_email IS NULL THEN
        RAISE EXCEPTION 'ERROR: Member tidak ditemukan.';
    END IF;

    SELECT amp.jumlah_award_miles
    INTO v_package_miles
    FROM award_miles_package amp
    WHERE amp.id = p_package_id
    LIMIT 1;

    IF v_package_miles IS NULL THEN
        RAISE EXCEPTION 'ERROR: Paket award miles tidak ditemukan.';
    END IF;

    PERFORM 1
    FROM member m
    WHERE m.email = v_member_email
    FOR UPDATE;

    INSERT INTO member_award_miles_package (
        id_award_miles_package,
        email_member,
        time_stamp
    )
    VALUES (
        p_package_id,
        v_member_email,
        CURRENT_TIMESTAMP
    )
    RETURNING member_award_miles_package.time_stamp INTO v_purchase_time;

    UPDATE member
    SET
        award_miles = member.award_miles + v_package_miles,
        total_miles = member.total_miles + v_package_miles
    WHERE member.email = v_member_email;

    RETURN QUERY
    SELECT
        FORMAT(
            'SUKSES: Pembelian package berhasil. Award miles dan total miles Anda bertambah %s miles.',
            v_package_miles
        ) AS message,
        v_member_email AS email_member,
        p_package_id AS id_award_miles_package,
        v_package_miles AS jumlah_award_miles,
        v_purchase_time AS time_stamp,
        m.award_miles,
        m.total_miles
    FROM member m
    WHERE m.email = v_member_email;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TRIGGER GROUP 4
-- 4.1 Duplicate Missing Miles Claim Validation
-- 4.2 Automatic Member Tier Update
-- =========================================================

------------------------------------------------------------
-- 4.1 Duplicate Missing Miles Claim Validation
------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_prevent_duplicate_claim_missing_miles ON claim_missing_miles;
DROP FUNCTION IF EXISTS fn_prevent_duplicate_claim_missing_miles();

CREATE OR REPLACE FUNCTION fn_prevent_duplicate_claim_missing_miles()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM claim_missing_miles c
        WHERE c.email_member = NEW.email_member
          AND c.flight_number = NEW.flight_number
          AND c.tanggal_penerbangan = NEW.tanggal_penerbangan
          AND c.nomor_tiket = NEW.nomor_tiket
          AND (TG_OP = 'INSERT' OR c.id <> NEW.id)
    ) THEN
        RAISE EXCEPTION 'ERROR: Klaim untuk penerbangan "%" pada tanggal "%" dengan nomor tiket "%" sudah pernah diajukan sebelumnya.',
            NEW.flight_number,
            NEW.tanggal_penerbangan,
            NEW.nomor_tiket;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_claim_missing_miles
BEFORE INSERT OR UPDATE ON claim_missing_miles
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_duplicate_claim_missing_miles();

------------------------------------------------------------
-- 4.2 Automatic Member Tier Update
------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_update_member_tier_after_total_miles_change ON member;
DROP FUNCTION IF EXISTS fn_update_member_tier_after_total_miles_change();

CREATE OR REPLACE FUNCTION fn_update_member_tier_after_total_miles_change()
RETURNS TRIGGER AS $$
DECLARE
    flight_frequency INTEGER;
    old_tier_name VARCHAR;
    eligible_tier_id VARCHAR;
    eligible_tier_name VARCHAR;
BEGIN
    SELECT COUNT(*)
    INTO flight_frequency
    FROM claim_missing_miles
    WHERE email_member = NEW.email
      AND status_penerimaan = 'Disetujui';

    SELECT nama
    INTO old_tier_name
    FROM tier
    WHERE id_tier = OLD.id_tier;

    SELECT id_tier, nama
    INTO eligible_tier_id, eligible_tier_name
    FROM tier
    WHERE minimal_tier_miles <= NEW.total_miles
      AND minimal_frekuensi_terbang <= flight_frequency
    ORDER BY minimal_tier_miles DESC, minimal_frekuensi_terbang DESC
    LIMIT 1;

    IF eligible_tier_id IS NOT NULL AND eligible_tier_id <> NEW.id_tier THEN
        UPDATE member
        SET id_tier = eligible_tier_id
        WHERE email = NEW.email;

        RAISE NOTICE 'SUKSES: Tier Member "%" telah diperbarui dari "%" menjadi "%" berdasarkan total miles yang dimiliki.',
            NEW.email,
            old_tier_name,
            eligible_tier_name;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_member_tier_after_total_miles_change
AFTER UPDATE OF total_miles ON member
FOR EACH ROW
WHEN (OLD.total_miles IS DISTINCT FROM NEW.total_miles)
EXECUTE FUNCTION fn_update_member_tier_after_total_miles_change();

------------------------------------------------------------
-- 4.3 Missing Miles Claim Submission and Review
------------------------------------------------------------

DROP FUNCTION IF EXISTS process_submit_missing_miles_claim(VARCHAR, VARCHAR, VARCHAR, VARCHAR, DATE, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION process_submit_missing_miles_claim(
    p_member_email VARCHAR,
    p_maskapai VARCHAR,
    p_bandara_asal VARCHAR,
    p_bandara_tujuan VARCHAR,
    p_tanggal_penerbangan DATE,
    p_flight_number VARCHAR,
    p_nomor_tiket VARCHAR,
    p_kelas_kabin VARCHAR,
    p_pnr VARCHAR,
    p_claim_id VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    message TEXT,
    id VARCHAR,
    email_member VARCHAR,
    maskapai VARCHAR,
    bandara_asal VARCHAR,
    bandara_tujuan VARCHAR,
    tanggal_penerbangan DATE,
    flight_number VARCHAR,
    nomor_tiket VARCHAR,
    kelas_kabin VARCHAR,
    pnr VARCHAR,
    status_penerimaan VARCHAR,
    time_stamp TIMESTAMP
) AS $$
DECLARE
    v_member_email VARCHAR;
    v_maskapai VARCHAR;
    v_claim_id VARCHAR;
    v_claim_time TIMESTAMP;
BEGIN
    SELECT m.email
    INTO v_member_email
    FROM member m
    WHERE LOWER(m.email) = LOWER(TRIM(p_member_email))
    LIMIT 1;

    IF v_member_email IS NULL THEN
        RAISE EXCEPTION 'ERROR: Member tidak ditemukan.';
    END IF;

    SELECT ma.kode_maskapai
    INTO v_maskapai
    FROM maskapai ma
    WHERE UPPER(ma.kode_maskapai) = UPPER(TRIM(p_maskapai))
       OR LOWER(ma.nama_maskapai) = LOWER(TRIM(p_maskapai))
    LIMIT 1;

    IF v_maskapai IS NULL THEN
        RAISE EXCEPTION 'ERROR: Maskapai tidak ditemukan.';
    END IF;

    IF p_bandara_asal = p_bandara_tujuan THEN
        RAISE EXCEPTION 'ERROR: Bandara asal dan tujuan tidak boleh sama.';
    END IF;

    LOCK TABLE claim_missing_miles IN SHARE ROW EXCLUSIVE MODE;

    IF p_claim_id IS NOT NULL AND TRIM(p_claim_id) <> '' AND EXISTS (
        SELECT 1 FROM claim_missing_miles c WHERE c.id = TRIM(p_claim_id)
    ) THEN
        UPDATE claim_missing_miles
        SET
            maskapai = v_maskapai,
            bandara_asal = p_bandara_asal,
            bandara_tujuan = p_bandara_tujuan,
            tanggal_penerbangan = p_tanggal_penerbangan,
            flight_number = p_flight_number,
            nomor_tiket = p_nomor_tiket,
            kelas_kabin = p_kelas_kabin,
            pnr = p_pnr,
            status_penerimaan = 'Menunggu',
            time_stamp = CURRENT_TIMESTAMP
        WHERE claim_missing_miles.id = TRIM(p_claim_id)
          AND claim_missing_miles.email_member = v_member_email
          AND claim_missing_miles.status_penerimaan <> 'Disetujui'
        RETURNING claim_missing_miles.id, claim_missing_miles.time_stamp
        INTO v_claim_id, v_claim_time;

        IF v_claim_id IS NULL THEN
            RAISE EXCEPTION 'ERROR: Klaim tidak dapat diperbarui.';
        END IF;
    ELSE
        SELECT
            'CLM-' || LPAD(
                (
                    COALESCE(
                        MAX(NULLIF(REGEXP_REPLACE(c.id, '\D', '', 'g'), '')::INTEGER),
                        0
                    ) + 1
                )::TEXT,
                3,
                '0'
            )
        INTO v_claim_id
        FROM claim_missing_miles c;

        INSERT INTO claim_missing_miles (
            id,
            email_member,
            email_staf,
            maskapai,
            bandara_asal,
            bandara_tujuan,
            tanggal_penerbangan,
            flight_number,
            nomor_tiket,
            kelas_kabin,
            pnr,
            status_penerimaan,
            time_stamp
        )
        VALUES (
            v_claim_id,
            v_member_email,
            NULL,
            v_maskapai,
            p_bandara_asal,
            p_bandara_tujuan,
            p_tanggal_penerbangan,
            p_flight_number,
            p_nomor_tiket,
            p_kelas_kabin,
            p_pnr,
            'Menunggu',
            CURRENT_TIMESTAMP
        )
        RETURNING claim_missing_miles.time_stamp INTO v_claim_time;
    END IF;

    RETURN QUERY
    SELECT
        FORMAT('SUKSES: Klaim missing miles "%s" berhasil dicatat.', c.id) AS message,
        c.id,
        c.email_member,
        c.maskapai,
        c.bandara_asal,
        c.bandara_tujuan,
        c.tanggal_penerbangan,
        c.flight_number,
        c.nomor_tiket,
        c.kelas_kabin,
        c.pnr,
        c.status_penerimaan,
        c.time_stamp
    FROM claim_missing_miles c
    WHERE c.id = v_claim_id;
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS process_review_missing_miles_claim(VARCHAR, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION process_review_missing_miles_claim(
    p_claim_id VARCHAR,
    p_staff_email VARCHAR,
    p_status VARCHAR
)
RETURNS TABLE (
    message TEXT,
    id VARCHAR,
    email_member VARCHAR,
    email_staf VARCHAR,
    status_penerimaan VARCHAR,
    award_miles INTEGER,
    total_miles INTEGER
) AS $$
DECLARE
    v_staff_email VARCHAR;
    v_status VARCHAR;
    v_claim_member VARCHAR;
BEGIN
    SELECT s.email
    INTO v_staff_email
    FROM staf s
    WHERE LOWER(s.email) = LOWER(TRIM(p_staff_email))
    LIMIT 1;

    IF v_staff_email IS NULL THEN
        RAISE EXCEPTION 'ERROR: Staf tidak ditemukan.';
    END IF;

    v_status := CASE LOWER(TRIM(p_status))
        WHEN 'approved' THEN 'Disetujui'
        WHEN 'disetujui' THEN 'Disetujui'
        WHEN 'rejected' THEN 'Ditolak'
        WHEN 'ditolak' THEN 'Ditolak'
        WHEN 'pending' THEN 'Menunggu'
        WHEN 'pending review' THEN 'Menunggu'
        WHEN 'menunggu' THEN 'Menunggu'
        ELSE NULL
    END;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'ERROR: Status klaim tidak valid.';
    END IF;

    SELECT c.email_member
    INTO v_claim_member
    FROM claim_missing_miles c
    WHERE c.id = p_claim_id
    LIMIT 1;

    IF v_claim_member IS NULL THEN
        RAISE EXCEPTION 'ERROR: Klaim tidak ditemukan.';
    END IF;

    UPDATE claim_missing_miles
    SET
        status_penerimaan = v_status,
        email_staf = v_staff_email
    WHERE claim_missing_miles.id = p_claim_id;

    RETURN QUERY
    SELECT
        CASE
            WHEN c.status_penerimaan = 'Disetujui' THEN FORMAT(
                'SUKSES: Total miles Member "%s" telah diperbarui. Miles ditambahkan: 1000 miles dari klaim penerbangan "%s".',
                c.email_member,
                c.flight_number
            )
            ELSE FORMAT('SUKSES: Klaim "%s" berhasil diperbarui menjadi "%s".', c.id, c.status_penerimaan)
        END AS message,
        c.id,
        c.email_member,
        c.email_staf,
        c.status_penerimaan,
        m.award_miles,
        m.total_miles
    FROM claim_missing_miles c
    JOIN member m ON m.email = c.email_member
    WHERE c.id = p_claim_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TRIGGER GROUP 5
-- 5.1 Synchronize Member Miles After Approval
-- 5.2 Ranking of Members by Total Miles
-- =========================================================

------------------------------------------------------------
-- 5.1 Synchronize Member Miles After Approval
------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_synchronize_member_miles_on_approval ON claim_missing_miles;
DROP FUNCTION IF EXISTS fn_synchronize_member_miles_on_approval();

CREATE OR REPLACE FUNCTION fn_synchronize_member_miles_on_approval()
RETURNS TRIGGER AS $$
    BEGIN
        UPDATE member
        SET
            award_miles = member.award_miles + 1000,
            total_miles = member.total_miles + 1000
        WHERE member.email = NEW.email_member;

        RAISE NOTICE 'SUKSES: Total miles Member "%" telah diperbarui. Miles ditambahkan: 1000 miles dari klaim penerbangan "%".',
            NEW.email_member,
            NEW.flight_number;

        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_synchronize_member_miles_on_approval
AFTER UPDATE OF status_penerimaan ON claim_missing_miles
FOR EACH ROW
WHEN (OLD.status_penerimaan IS DISTINCT FROM 'Disetujui' AND NEW.status_penerimaan = 'Disetujui')
EXECUTE FUNCTION fn_synchronize_member_miles_on_approval();

------------------------------------------------------------
-- 5.2 Ranking of Members by Total Miles
-- (not trigger)
------------------------------------------------------------

DROP FUNCTION IF EXISTS fn_rank_top_5_members();

CREATE OR REPLACE FUNCTION fn_rank_top_5_members()
RETURNS TABLE (
    peringkat INTEGER,
    email_member VARCHAR,
    nama_lengkap VARCHAR,
    total_miles_member INTEGER
) AS $$
DECLARE
    top_email VARCHAR;
    top_miles INTEGER;
BEGIN
    SELECT email, total_miles
    INTO top_email, top_miles
    FROM member
    ORDER BY total_miles DESC, email
    LIMIT 1;

    RAISE NOTICE 'SUKSES: Daftar Top 5 Member berdasarkan total miles berhasil diperbarui, dengan peringkat pertama "%" memiliki % miles.',
        top_email,
        top_miles;

    RETURN QUERY
    SELECT
        (ROW_NUMBER() OVER (ORDER BY m.total_miles DESC, m.email))::INTEGER AS peringkat,
        m.email AS email_member,
        TRIM(CONCAT_WS(
            ' ',
            NULLIF(p.salutation, ''),
            NULLIF(p.first_mid_name, ''),
            NULLIF(p.last_name, '')
        ))::VARCHAR AS nama_lengkap,
        m.total_miles AS total_miles_member
    FROM member m
    JOIN pengguna p ON p.email = m.email
    ORDER BY m.total_miles DESC, m.email
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
