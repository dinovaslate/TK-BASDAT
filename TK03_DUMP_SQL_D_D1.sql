DROP SCHEMA IF EXISTS AEROMILES CASCADE;

CREATE SCHEMA AEROMILES;
SET search_path TO AEROMILES;

CREATE TABLE AEROMILES.PENGGUNA (
    email VARCHAR(100) PRIMARY KEY,
    pwd VARCHAR(255) NOT NULL,
    salutation VARCHAR(10) NOT NULL,
    first_mid_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(5) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    kewarganegaraan VARCHAR(50) NOT NULL
);


CREATE SEQUENCE nomor_member_seq START 1;
CREATE SEQUENCE nomor_staf_seq START 1;
CREATE SEQUENCE id_amp_seq START 1;
CREATE SEQUENCE kode_hadiah_seq START 1;
CREATE SEQUENCE id_claim_seq START 1;

CREATE TABLE TIER (
    id_tier VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    minimal_frekuensi_terbang INTEGER NOT NULL CHECK (minimal_frekuensi_terbang >= 0),
    minimal_tier_miles INTEGER NOT NULL CHECK (minimal_tier_miles >= 0)
);

CREATE TABLE MEMBER (
    email VARCHAR(100) PRIMARY KEY,
    nomor_member VARCHAR(20) NOT NULL UNIQUE DEFAULT ('M' || LPAD(nextval('nomor_member_seq')::text, 4, '0')),
    tanggal_bergabung DATE NOT NULL,
    id_tier VARCHAR(10) NOT NULL,
    award_miles INTEGER NOT NULL DEFAULT 0 CHECK (award_miles >= 0),
    total_miles INTEGER NOT NULL DEFAULT 0 CHECK (total_miles >= 0),
    FOREIGN KEY (email) REFERENCES PENGGUNA (email) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_tier) REFERENCES TIER (id_tier) ON UPDATE CASCADE ON DELETE RESTRICT 
);

CREATE TABLE PENYEDIA (
    id SERIAL PRIMARY KEY
);

