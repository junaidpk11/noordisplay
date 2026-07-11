package com.noordisplay.service;

import com.noordisplay.entity.MasjidFeatures;
import com.noordisplay.entity.PrayerTimes;
import com.noordisplay.repository.MasjidRepository;
import com.noordisplay.repository.PrayerTimesRepository;
import com.noordisplay.websocket.DisplayPhaseMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class IqamahScheduler {

    private final MasjidRepository      masjidRepository;
    private final PrayerTimesRepository prayerTimesRepository;
    private final SimpMessagingTemplate messaging;

    // Check every 30 seconds
    @Scheduled(fixedRate = 30_000)
    public void checkIqamahPhases() {
        LocalTime now  = LocalTime.now();
        LocalDate today = LocalDate.now();

        masjidRepository.findAll().forEach(masjid -> {
            MasjidFeatures features = masjid.getFeatures();
            if (features == null || !Boolean.TRUE.equals(features.getIqamahScreen())) return;

            Optional<PrayerTimes> ptOpt = prayerTimesRepository
                .findByMasjidIdAndPrayerDate(masjid.getId(), today);
            if (ptOpt.isEmpty()) return;

            PrayerTimes pt = ptOpt.get();
            String phase = resolvePhase(now, pt);

            // Push to /topic/display/{slug}
            messaging.convertAndSend(
                "/topic/display/" + masjid.getSlug(),
                new DisplayPhaseMessage(phase, masjid.getSlug())
            );
        });
    }

    private String resolvePhase(LocalTime now, PrayerTimes pt) {
        List<LocalTime> iqamahs = List.of(
            pt.getFajrIqamah(), pt.getDhuhrIqamah(),
            pt.getAsrIqamah(), pt.getMaghribIqamah(), pt.getIshaIqamah()
        );

        for (LocalTime iq : iqamahs) {
            if (iq == null) continue;
            long diff = java.time.Duration.between(now, iq).toSeconds();
            if (diff >= 0 && diff <= 90)    return "IQAMAH";
            if (diff > 90 && diff <= 300)   return "WARN";
            if (diff < 0 && diff >= -600)   return "IN_PRAYER";
        }
        return "NORMAL";
    }
}
