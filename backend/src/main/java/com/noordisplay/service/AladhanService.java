package com.noordisplay.service;

import com.noordisplay.entity.Masjid;
import com.noordisplay.entity.PrayerTimes;
import com.noordisplay.repository.MasjidRepository;
import com.noordisplay.repository.PrayerTimesRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AladhanService {

    private final MasjidRepository      masjidRepository;
    private final PrayerTimesRepository prayerTimesRepository;
    private final RestTemplate          restTemplate;

    @Value("${app.aladhan.base-url}")
    private String baseUrl;

    /**
     * Runs on every backend startup.
     * Ensures prayer times are always populated even after a DB wipe or fresh deploy.
     */
    @PostConstruct
    public void syncOnStartup() {
        log.info("Syncing prayer times on startup...");
        List<Masjid> masjids = masjidRepository.findAll();
        masjids.forEach(masjid -> {
            boolean exists = prayerTimesRepository
                .findByMasjidIdAndPrayerDate(masjid.getId(), LocalDate.now())
                .isPresent();
            if (!exists) {
                log.info("No prayer times found for {} — fetching from Aladhan", masjid.getSlug());
                syncMasjid(masjid);
            } else {
                log.info("Prayer times already exist for {}", masjid.getSlug());
            }
        });
    }

    /** Runs daily at 1 AM to pre-fetch today's times for all masjids */
    @Scheduled(cron = "0 0 1 * * *")
    public void syncAllMasjids() {
        log.info("Daily Aladhan sync running...");
        masjidRepository.findAll().forEach(this::syncMasjid);
    }

    public PrayerTimes syncMasjid(Masjid masjid) {
        return syncMasjidForDate(masjid, LocalDate.now());
    }

    @SuppressWarnings("unchecked")
    public PrayerTimes syncMasjidForDate(Masjid masjid, LocalDate date) {
        try {
            String url = String.format(
                "%s/timings/%d-%d-%d?latitude=%f&longitude=%f&method=%d",
                baseUrl,
                date.getDayOfMonth(), date.getMonthValue(), date.getYear(),
                masjid.getLatitude(), masjid.getLongitude(),
                masjid.getCalcMethod()
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !Integer.valueOf(200).equals(response.get("code"))) {
                log.warn("Aladhan returned non-200 for masjid {}", masjid.getSlug());
                return null;
            }

            Map<String, Object> data    = (Map<String, Object>) response.get("data");
            Map<String, String> timings = (Map<String, String>) data.get("timings");

            PrayerTimes pt = prayerTimesRepository
                .findByMasjidIdAndPrayerDate(masjid.getId(), date)
                .orElseGet(PrayerTimes::new);

            pt.setMasjid(masjid);
            pt.setPrayerDate(date);
            pt.setFajr(parseTime(timings.get("Fajr")));
            pt.setSunrise(parseTime(timings.get("Sunrise")));
            pt.setDhuhr(parseTime(timings.get("Dhuhr")));
            pt.setAsr(parseTime(timings.get("Asr")));
            pt.setMaghrib(parseTime(timings.get("Maghrib")));
            pt.setIsha(parseTime(timings.get("Isha")));
            pt.setSource("ALADHAN");
            pt.setCreatedAt(Instant.now());

            // Default iqamah offsets — only set if not already customised
            if (pt.getFajrIqamah()    == null && pt.getFajr()    != null) pt.setFajrIqamah(pt.getFajr().plusMinutes(20));
            if (pt.getDhuhrIqamah()   == null && pt.getDhuhr()   != null) pt.setDhuhrIqamah(pt.getDhuhr().plusMinutes(10));
            if (pt.getAsrIqamah()     == null && pt.getAsr()     != null) pt.setAsrIqamah(pt.getAsr().plusMinutes(10));
            if (pt.getMaghribIqamah() == null && pt.getMaghrib() != null) pt.setMaghribIqamah(pt.getMaghrib().plusMinutes(5));
            if (pt.getIshaIqamah()    == null && pt.getIsha()    != null) pt.setIshaIqamah(pt.getIsha().plusMinutes(15));

            PrayerTimes saved = prayerTimesRepository.save(pt);
            log.info("Prayer times saved for {} on {}", masjid.getSlug(), date);
            return saved;

        } catch (Exception e) {
            log.error("Failed to sync prayer times for {}: {}", masjid.getSlug(), e.getMessage());
            return null;
        }
    }

    private LocalTime parseTime(String raw) {
        if (raw == null) return null;
        String clean = raw.replaceAll("\\s*\\(.*\\)", "").trim();
        return LocalTime.parse(clean, DateTimeFormatter.ofPattern("HH:mm"));
    }
}
