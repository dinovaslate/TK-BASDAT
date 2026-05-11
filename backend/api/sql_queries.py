from django.db import connection, transaction

ROLE_MEMBER = 'member'
ROLE_STAF = 'staf'

CLAIM_STATUS_PENDING = 'Menunggu'
CLAIM_STATUS_APPROVED = 'Disetujui'
CLAIM_STATUS_REJECTED = 'Ditolak'

ERROR_USER_NOT_FOUND = 'Pengguna tidak ditemukan.'
ERROR_INVALID_USER_ROLE = 'Role pengguna tidak valid.'


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


class DashboardError(Exception):
    status_code = 400


class DashboardUserNotFound(DashboardError):
    status_code = 404


class DashboardInvalidRole(DashboardError):
    status_code = 400


def full_name(profile):
    return ' '.join(
        part for part in [
            (profile.get('salutation') or '').strip(),
            (profile.get('first_mid_name') or '').strip(),
            (profile.get('last_name') or '').strip(),
        ]
        if part
    )


def format_profile(profile):
    return {
        'email': profile['email'],
        'nama_lengkap': full_name(profile),
        'country_code': profile['country_code'],
        'mobile_number': profile['mobile_number'],
        'nomor_hp': f"{profile['country_code']}{profile['mobile_number']}",
        'kewarganegaraan': profile['kewarganegaraan'],
        'tanggal_lahir': profile['tanggal_lahir'],
    }


def get_user_profile_by_email(email):
    return fetch_one(
        """
        SELECT
            p.email,
            p.salutation,
            p.first_mid_name,
            p.last_name,
            p.country_code,
            p.mobile_number,
            p.kewarganegaraan,
            p.tanggal_lahir,
            CASE
                WHEN m.email IS NOT NULL THEN %s
                WHEN s.email IS NOT NULL THEN %s
                ELSE NULL
            END AS role
        FROM pengguna p
        LEFT JOIN member m ON m.email = p.email
        LEFT JOIN staf s ON s.email = p.email
        WHERE LOWER(p.email) = LOWER(TRIM(%s))
        LIMIT 1
        """,
        [ROLE_MEMBER, ROLE_STAF, email],
    )


def get_member_dashboard(email):
    return fetch_one(
        """
        SELECT
            m.nomor_member,
            m.award_miles,
            m.total_miles,
            m.tanggal_bergabung,
            t.id_tier,
            t.nama AS nama_tier
        FROM member m
        JOIN tier t ON t.id_tier = m.id_tier
        WHERE LOWER(m.email) = LOWER(TRIM(%s))
        LIMIT 1
        """,
        [email],
    )


def get_staff_dashboard(email):
    return fetch_one(
        """
        SELECT
            s.id_staf,
            s.kode_maskapai,
            ma.nama_maskapai
        FROM staf s
        JOIN maskapai ma ON ma.kode_maskapai = s.kode_maskapai
        WHERE LOWER(s.email) = LOWER(TRIM(%s))
        LIMIT 1
        """,
        [email],
    )


def get_member_recent_transactions(email):
    return fetch_all(
        """
        SELECT jenis, "timestamp", jumlah_miles, deskripsi
        FROM (
            SELECT
                'Transfer Keluar' AS jenis,
                t.time_stamp AS "timestamp",
                -t.jumlah AS jumlah_miles,
                COALESCE(t.catatan, '') AS deskripsi
            FROM transfer t
            WHERE LOWER(t.email_member_1) = LOWER(TRIM(%s))

            UNION ALL

            SELECT
                'Transfer Masuk' AS jenis,
                t.time_stamp AS "timestamp",
                t.jumlah AS jumlah_miles,
                COALESCE(t.catatan, '') AS deskripsi
            FROM transfer t
            WHERE LOWER(t.email_member_2) = LOWER(TRIM(%s))

            UNION ALL

            SELECT
                'Redeem' AS jenis,
                r.time_stamp AS "timestamp",
                -h.miles AS jumlah_miles,
                h.nama AS deskripsi
            FROM redeem r
            JOIN hadiah h ON h.kode_hadiah = r.kode_hadiah
            WHERE LOWER(r.email_member) = LOWER(TRIM(%s))

            UNION ALL

            SELECT
                'Beli Package' AS jenis,
                map.time_stamp AS "timestamp",
                amp.jumlah_award_miles AS jumlah_miles,
                amp.id AS deskripsi
            FROM member_award_miles_package map
            JOIN award_miles_package amp ON amp.id = map.id_award_miles_package
            WHERE LOWER(map.email_member) = LOWER(TRIM(%s))

            UNION ALL

            SELECT
                'Klaim Missing Miles' AS jenis,
                c.time_stamp AS "timestamp",
                1000 AS jumlah_miles,
                c.flight_number AS deskripsi
            FROM claim_missing_miles c
            WHERE LOWER(c.email_member) = LOWER(TRIM(%s))
              AND c.status_penerimaan = %s
        ) AS transactions
        ORDER BY "timestamp" DESC
        LIMIT 5
        """,
        [email, email, email, email, email, CLAIM_STATUS_APPROVED],
    )


def get_staff_claim_summary(email):
    return fetch_one(
        """
        SELECT
            COUNT(*) FILTER (WHERE status_penerimaan = %s) AS pending_all_staff,
            COUNT(*) FILTER (
                WHERE status_penerimaan = %s
                  AND LOWER(email_staf) = LOWER(TRIM(%s))
            ) AS approved_by_this_staff,
            COUNT(*) FILTER (
                WHERE status_penerimaan = %s
                  AND LOWER(email_staf) = LOWER(TRIM(%s))
            ) AS rejected_by_this_staff
        FROM claim_missing_miles
        """,
        [
            CLAIM_STATUS_PENDING,
            CLAIM_STATUS_APPROVED,
            email,
            CLAIM_STATUS_REJECTED,
            email,
        ],
    )


def format_member_dashboard(profile, member, recent_transactions):
    return {
        'role': ROLE_MEMBER,
        'profile': format_profile(profile),
        'member': {
            'nomor_member': member['nomor_member'],
            'tier': {
                'id_tier': member['id_tier'],
                'nama': member['nama_tier'],
            },
            'award_miles': member['award_miles'],
            'total_miles': member['total_miles'],
            'tanggal_bergabung': member['tanggal_bergabung'],
        },
        'recent_transactions': recent_transactions,
    }


def format_staff_dashboard(profile, staff, claim_summary):
    return {
        'role': ROLE_STAF,
        'profile': format_profile(profile),
        'staf': {
            'id_staf': staff['id_staf'],
            'kode_maskapai': staff['kode_maskapai'],
            'nama_maskapai': staff['nama_maskapai'],
        },
        'claim_summary': claim_summary,
    }


def get_dashboard(email):
    profile = get_user_profile_by_email(email)
    if not profile:
        raise DashboardUserNotFound(ERROR_USER_NOT_FOUND)

    if profile['role'] == ROLE_MEMBER:
        member = get_member_dashboard(email)
        if not member:
            raise DashboardInvalidRole(ERROR_INVALID_USER_ROLE)

        return format_member_dashboard(
            profile,
            member,
            get_member_recent_transactions(email),
        )

    if profile['role'] == ROLE_STAF:
        staff = get_staff_dashboard(email)
        if not staff:
            raise DashboardInvalidRole(ERROR_INVALID_USER_ROLE)

        return format_staff_dashboard(
            profile,
            staff,
            get_staff_claim_summary(email),
        )

    raise DashboardInvalidRole(ERROR_INVALID_USER_ROLE)


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
