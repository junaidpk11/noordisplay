package com.noordisplay.controller;

import com.noordisplay.entity.*;
import com.noordisplay.repository.*;
import com.noordisplay.service.AladhanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AdminController {

    private final MasjidRepository       masjidRepository;
    private final AnnouncementRepository announcementRepository;
    private final PrayerTimesRepository  prayerTimesRepository;
    private final AladhanService         aladhanService;

    // ── Masjid settings ──────────────────────────────────────────────────────

    @GetMapping("/masjid/{id}")
    public ResponseEntity<Masjid> getMasjid(@PathVariable UUID id) {
        return masjidRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/masjid/{id}")
    public ResponseEntity<Masjid> updateMasjid(@PathVariable UUID id,
                                                @RequestBody Masjid payload) {
        return masjidRepository.findById(id).map(m -> {
            m.setName(payload.getName());
            m.setCity(payload.getCity());
            m.setCountry(payload.getCountry());
            m.setLatitude(payload.getLatitude());
            m.setLongitude(payload.getLongitude());
            m.setTimezone(payload.getTimezone());
            m.setCalcMethod(payload.getCalcMethod());
            m.setAccentColor(payload.getAccentColor());
            m.setLanguage(payload.getLanguage());
            m.setSlug(payload.getSlug());
            return ResponseEntity.ok(masjidRepository.save(m));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Features ─────────────────────────────────────────────────────────────

    @PutMapping("/masjid/{id}/features")
    public ResponseEntity<MasjidFeatures> updateFeatures(@PathVariable UUID id,
                                                          @RequestBody MasjidFeatures payload) {
        return masjidRepository.findById(id).map(m -> {
            MasjidFeatures f = m.getFeatures();
            f.setShowQuotes(payload.getShowQuotes());
            f.setShowIqamah(payload.getShowIqamah());
            f.setShowCountdown(payload.getShowCountdown());
            f.setShowHijri(payload.getShowHijri());
            f.setShowTicker(payload.getShowTicker());
            f.setShowJumuahBanner(payload.getShowJumuahBanner());
            f.setShowDonationWidget(payload.getShowDonationWidget());
            f.setAzaanAudio(payload.getAzaanAudio());
            f.setIqamahScreen(payload.getIqamahScreen());
            f.setShowWeather(payload.getShowWeather());
            f.setQuoteIntervalSecs(payload.getQuoteIntervalSecs());
            f.setQuoteSource(payload.getQuoteSource());
            f.setTimeFormat(payload.getTimeFormat());
            f.setRamadanMode(payload.getRamadanMode());
            f.setSuhoorTime(payload.getSuhoorTime());
            f.setTarawihTime(payload.getTarawihTime());
            f.setTarawihRakats(payload.getTarawihRakats());
            f.setQuranJuzCurrent(payload.getQuranJuzCurrent());
            return ResponseEntity.ok(m.getFeatures());
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    @GetMapping("/masjid/{id}/announcements")
    public List<Announcement> getAnnouncements(@PathVariable UUID id) {
        return announcementRepository.findByMasjidIdOrderBySortOrderAsc(id);
    }

    @PostMapping("/masjid/{id}/announcements")
    public ResponseEntity<Announcement> createAnnouncement(@PathVariable UUID id,
                                                            @RequestBody Announcement payload) {
        return masjidRepository.findById(id).map(m -> {
            payload.setMasjid(m);
            return ResponseEntity.ok(announcementRepository.save(payload));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/announcements/{annId}")
    public ResponseEntity<Announcement> updateAnnouncement(@PathVariable UUID annId,
                                                            @RequestBody Announcement payload) {
        return announcementRepository.findById(annId).map(a -> {
            a.setMessage(payload.getMessage());
            a.setActive(payload.getActive());
            a.setStartsAt(payload.getStartsAt());
            a.setEndsAt(payload.getEndsAt());
            a.setSortOrder(payload.getSortOrder());
            return ResponseEntity.ok(announcementRepository.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/announcements/{annId}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable UUID annId) {
        announcementRepository.deleteById(annId);
        return ResponseEntity.noContent().build();
    }

    // ── Prayer time overrides ─────────────────────────────────────────────────

    @PutMapping("/prayer-times/{ptId}")
    public ResponseEntity<PrayerTimes> updatePrayerTimes(@PathVariable UUID ptId,
                                                          @RequestBody PrayerTimes payload) {
        return prayerTimesRepository.findById(ptId).map(pt -> {
            pt.setFajr(payload.getFajr());
            pt.setSunrise(payload.getSunrise());
            pt.setDhuhr(payload.getDhuhr());
            pt.setAsr(payload.getAsr());
            pt.setMaghrib(payload.getMaghrib());
            pt.setIsha(payload.getIsha());
            pt.setFajrIqamah(payload.getFajrIqamah());
            pt.setDhuhrIqamah(payload.getDhuhrIqamah());
            pt.setAsrIqamah(payload.getAsrIqamah());
            pt.setMaghribIqamah(payload.getMaghribIqamah());
            pt.setIshaIqamah(payload.getIshaIqamah());
            pt.setJumuah(payload.getJumuah());
            pt.setSource("MANUAL");
            return ResponseEntity.ok(prayerTimesRepository.save(pt));
        }).orElse(ResponseEntity.notFound().build());
    }
}
