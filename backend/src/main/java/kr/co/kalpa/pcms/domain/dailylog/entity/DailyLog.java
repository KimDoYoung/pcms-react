package kr.co.kalpa.pcms.domain.dailylog.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DailyLog {
    private Long id;
    private String ymd;
    private String title;
    private String value;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