CREATE TABLE MASKAPAI (
    kode_maskapai VARCHAR(10) PRIMARY KEY,
    nama_maskapai VARCHAR(100) NOT NULL,
    id_penyedia INTEGER NOT NULL,
    FOREIGN KEY (id_penyedia) REFERENCES PENYEDIA (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE STAF (
    email VARCHAR(100) PRIMARY KEY,
    id_staf VARCHAR(20) NOT NULL UNIQUE DEFAULT ('S' || LPAD(nextval('nomor_staf_seq')::text, 4, '0')),
    kode_maskapai VARCHAR(10) NOT NULL,
    FOREIGN KEY (email) REFERENCES PENGGUNA (email) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (kode_maskapai) REFERENCES MASKAPAI (kode_maskapai) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE MITRA (
    email_mitra VARCHAR(100) PRIMARY KEY,
    id_penyedia INTEGER NOT NULL UNIQUE,
    nama_mitra VARCHAR(100) NOT NULL,
    tanggal_kerja_sama DATE NOT NULL,
    FOREIGN KEY (id_penyedia) REFERENCES PENYEDIA (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IDENTITAS (
    nomor VARCHAR(50) PRIMARY KEY,
    email_member VARCHAR(100) NOT NULL,
    tanggal_habis DATE NOT NULL,
    tanggal_terbit DATE NOT NULL,
    CONSTRAINT valid_identity_dates CHECK (tanggal_habis > tanggal_terbit),
    negara_penerbit VARCHAR(50) NOT NULL,
    jenis VARCHAR(30) NOT NULL CONSTRAINT jenis_types CHECK (jenis IN ('Paspor', 'KTP', 'SIM')),
    FOREIGN KEY (email_member) REFERENCES MEMBER (email) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE AWARD_MILES_PACKAGE (
    id VARCHAR(20) PRIMARY KEY DEFAULT ('AMP-' || LPAD(nextval('id_amp_seq')::text, 3, '0')),
    harga_paket DECIMAL(15, 2) NOT NULL CHECK (harga_paket > 0),
    jumlah_award_miles INTEGER NOT NULL CHECK (jumlah_award_miles > 0)
);

CREATE TABLE MEMBER_AWARD_MILES_PACKAGE (
    id_award_miles_package VARCHAR(20) NOT NULL,
    email_member VARCHAR(100) NOT NULL,
    time_stamp TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id_award_miles_package, email_member, time_stamp),
    FOREIGN KEY (id_award_miles_package) REFERENCES AWARD_MILES_PACKAGE (id),
    FOREIGN KEY (email_member) REFERENCES MEMBER (email) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE BANDARA (
    iata_code CHAR(3) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    kota VARCHAR(100) NOT NULL,
    negara VARCHAR(100) NOT NULL
);

CREATE TABLE CLAIM_MISSING_MILES (
    id VARCHAR(20) NOT NULL UNIQUE DEFAULT ('CLM-' || LPAD(nextval('id_claim_seq')::text, 3, '0')),
    email_member VARCHAR(100) NOT NULL,
    email_staf VARCHAR(100),
    maskapai VARCHAR(10) NOT NULL,
    bandara_asal CHAR(3) NOT NULL,
    bandara_tujuan CHAR(3) NOT NULL,
    tanggal_penerbangan DATE NOT NULL,
    flight_number VARCHAR(10) NOT NULL,
    nomor_tiket VARCHAR(20) NOT NULL,
    kelas_kabin VARCHAR(20) NOT NULL CONSTRAINT kelas_kabin_types CHECK (kelas_kabin IN ('Economy', 'Business', 'First')),
    pnr VARCHAR(10) NOT NULL,
    status_penerimaan VARCHAR(20) NOT NULL DEFAULT 'Menunggu' CONSTRAINT status_penerimaan_types CHECK (status_penerimaan IN ('Menunggu', 'Disetujui', 'Ditolak')),
    time_stamp TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY (email_member) REFERENCES MEMBER (email) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (email_staf) REFERENCES STAF (email) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (maskapai) REFERENCES MASKAPAI (kode_maskapai) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (bandara_asal) REFERENCES BANDARA (iata_code) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (bandara_tujuan) REFERENCES BANDARA (iata_code) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT different_airports CHECK (bandara_asal <> bandara_tujuan),
    UNIQUE (email_member, flight_number, tanggal_penerbangan, nomor_tiket)
);

CREATE TABLE TRANSFER (
    email_member_1 VARCHAR(100) NOT NULL,
    email_member_2 VARCHAR(100) NOT NULL,
    time_stamp TIMESTAMP NOT NULL DEFAULT now(),
    jumlah INTEGER NOT NULL,
    catatan VARCHAR(255),
    PRIMARY KEY (email_member_1, email_member_2, time_stamp),
    FOREIGN KEY (email_member_1) REFERENCES MEMBER (email) ON UPDATE CASCADE ON DELETE CASCADE, 
    FOREIGN KEY (email_member_2) REFERENCES MEMBER (email) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT no_self_transfer CHECK (email_member_1 <> email_member_2),
    CONSTRAINT positive_transfer_amount CHECK (jumlah > 0)
);

CREATE TABLE HADIAH (
    kode_hadiah VARCHAR(20) PRIMARY KEY DEFAULT ('RWD-' || LPAD(nextval('kode_hadiah_seq')::text, 3, '0')),
    nama VARCHAR(100) NOT NULL,
    miles INTEGER NOT NULL CHECK (miles > 0),
    deskripsi TEXT,
    valid_start_date DATE NOT NULL,
    program_end DATE NOT NULL,
    CONSTRAINT valid_reward_dates CHECK (program_end > valid_start_date), 
    id_penyedia INTEGER NOT NULL,
    FOREIGN KEY (id_penyedia) REFERENCES PENYEDIA (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE REDEEM (
    email_member VARCHAR(100) NOT NULL,
    kode_hadiah VARCHAR(20) NOT NULL,
    time_stamp TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (email_member, kode_hadiah, time_stamp),
    FOREIGN KEY (email_member) REFERENCES MEMBER (email) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (kode_hadiah) REFERENCES HADIAH (kode_hadiah) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create dummy data
INSERT INTO PENGGUNA (email, salutation, first_mid_name, last_name, country_code, mobile_number, tanggal_lahir, kewarganegaraan, pwd)
VALUES ('user1@mail.com', 'Mr. ', 'Arya Putra', 'Parikesit', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user2@mail.com', 'Mr. ', 'Ahmad', 'Yaqdhan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user3@mail.com', 'Mr. ', 'Kadek Ngurah Septyawan Chandra', 'Diputra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user4@mail.com', 'Mr. ', 'Hasanul', 'Muttaqin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user5@mail.com', 'Mr. ', 'Khawarizmi', 'Aydin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user6@mail.com', 'Dr. ', 'Haekal Alexander', 'Dinova', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user7@mail.com', 'Dr. ', 'Gregorius Ega Aditama', 'Sudjali', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user8@mail.com', 'Dr. ', 'Tirta Rendy', 'Siahaan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user9@mail.com', 'Dr. ', 'Marvel', 'Irawan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user10@mail.com', 'Dr. ', 'Marco', 'Imanuel', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user11@mail.com', 'Dr. ', 'Naufal Zafran', 'Fadil', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user12@mail.com', 'Mr. ', 'Erico Putra Bani', 'Mahendra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user13@mail.com', 'Mr. ', 'Deltakristiano', 'Kurniaputra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user14@mail.com', 'Mr. ', 'Amar', 'Hakim', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user15@mail.com', 'Mr. ', 'Ganesha', 'Taqwa', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user16@mail.com', 'Dr. ', 'Dery Andreas', 'Tampubolon', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user17@mail.com', 'Dr. ', 'Hamiz', 'Ghani', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user18@mail.com', 'Dr. ', 'Nuril Izza', 'Ahmady', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user19@mail.com', 'Dr. ', 'Rafa Rally', 'Soelistiono', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user20@mail.com', 'Dr. ', 'Faiz Yusuf', 'Ridwan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user21@mail.com', 'Mr. ', 'Arya Putra', 'Parikesit', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user22@mail.com', 'Mr. ', 'Ahmad', 'Yaqdhan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user23@mail.com', 'Mr. ', 'Kadek Ngurah Septyawan Chandra', 'Diputra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user24@mail.com', 'Mr. ', 'Hasanul', 'Muttaqin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user25@mail.com', 'Mr. ', 'Khawarizmi', 'Aydin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user26@mail.com', 'Dr. ', 'Haekal Alexander', 'Dinova', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user27@mail.com', 'Dr. ', 'Gregorius Ega Aditama', 'Sudjali', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user28@mail.com', 'Dr. ', 'Tirta Rendy', 'Siahaan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user29@mail.com', 'Dr. ', 'Marvel', 'Irawan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user30@mail.com', 'Dr. ', 'Marco', 'Imanuel', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user31@mail.com', 'Mr. ', 'Arya Putra', 'Parikesit', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user32@mail.com', 'Mr. ', 'Ahmad', 'Yaqdhan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user33@mail.com', 'Mr. ', 'Kadek Ngurah Septyawan Chandra', 'Diputra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user34@mail.com', 'Mr. ', 'Hasanul', 'Muttaqin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user35@mail.com', 'Mr. ', 'Khawarizmi', 'Aydin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user36@mail.com', 'Dr. ', 'Haekal Alexander', 'Dinova', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user37@mail.com', 'Dr. ', 'Gregorius Ega Aditama', 'Sudjali', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user38@mail.com', 'Dr. ', 'Tirta Rendy', 'Siahaan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user39@mail.com', 'Dr. ', 'Marvel', 'Irawan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user40@mail.com', 'Dr. ', 'Marco', 'Imanuel', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user41@mail.com', 'Mr. ', 'Arya Putra', 'Parikesit', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user42@mail.com', 'Mr. ', 'Ahmad', 'Yaqdhan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user43@mail.com', 'Mr. ', 'Kadek Ngurah Septyawan Chandra', 'Diputra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user44@mail.com', 'Mr. ', 'Hasanul', 'Muttaqin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user45@mail.com', 'Mr. ', 'Khawarizmi', 'Aydin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user46@mail.com', 'Dr. ', 'Haekal Alexander', 'Dinova', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user47@mail.com', 'Dr. ', 'Gregorius Ega Aditama', 'Sudjali', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user48@mail.com', 'Dr. ', 'Tirta Rendy', 'Siahaan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user49@mail.com', 'Dr. ', 'Marvel', 'Irawan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user50@mail.com', 'Dr. ', 'Marco', 'Imanuel', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user51@mail.com', 'Mr. ', 'Arya Putra', 'Parikesit', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user52@mail.com', 'Mr. ', 'Ahmad', 'Yaqdhan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user53@mail.com', 'Mr. ', 'Kadek Ngurah Septyawan Chandra', 'Diputra', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user54@mail.com', 'Mr. ', 'Hasanul', 'Muttaqin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user55@mail.com', 'Mr. ', 'Khawarizmi', 'Aydin', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user56@mail.com', 'Dr. ', 'Haekal Alexander', 'Dinova', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user57@mail.com', 'Dr. ', 'Gregorius Ega Aditama', 'Sudjali', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user58@mail.com', 'Dr. ', 'Tirta Rendy', 'Siahaan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user59@mail.com', 'Dr. ', 'Marvel', 'Irawan', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'),
('user60@mail.com', 'Dr. ', 'Marco', 'Imanuel', '+1', '1', '2000-01-01', 'Indonesian', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

INSERT INTO TIER(id_tier, nama, minimal_frekuensi_terbang, minimal_tier_miles)
VALUES ('t1', 'Blue', 0, 0),
('t2', 'Silver', 10, 10000),
('t3', 'Gold', 20, 15000),
('t4', 'Platinum', 55, 25000);

INSERT INTO MEMBER(email, tanggal_bergabung, id_tier)
VALUES ('user1@mail.com', '2026-04-19', 't1'),
('user2@mail.com', '2026-04-19', 't1'),
('user3@mail.com', '2026-04-19', 't1'),
('user4@mail.com', '2026-04-19', 't1'),
('user5@mail.com', '2026-04-19', 't1'),
('user6@mail.com', '2026-04-19', 't1'),
('user7@mail.com', '2026-04-19', 't1'),
('user8@mail.com', '2026-04-19', 't1'),
('user9@mail.com', '2026-04-19', 't1'),
('user10@mail.com', '2026-04-19', 't1'),
('user11@mail.com', '2026-04-19', 't1'),
('user12@mail.com', '2026-04-19', 't1'),
('user13@mail.com', '2026-04-19', 't1'),
('user14@mail.com', '2026-04-19', 't1'),
('user15@mail.com', '2026-04-19', 't1'),
('user16@mail.com', '2026-04-19', 't1'),
('user17@mail.com', '2026-04-19', 't1'),
('user18@mail.com', '2026-04-19', 't1'),
('user19@mail.com', '2026-04-19', 't1'),
('user20@mail.com', '2026-04-19', 't1'),
('user21@mail.com', '2026-04-19', 't1'),
('user22@mail.com', '2026-04-19', 't1'),
('user23@mail.com', '2026-04-19', 't1'),
('user24@mail.com', '2026-04-19', 't1'),
('user25@mail.com', '2026-04-19', 't1'),
('user26@mail.com', '2026-04-19', 't1'),
('user27@mail.com', '2026-04-19', 't1'),
('user28@mail.com', '2026-04-19', 't1'),
('user29@mail.com', '2026-04-19', 't1'),
('user30@mail.com', '2026-04-19', 't1'),
('user31@mail.com', '2026-04-19', 't1'),
('user32@mail.com', '2026-04-19', 't1'),
('user33@mail.com', '2026-04-19', 't1'),
('user34@mail.com', '2026-04-19', 't1'),
('user35@mail.com', '2026-04-19', 't1'),
('user36@mail.com', '2026-04-19', 't1'),
('user37@mail.com', '2026-04-19', 't1'),
('user38@mail.com', '2026-04-19', 't1'),
('user39@mail.com', '2026-04-19', 't1'),
('user40@mail.com', '2026-04-19', 't1'),
('user41@mail.com', '2026-04-19', 't1'),
('user42@mail.com', '2026-04-19', 't1'),
('user43@mail.com', '2026-04-19', 't1'),
('user44@mail.com', '2026-04-19', 't1'),
('user45@mail.com', '2026-04-19', 't1'),
('user46@mail.com', '2026-04-19', 't1'),
('user47@mail.com', '2026-04-19', 't1'),
('user48@mail.com', '2026-04-19', 't1'),
('user49@mail.com', '2026-04-19', 't1'),
('user50@mail.com', '2026-04-19', 't1');

-- Give members enough miles so TRANSFER dummy data is realistic.
UPDATE MEMBER
SET award_miles = 10000,
    total_miles = 10000;

INSERT INTO PENYEDIA (id)
SELECT generate_series(1, 10);

-- Keep the SERIAL sequence aligned after explicit IDs.
SELECT setval(pg_get_serial_sequence('PENYEDIA', 'id'), (SELECT MAX(id) FROM PENYEDIA));

INSERT INTO MASKAPAI (kode_maskapai, nama_maskapai, id_penyedia)
VALUES ('GA', 'Garuda Indonesia', 1),
('JT', 'Lion Air', 2),
('SQ', 'Singapore Airlines', 3),
('QZ', 'Indonesia AirAsia', 4),
('JL', 'Japan Airlines', 5);

INSERT INTO STAF (email, kode_maskapai)
VALUES ('user51@mail.com', 'GA'),
('user52@mail.com', 'GA'),
('user53@mail.com', 'JT'),
('user54@mail.com', 'JT'),
('user55@mail.com', 'SQ'),
('user56@mail.com', 'SQ'),
('user57@mail.com', 'QZ'),
('user58@mail.com', 'QZ'),
('user59@mail.com', 'JL'),
('user60@mail.com', 'JL');

INSERT INTO MITRA (email_mitra, id_penyedia, nama_mitra, tanggal_kerja_sama)
VALUES ('mitra1@mail.com', 6, 'Mitra 1', '2026-04-19'),
('mitra2@mail.com', 7, 'Mitra 2', '2026-04-19'),
('mitra3@mail.com', 8, 'Mitra 3', '2026-04-19'),
('mitra4@mail.com', 9, 'Mitra 4', '2026-04-19'),
('mitra5@mail.com', 10, 'Mitra 5', '2026-04-19');

INSERT INTO IDENTITAS (nomor, email_member, tanggal_terbit, tanggal_habis, negara_penerbit, jenis)
VALUES ('ID-001', 'user1@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-002', 'user1@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-003', 'user2@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-004', 'user2@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-005', 'user3@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-006', 'user3@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-007', 'user4@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-008', 'user4@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-009', 'user5@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-010', 'user5@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-011', 'user6@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-012', 'user6@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-013', 'user7@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-014', 'user7@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-015', 'user8@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-016', 'user8@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-017', 'user9@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-018', 'user9@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-019', 'user10@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-020', 'user10@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-021', 'user11@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-022', 'user11@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-023', 'user12@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-024', 'user13@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-025', 'user13@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-026', 'user14@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-027', 'user14@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-028', 'user15@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP'),
('ID-029', 'user15@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'Paspor'),
('ID-030', 'user16@mail.com', '2020-01-01', '2030-01-01', 'Indonesia', 'KTP');

INSERT INTO AWARD_MILES_PACKAGE (harga_paket, jumlah_award_miles)
VALUES (99.99, 250),
(199.99, 540),
(299.99, 800),
(399.99, 1100),
(499.99, 1400);

INSERT INTO MEMBER_AWARD_MILES_PACKAGE (id_award_miles_package, email_member)
VALUES ('AMP-001', 'user1@mail.com'),
('AMP-001', 'user2@mail.com'),
('AMP-001', 'user3@mail.com'),
('AMP-001', 'user4@mail.com'),
('AMP-001', 'user5@mail.com'),
('AMP-002', 'user6@mail.com'),
('AMP-002', 'user7@mail.com'),
('AMP-002', 'user8@mail.com'),
('AMP-002', 'user9@mail.com'),
('AMP-002', 'user10@mail.com'),
('AMP-002', 'user11@mail.com'),
('AMP-003', 'user12@mail.com'),
('AMP-003', 'user13@mail.com'),
('AMP-003', 'user14@mail.com'),
('AMP-003', 'user15@mail.com'),
('AMP-003', 'user16@mail.com'),
('AMP-004', 'user17@mail.com'),
('AMP-004', 'user18@mail.com'),
('AMP-004', 'user19@mail.com'),
('AMP-005', 'user20@mail.com');

INSERT INTO BANDARA (iata_code, nama, kota, negara)
VALUES ('CGK', 'Soekarno-Hatta International Airport', 'Jakarta', 'Indonesia'),
('HLP', 'Halim Perdanakusuma International Airport', 'Jakarta', 'Indonesia'),
('SUB', 'Juanda International Airport', 'Surabaya', 'Indonesia'),
('KNO', 'Kualanamu International Airport', 'Medan', 'Indonesia'),
('DPS', 'Ngurah Rai International Airport', 'Denpasar', 'Indonesia'),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States'),
('JFK', 'John F. Kennedy International Airport', 'New York City', 'United States'),
('DFW', 'Dallas/Fort Worth International Airport', 'Dallas', 'United States'),
('SFO', 'San Francisco International Airport', 'San Francisco', 'United States'),
('LAS', 'Harry Reid International Airport', 'Las Vegas', 'United States'),
('HND', 'Tokyo Haneda Airport', 'Tokyo', 'Japan'),
('PVG', 'Shanghai Pudong International Airport', 'Shanghai', 'China'),
('CDG', 'Paris Charles de Gaulle International Airport', 'Paris', 'France'),
('AMS', 'Amsterdam Airport Schiphol', 'Amsterdam', 'Netherlands'),
('LHR', 'Heathrow Airport', 'London', 'United Kingdom');

INSERT INTO CLAIM_MISSING_MILES (email_member, maskapai, bandara_asal, bandara_tujuan, tanggal_penerbangan, nomor_tiket, flight_number, kelas_kabin, pnr)
VALUES ('user1@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Economy', 'A1'),
('user2@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Economy', 'A2'),
('user3@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Business', 'A3'),
('user4@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'First', 'A4'),
('user5@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Economy', 'A5'),
('user1@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A1'),
('user2@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A2'),
('user3@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A3'),
('user4@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A4'),
('user5@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A5'),
('user6@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Economy', 'A1'),
('user7@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Economy', 'A2'),
('user8@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Business', 'A3'),
('user9@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'First', 'A4'),
('user10@mail.com', 'GA', 'CGK', 'AMS', '2026-04-19', '101', 'GA001', 'Economy', 'A5'),
('user6@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A1'),
('user7@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A2'),
('user8@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A3'),
('user9@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A4'),
('user10@mail.com', 'JL', 'DPS', 'HND', '2026-04-19', '101', 'JL001', 'Economy', 'A5');

-- Make claim statuses varied for the staff claim-management UI.
UPDATE CLAIM_MISSING_MILES
SET status_penerimaan = 'Disetujui',
    email_staf = 'user51@mail.com'
WHERE id IN ('CLM-001', 'CLM-003', 'CLM-011', 'CLM-013');

UPDATE CLAIM_MISSING_MILES
SET status_penerimaan = 'Ditolak',
    email_staf = 'user53@mail.com'
WHERE id IN ('CLM-002', 'CLM-004', 'CLM-012', 'CLM-014');

INSERT INTO TRANSFER (email_member_1, email_member_2, jumlah)
VALUES ('user1@mail.com', 'user2@mail.com', 1000),
('user2@mail.com', 'user3@mail.com', 1000),
('user3@mail.com', 'user4@mail.com', 1000),
('user4@mail.com', 'user5@mail.com', 1000),
('user5@mail.com', 'user6@mail.com', 1000),
('user21@mail.com', 'user31@mail.com', 200),
('user22@mail.com', 'user32@mail.com', 200),
('user23@mail.com', 'user33@mail.com', 200),
('user24@mail.com', 'user34@mail.com', 200),
('user25@mail.com', 'user35@mail.com', 200),
('user31@mail.com', 'user41@mail.com', 5000),
('user32@mail.com', 'user42@mail.com', 5000),
('user33@mail.com', 'user43@mail.com', 5000),
('user34@mail.com', 'user44@mail.com', 5000),
('user35@mail.com', 'user45@mail.com', 5000);

INSERT INTO HADIAH (nama, miles, valid_start_date, program_end, id_penyedia)
VALUES ('Hadiah 1', 1000, '2026-01-01', '2027-01-01', 1),
('Hadiah 2', 2000, '2026-01-01', '2027-01-01', 1),
('Hadiah 3', 3000, '2026-01-01', '2027-01-01', 1),
('Hadiah 4', 4000, '2026-01-01', '2027-01-01', 1),
('Hadiah 5', 5000, '2026-01-01', '2027-01-01', 1),
('Hadiah 6', 1000, '2026-01-01', '2027-01-01', 1),
('Hadiah 7', 2000, '2026-01-01', '2027-01-01', 2),
('Hadiah 8', 3000, '2026-01-01', '2027-01-01', 3),
('Hadiah 9', 4000, '2026-01-01', '2027-01-01', 4),
('Hadiah 10', 5000, '2026-01-01', '2027-01-01', 5),
('Hadiah 11', 1000, '2026-01-01', '2027-01-01', 1),
('Hadiah 12', 2000, '2026-01-01', '2027-01-01', 2),
('Hadiah 13', 3000, '2026-01-01', '2027-01-01', 3),
('Hadiah 14', 4000, '2026-01-01', '2027-01-01', 4),
('Hadiah 15', 5000, '2026-01-01', '2027-01-01', 5);

INSERT INTO REDEEM (email_member, kode_hadiah)
VALUES ('user1@mail.com', 'RWD-001'),
('user2@mail.com', 'RWD-001'),
('user3@mail.com', 'RWD-002'),
('user4@mail.com', 'RWD-002'),
('user5@mail.com', 'RWD-003'),
('user6@mail.com', 'RWD-003'),
('user7@mail.com', 'RWD-004'),
('user8@mail.com', 'RWD-004'),
('user9@mail.com', 'RWD-005'),
('user10@mail.com', 'RWD-005'),
('user11@mail.com', 'RWD-006'),
('user12@mail.com', 'RWD-006'),
('user13@mail.com', 'RWD-007'),
('user14@mail.com', 'RWD-007'),
('user15@mail.com', 'RWD-008'),
('user16@mail.com', 'RWD-008'),
('user17@mail.com', 'RWD-009'),
('user18@mail.com', 'RWD-009'),
('user19@mail.com', 'RWD-010'),
('user20@mail.com', 'RWD-010');
