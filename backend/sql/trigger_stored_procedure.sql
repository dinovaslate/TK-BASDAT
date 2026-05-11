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
        SET award_miles = award_miles + 1000,
        total_miles = total_miles + 1000
        WHERE email = NEW.email_member;

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
        -- Get first place for success message
        SELECT email, total_miles
        INTO top_email, top_miles
        FROM member
        ORDER BY total_miles DESC
        LIMIT 1;

        -- Display success message
        RAISE NOTICE 'SUKSES: Daftar Top 5 Member berdasarkan total miles berhasil diperbarui, dengan peringkat pertama "%" memiliki % miles.',
            top_email,
            top_miles;

        -- Get top 5 (table)
        RETURN QUERY
        SELECT
            (row_number() OVER (ORDER BY m.total_miles DESC))::INT as peringkat,
            m.email,
            p.nama_lengkap,
            m.total_miles
        FROM member m JOIN pengguna p on m.username = p.username
        ORDER BY m.total_miles DESC
        LIMIT 5;
    END;
$$ LANGUAGE plpgsql;
