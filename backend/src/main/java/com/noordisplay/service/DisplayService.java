package com.noordisplay.service;

import com.noordisplay.entity.*;
import com.noordisplay.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisplayService {

    private final MasjidRepository       masjidRepository;
    private final PrayerTimesRepository  prayerTimesRepository;
    private final AnnouncementRepository announcementRepository;

    public Map<String, Object> getDisplayData(String slug) {
        Masjid masjid = masjidRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Masjid not found: " + slug));

        PrayerTimes today = prayerTimesRepository
            .findByMasjidIdAndPrayerDate(masjid.getId(), LocalDate.now())
            .orElse(null);

        List<Announcement> announcements = announcementRepository
            .findActiveForToday(masjid.getId(), LocalDate.now());

        return Map.of(
            "masjid",       masjid,
            "prayerTimes",  today != null ? today : Map.of(),
            "announcements", announcements,
            "features",     masjid.getFeatures()
        );
    }

    public Masjid getMasjid(String slug) {
    return masjidRepository.findBySlug(slug)
            .orElseThrow(() -> new RuntimeException("Masjid not found"));
    }
}
