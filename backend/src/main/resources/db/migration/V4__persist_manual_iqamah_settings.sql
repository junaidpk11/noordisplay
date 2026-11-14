ALTER TABLE prayer_times
    ADD COLUMN iqamah_manual BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserve settings that administrators already saved before this flag existed.
UPDATE prayer_times
SET iqamah_manual = TRUE
WHERE source = 'MANUAL';
