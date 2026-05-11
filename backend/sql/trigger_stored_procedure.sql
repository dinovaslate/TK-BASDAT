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
