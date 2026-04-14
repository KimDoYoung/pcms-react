package kr.co.kalpa.pcms.domain.calendar.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CalendarEvent {
    private Integer id;
    private String gubun;  // Y/M/S
    private String sorl;   // S/L
    private String ymd;
    private String content;
    private String color;
    private OffsetDateTime createdDt;
}
