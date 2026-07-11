package com.noordisplay.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "masjid_features")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MasjidFeatures {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "masjid_id", nullable = false)
    @JsonIgnoreProperties("features")
    private Masjid masjid;

    @Builder.Default private Boolean showQuotes           = true;
    @Builder.Default private Boolean showIqamah           = true;
    @Builder.Default private Boolean showCountdown        = true;
    @Builder.Default private Boolean showHijri            = true;
    @Builder.Default private Boolean showTicker           = true;
    @Builder.Default private Boolean showJumuahBanner     = true;
    @Builder.Default private Boolean showDonationWidget   = false;
    @Builder.Default private Boolean azaanAudio           = false;
    @Builder.Default private Boolean iqamahScreen         = true;
    @Builder.Default private Boolean showWeather          = false;
    @Builder.Default private Integer quoteIntervalSecs    = 12;
    @Builder.Default private String  quoteSource          = "BOTH";
    @Builder.Default private String  timeFormat           = "12h";
    @Builder.Default private Boolean ramadanMode          = false;

    private LocalTime suhoorTime;
    private LocalTime tarawihTime;

    @Builder.Default private Integer tarawihRakats      = 20;
    @Builder.Default private Integer quranJuzCurrent   = 1;
}
