from django.db import connection, transaction


def fetch_all(sql, params=None):
    with connection.cursor() as cursor:
        cursor.execute(sql, params or [])
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def fetch_one(sql, params=None):
    rows = fetch_all(sql, params)
    return rows[0] if rows else None


def dict_from_cursor(cursor, row):
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))


def database_error_message(error):
    cause = getattr(error, '__cause__', None)
    diag = getattr(cause, 'diag', None)
    message = getattr(diag, 'message_primary', None)
    if message:
        return message
    return str(error).splitlines()[0]


def verify_login(email, password):
    return fetch_one(
        """
        SELECT email, role, first_mid_name, last_name, nomor_member, id_staf
        FROM verify_pengguna_credentials(%s, %s)
        """,
        [email, password],
    )


def register_member(data):
    email = data.get('email')
    password = data.get('password')
    first_mid_name = data.get('first_mid_name') or ' '.join(
        item for item in [data.get('firstName'), data.get('middleName')] if item
    )
    last_name = data.get('last_name') or data.get('lastName') or ''
    tier_id = data.get('id_tier') or data.get('tier') or ''

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO pengguna (
                    email,
                    pwd,
                    salutation,
                    first_mid_name,
                    last_name,
                    country_code,
                    mobile_number,
                    tanggal_lahir,
                    kewarganegaraan
                )
                VALUES (
                    %s,
                    ENCODE(DIGEST(COALESCE(%s, ''), 'sha256'), 'hex'),
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                RETURNING email
                """,
                [
                    email,
                    password,
                    data.get('salutation') or '',
                    first_mid_name,
                    last_name,
                    data.get('country_code') or data.get('countryCode') or '+62',
                    data.get('mobile_number') or data.get('mobileNumber') or '',
                    data.get('tanggal_lahir') or data.get('dateOfBirth'),
                    data.get('kewarganegaraan') or data.get('nationality') or '',
                ],
            )
            registered_email = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT INTO member (email, tanggal_bergabung, id_tier)
                VALUES (
                    %s,
                    CURRENT_DATE,
                    COALESCE(
                        NULLIF(%s, ''),
                        (SELECT id_tier FROM tier ORDER BY minimal_tier_miles LIMIT 1)
                    )
                )
                RETURNING email, nomor_member, tanggal_bergabung, id_tier, award_miles, total_miles
                """,
                [registered_email, tier_id],
            )
            return dict_from_cursor(cursor, cursor.fetchone())


def register_staff(data):
    email = data.get('email')
    password = data.get('password')
    first_mid_name = data.get('first_mid_name') or ' '.join(
        item for item in [data.get('firstName'), data.get('middleName')] if item
    )
    last_name = data.get('last_name') or data.get('lastName') or ''

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO pengguna (
                    email,
                    pwd,
                    salutation,
                    first_mid_name,
                    last_name,
                    country_code,
                    mobile_number,
                    tanggal_lahir,
                    kewarganegaraan
                )
                VALUES (
                    %s,
                    ENCODE(DIGEST(COALESCE(%s, ''), 'sha256'), 'hex'),
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                RETURNING email
                """,
                [
                    email,
                    password,
                    data.get('salutation') or '',
                    first_mid_name,
                    last_name,
                    data.get('country_code') or data.get('countryCode') or '+62',
                    data.get('mobile_number') or data.get('mobileNumber') or '',
                    data.get('tanggal_lahir') or data.get('dateOfBirth'),
                    data.get('kewarganegaraan') or data.get('nationality') or '',
                ],
            )
            registered_email = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT INTO staf (email, kode_maskapai)
                VALUES (%s, %s)
                RETURNING email, id_staf, kode_maskapai
                """,
                [registered_email, data.get('kode_maskapai') or data.get('airlineCode')],
            )
            return dict_from_cursor(cursor, cursor.fetchone())


def get_members():
    return fetch_all(
        """
        SELECT
            m.email,
            p.salutation,
            p.first_mid_name,
            p.last_name,
            p.country_code,
            p.mobile_number,
            p.tanggal_lahir,
            p.kewarganegaraan,
            m.nomor_member,
            m.tanggal_bergabung,
            m.id_tier,
            t.nama AS nama_tier,
            m.award_miles,
            m.total_miles
        FROM member m
        JOIN pengguna p ON p.email = m.email
        JOIN tier t ON t.id_tier = m.id_tier
        ORDER BY m.nomor_member
        """
    )


def get_staff():
    return fetch_all(
        """
        SELECT
            s.email,
            p.salutation,
            p.first_mid_name,
            p.last_name,
            s.id_staf,
            s.kode_maskapai,
            ma.nama_maskapai
        FROM staf s
        JOIN pengguna p ON p.email = s.email
        JOIN maskapai ma ON ma.kode_maskapai = s.kode_maskapai
        ORDER BY s.id_staf
        """
    )


def get_claims():
    return fetch_all(
        """
        SELECT
            c.id,
            c.email_member,
            c.email_staf,
            c.maskapai,
            ma.nama_maskapai,
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
        JOIN maskapai ma ON ma.kode_maskapai = c.maskapai
        ORDER BY c.time_stamp DESC, c.id
        """
    )


def get_rewards():
    return fetch_all(
        """
        SELECT
            h.kode_hadiah,
            h.nama,
            h.miles,
            h.deskripsi,
            h.valid_start_date,
            h.program_end,
            h.id_penyedia
        FROM hadiah h
        ORDER BY h.kode_hadiah
        """
    )


def get_airports():
    return fetch_all(
        """
        SELECT iata_code, nama, kota, negara
        FROM bandara
        ORDER BY iata_code
        """
    )


def get_airlines():
    return fetch_all(
        """
        SELECT kode_maskapai, nama_maskapai, id_penyedia
        FROM maskapai
        ORDER BY kode_maskapai
        """
    )


def get_tiers():
    return fetch_all(
        """
        SELECT id_tier, nama, minimal_frekuensi_terbang, minimal_tier_miles
        FROM tier
        ORDER BY minimal_tier_miles
        """
    )


def get_miles_packages():
    return fetch_all(
        """
        SELECT id, harga_paket, jumlah_award_miles
        FROM award_miles_package
        ORDER BY jumlah_award_miles
        """
    )
