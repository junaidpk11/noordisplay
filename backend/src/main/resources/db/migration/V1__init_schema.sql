-- V1__init_schema.sql

CREATE TABLE masjids (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200)        NOT NULL,
    slug        VARCHAR(100)        NOT NULL UNIQUE,
    city        VARCHAR(100),
    country     VARCHAR(100),
    latitude    DOUBLE PRECISION    NOT NULL,
    longitude   DOUBLE PRECISION    NOT NULL,
    timezone    VARCHAR(60)         NOT NULL DEFAULT 'UTC',
    calc_method INTEGER             NOT NULL DEFAULT 2,   -- 2 = ISNA
    accent_color VARCHAR(20)        NOT NULL DEFAULT '#c9a84c',
    language    VARCHAR(20)         NOT NULL DEFAULT 'en',
    active      BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id   UUID REFERENCES masjids(id) ON DELETE CASCADE,
    email       VARCHAR(200)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    role        VARCHAR(30)     NOT NULL DEFAULT 'ADMIN',  -- SUPER_ADMIN | ADMIN
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE prayer_times (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id       UUID        NOT NULL REFERENCES masjids(id) ON DELETE CASCADE,
    prayer_date     DATE        NOT NULL,
    fajr            TIME,
    sunrise         TIME,
    dhuhr           TIME,
    asr             TIME,
    maghrib         TIME,
    isha            TIME,
    fajr_iqamah     TIME,
    dhuhr_iqamah    TIME,
    asr_iqamah      TIME,
    maghrib_iqamah  TIME,
    isha_iqamah     TIME,
    jumuah          TIME,
    source          VARCHAR(20) NOT NULL DEFAULT 'ALADHAN',  -- ALADHAN | MANUAL
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (masjid_id, prayer_date)
);

CREATE TABLE announcements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id   UUID        NOT NULL REFERENCES masjids(id) ON DELETE CASCADE,
    message     TEXT        NOT NULL,
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    starts_at   DATE,
    ends_at     DATE,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE masjid_features (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id               UUID    NOT NULL REFERENCES masjids(id) ON DELETE CASCADE UNIQUE,
    show_quotes             BOOLEAN NOT NULL DEFAULT TRUE,
    show_iqamah             BOOLEAN NOT NULL DEFAULT TRUE,
    show_countdown          BOOLEAN NOT NULL DEFAULT TRUE,
    show_hijri              BOOLEAN NOT NULL DEFAULT TRUE,
    show_ticker             BOOLEAN NOT NULL DEFAULT TRUE,
    show_jumuah_banner      BOOLEAN NOT NULL DEFAULT TRUE,
    show_donation_widget    BOOLEAN NOT NULL DEFAULT FALSE,
    azaan_audio             BOOLEAN NOT NULL DEFAULT FALSE,
    iqamah_screen           BOOLEAN NOT NULL DEFAULT TRUE,
    show_weather            BOOLEAN NOT NULL DEFAULT FALSE,
    quote_interval_secs     INTEGER NOT NULL DEFAULT 12,
    quote_source            VARCHAR(20) NOT NULL DEFAULT 'BOTH',  -- QURAN | HADITH | BOTH
    time_format             VARCHAR(5)  NOT NULL DEFAULT '12h',
    ramadan_mode            BOOLEAN NOT NULL DEFAULT FALSE,
    suhoor_time             TIME,
    tarawih_time            TIME,
    tarawih_rakats          INTEGER NOT NULL DEFAULT 20,
    quran_juz_current       INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_prayer_times_masjid_date ON prayer_times(masjid_id, prayer_date);
CREATE INDEX idx_announcements_masjid     ON announcements(masjid_id);
CREATE INDEX idx_users_masjid             ON users(masjid_id);

-- Seed demo masjid
INSERT INTO masjids (id, name, slug, city, country, latitude, longitude, timezone)
VALUES (
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Masjid Al-Noor',
    'masjid-al-noor',
    'Fredericton',
    'Canada',
    45.9636,
    -66.6431,
    'America/Moncton'
);

INSERT INTO masjid_features (masjid_id)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001');
