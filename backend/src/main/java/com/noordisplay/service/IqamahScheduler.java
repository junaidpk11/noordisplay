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

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class IqamahScheduler {

    private final MasjidRepository masjidRepository;
    private final PrayerTimesRepository prayerTimesRepository;
    private final SimpMessagingTemplate messaging;
    private final MasjidTimeService masjidTimeService;

    @Scheduled(fixedRate = 30_000)
    public void checkIqamahPhases() {
        masjidRepository.findAll().forEach(masjid -> {
            MasjidFeatures features = masjid.getFeatures();
            if (features == null || !Boolean.TRUE.equals(features.getIqamahScreen())) return;

            LocalDate today = masjidTimeService.localDate(masjid);
            LocalTime now = masjidTimeService.localTime(masjid);

            Optional<PrayerTimes> ptOpt = prayerTimesRepository
                .findByMasjidIdAndPrayerDate(masjid.getId(), today);
            if (ptOpt.isEmpty()) {
                log.debug(
                    "Iqamah phase skipped: no prayer times masjid={} timezone={} localDate={}",
                    masjid.getSlug(),
                    masjid.getTimezone(),
                    today
                );
                return;
            }

            String phase = resolvePhase(now, ptOpt.get());
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

        for (LocalTime iqamah : iqamahs) {
            if (iqamah == null) continue;
            long differenceSeconds = Duration.between(now, iqamah).toSeconds();
            if (differenceSeconds >= 0 && differenceSeconds <= 90) return "IQAMAH";
            if (differenceSeconds > 90 && differenceSeconds <= 300) return "WARN";
            if (differenceSeconds < 0 && differenceSeconds >= -600) return "IN_PRAYER";
        }
        return "NORMAL";
    }
}
