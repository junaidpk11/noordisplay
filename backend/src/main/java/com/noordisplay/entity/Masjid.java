package com.noordisplay.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "masjids")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Masjid {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    private String city;
    private String country;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private String timezone;

    @Column(nullable = false)
    private Integer calcMethod;

    @Column(nullable = false)
    private String accentColor;

    @Column(nullable = false)
    private String language;

    @Column(nullable = false)
    private Boolean active;

    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @OneToOne(mappedBy = "masjid", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("masjid")
    private MasjidFeatures features;
}
