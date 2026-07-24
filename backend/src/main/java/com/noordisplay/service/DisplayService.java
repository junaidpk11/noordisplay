package com.noordisplay.service;

import com.noordisplay.entity.Announcement;
import com.noordisplay.entity.Masjid;
import com.noordisplay.entity.PrayerTimes;
import com.noordisplay.repository.AnnouncementRepository;
import com.noordisplay.repository.MasjidRepository;
import com.noordisplay.repository.PrayerTimesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DisplayService {

    private final MasjidRepository masjidRepository;
    private final PrayerTimesRepository prayerTimesRepository;
    private final AnnouncementRepository announcementRepository;
    private final MasjidTimeService masjidTimeService;

    public Map<String, Object> getDisplayData(String slug) {
        Masjid masjid = masjidRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Masjid not found: " + slug));

        LocalDate localDate = masjidTimeService.localDate(masjid);
        PrayerTimes today = prayerTimesRepository
            .findByMasjidIdAndPrayerDate(masjid.getId(), localDate)
            .orElse(null);

        List<Announcement> announcements = announcementRepository
            .findActiveForToday(masjid.getId(), localDate);

        log.debug(
            "Display data lookup masjid={} timezone={} localDate={} prayerTimesFound={} announcementCount={}",
            masjid.getSlug(),
            masjid.getTimezone(),
            localDate,
            today != null,
            announcements.size()
        );

        return Map.of(
            "masjid", masjid,
            "prayerTimes", today != null ? today : Map.of(),
            "announcements", announcements,
            "features", masjid.getFeatures()
        );
    }

    public Masjid getMasjid(String slug) {
        return masjidRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Masjid not found"));
    }
}
