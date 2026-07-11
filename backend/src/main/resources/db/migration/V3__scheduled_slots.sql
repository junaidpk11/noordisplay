-- V3__scheduled_slots.sql

CREATE TABLE scheduled_slots (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    masjid_id   UUID        NOT NULL REFERENCES masjids(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    slot_type   VARCHAR(30)  NOT NULL,  -- ANNOUNCEMENT | POSTER | QURAN | HADITH | ETIQUETTE | CUSTOM
    start_time  TIME         NOT NULL,
    end_time    TIME         NOT NULL,
    repeat_days VARCHAR(20)  NOT NULL DEFAULT '0123456',  -- string of day numbers e.g. "0156" = Sun,Mon,Fri,Sat
    date_from   DATE,
    date_until  DATE,
    message     TEXT,
    image_url   VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_slots_masjid ON scheduled_slots(masjid_id);
CREATE INDEX idx_scheduled_slots_active ON scheduled_slots(masjid_id, active);
