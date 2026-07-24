package com.noordisplay.service;

import com.noordisplay.entity.Masjid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

@Service
@Slf4j
public class MasjidTimeService {

    public ZoneId zoneId(Masjid masjid) {
        String configuredTimezone = masjid.getTimezone();
        if (configuredTimezone == null || configuredTimezone.isBlank()) {
            log.warn("Masjid {} has no timezone configured; using UTC", masjid.getSlug());
            return ZoneOffset.UTC;
        }

        try {
            return ZoneId.of(configuredTimezone.trim());
        } catch (Exception ex) {
            log.error(
                "Invalid timezone '{}' for masjid {}; using UTC",
                configuredTimezone,
                masjid.getSlug(),
                ex
            );
            return ZoneOffset.UTC;
        }
    }

    public LocalDate localDate(Masjid masjid) {
        return LocalDate.now(zoneId(masjid));
    }

    public LocalTime localTime(Masjid masjid) {
        return LocalTime.now(zoneId(masjid));
    }
}
