package kr.co.kalpa.pcms.domain.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CalendarEventDto {
    private String id;
    private String type; // HOLIDAY, EVENT, etc.
    private String ymd;
    private String content;
    private String gubun;
    private String color;
}
