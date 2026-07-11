package com.noordisplay.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DisplayPhaseMessage {
    private String phase;   // NORMAL | WARN | IQAMAH | IN_PRAYER
    private String slug;
}
