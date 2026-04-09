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
public class CalendarPublic {
    private Integer id;
    private String dataType; // 'Data' or 'Action'
    private String ymd;
    private String content;
    private OffsetDateTime createdDt;
}
