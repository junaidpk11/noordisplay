package com.noordisplay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "scheduled_slots")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScheduledSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "masjid_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"scheduledSlots","features","hibernateLazyInitializer"})
    private Masjid masjid;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slotType;   // ANNOUNCEMENT | POSTER | QURAN | HADITH | ETIQUETTE | CUSTOM

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    /** Concatenated day numbers: "0123456" = every day, "5" = Friday only */
    @Column(nullable = false)
    private String repeatDays;

    private LocalDate dateFrom;
    private LocalDate dateUntil;
    private String    message;
    private String    imageUrl;

    @Column(nullable = false)
    private Boolean active;

    private Integer   sortOrder;
    private Instant   createdAt;
}
