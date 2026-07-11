package com.noordisplay.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "announcements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "masjid_id", nullable = false)
    @JsonIgnoreProperties("announcements")
    private Masjid masjid;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private Boolean active;

    private LocalDate startsAt;
    private LocalDate endsAt;
    private Integer sortOrder;
    private Instant createdAt;
}
