package com.noordisplay.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "prayer_times")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrayerTimes {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "masjid_id", nullable = false)
    @JsonIgnoreProperties("prayerTimes")
    private Masjid masjid;

    @Column(nullable = false)
    private LocalDate prayerDate;

    private LocalTime fajr;
    private LocalTime sunrise;
    private LocalTime dhuhr;
    private LocalTime asr;
    private LocalTime maghrib;
    private LocalTime isha;

    private LocalTime fajrIqamah;
    private LocalTime dhuhrIqamah;
    private LocalTime asrIqamah;
    private LocalTime maghribIqamah;
    private LocalTime ishaIqamah;
    private LocalTime jumuah;

    @Column(nullable = false)
    private String source;

    private Instant createdAt;
}
