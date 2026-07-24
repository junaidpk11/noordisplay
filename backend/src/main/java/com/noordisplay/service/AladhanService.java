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

    private final MasjidRepository masjidRepository;
    private final PrayerTimesRepository prayerTimesRepository;
    private final RestTemplate restTemplate;
    private final MasjidTimeService masjidTimeService;

    @Value("${app.aladhan.base-url}")
    private String baseUrl;

    /** Ensures every masjid has prayer times for its own local calendar date. */
    @PostConstruct
    public void syncOnStartup() {
        log.info("Prayer-time startup check beginning");
        syncMissingLocalDates("startup");
    }

    /**
     * Runs hourly at minute 5. This is intentionally timezone-neutral: each
     * masjid is checked against its own local date, and the external API is
     * called only when that date is missing.
     */
    @Scheduled(cron = "0 5 * * * *")
    public void syncAllMasjids() {
        syncMissingLocalDates("hourly-scheduler");
    }

    private void syncMissingLocalDates(String trigger) {
        List<Masjid> masjids = masjidRepository.findAll();
        log.info("Prayer-time sync check trigger={} masjidCount={}", trigger, masjids.size());

        for (Masjid masjid : masjids) {
            LocalDate localDate = masjidTimeService.localDate(masjid);
            boolean exists = prayerTimesRepository
                .findByMasjidIdAndPrayerDate(masjid.getId(), localDate)
                .isPresent();

            log.debug(
                "Prayer-time sync evaluation trigger={} masjid={} timezone={} localDate={} exists={}",
                trigger,
                masjid.getSlug(),
                masjid.getTimezone(),
                localDate,
                exists
            );

            if (!exists) {
                log.info(
                    "Prayer times missing trigger={} masjid={} timezone={} localDate={}; fetching",
                    trigger,
                    masjid.getSlug(),
                    masjid.getTimezone(),
                    localDate
                );
                syncMasjidForDate(masjid, localDate);
            }
        }
    }

    public PrayerTimes syncMasjid(Masjid masjid) {
        return syncMasjidForDate(masjid, masjidTimeService.localDate(masjid));
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

            log.info(
                "Calling Aladhan masjid={} timezone={} prayerDate={} latitude={} longitude={} method={}",
                masjid.getSlug(),
                masjid.getTimezone(),
                date,
                masjid.getLatitude(),
                masjid.getLongitude(),
                masjid.getCalcMethod()
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !Integer.valueOf(200).equals(response.get("code"))) {
                log.warn(
                    "Aladhan returned unsuccessful response masjid={} prayerDate={} response={}",
                    masjid.getSlug(),
                    date,
                    response
                );
                return null;
            }

            Map<String, Object> data = (Map<String, Object>) response.get("data");
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

            if (pt.getFajrIqamah() == null && pt.getFajr() != null) pt.setFajrIqamah(pt.getFajr().plusMinutes(20));
            if (pt.getDhuhrIqamah() == null && pt.getDhuhr() != null) pt.setDhuhrIqamah(pt.getDhuhr().plusMinutes(10));
            if (pt.getAsrIqamah() == null && pt.getAsr() != null) pt.setAsrIqamah(pt.getAsr().plusMinutes(10));
            if (pt.getMaghribIqamah() == null && pt.getMaghrib() != null) pt.setMaghribIqamah(pt.getMaghrib().plusMinutes(5));
            if (pt.getIshaIqamah() == null && pt.getIsha() != null) pt.setIshaIqamah(pt.getIsha().plusMinutes(15));

            PrayerTimes saved = prayerTimesRepository.save(pt);
            log.info(
                "Prayer times saved masjid={} timezone={} prayerDate={}",
                masjid.getSlug(),
                masjid.getTimezone(),
                date
            );
            return saved;
        } catch (Exception ex) {
            log.error(
                "Prayer-time sync failed masjid={} timezone={} prayerDate={}",
                masjid.getSlug(),
                masjid.getTimezone(),
                date,
                ex
            );
            return null;
        }
    }

    private LocalTime parseTime(String raw) {
        if (raw == null) return null;
        String clean = raw.replaceAll("\\s*\\(.*\\)", "").trim();
        return LocalTime.parse(clean, DateTimeFormatter.ofPattern("HH:mm"));
    }
}
