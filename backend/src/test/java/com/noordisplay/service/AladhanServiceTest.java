package com.noordisplay.service;

import com.noordisplay.entity.PrayerTimes;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class AladhanServiceTest {

    @Test
    void copiesPersistentIqamahSettingsWithoutChangingAzaanTimes() {
        PrayerTimes manual = PrayerTimes.builder()
            .fajrIqamah(LocalTime.of(6, 30))
            .dhuhrIqamah(LocalTime.of(13, 0))
            .asrIqamah(LocalTime.of(15, 30))
            .maghribIqamah(LocalTime.of(17, 4))
            .ishaIqamah(LocalTime.of(18, 45))
            .jumuah(LocalTime.of(13, 15))
            .iqamahManual(true)
            .build();

        PrayerTimes nextDay = PrayerTimes.builder()
            .fajr(LocalTime.of(5, 59))
            .dhuhr(LocalTime.of(12, 11))
            .asr(LocalTime.of(14, 35))
            .maghrib(LocalTime.of(16, 56))
            .isha(LocalTime.of(18, 22))
            .build();

        AladhanService.copyManualIqamah(manual, nextDay);

        assertThat(nextDay.getFajr()).isEqualTo(LocalTime.of(5, 59));
        assertThat(nextDay.getDhuhr()).isEqualTo(LocalTime.of(12, 11));
        assertThat(nextDay.getFajrIqamah()).isEqualTo(LocalTime.of(6, 30));
        assertThat(nextDay.getDhuhrIqamah()).isEqualTo(LocalTime.of(13, 0));
        assertThat(nextDay.getAsrIqamah()).isEqualTo(LocalTime.of(15, 30));
        assertThat(nextDay.getMaghribIqamah()).isEqualTo(LocalTime.of(17, 4));
        assertThat(nextDay.getIshaIqamah()).isEqualTo(LocalTime.of(18, 45));
        assertThat(nextDay.getJumuah()).isEqualTo(LocalTime.of(13, 15));
        assertThat(nextDay.isIqamahManual()).isTrue();
    }
}
