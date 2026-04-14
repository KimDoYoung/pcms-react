package kr.co.kalpa.pcms.domain.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LunarDateDto {
    private String solar;      // 양력 yyyyMMdd (e.g. "20260201")
    private String lunar;      // 음력 yyyyMMdd (e.g. "20260101")
    private String display;    // 표시용 (e.g. "음1/1", "윤5/1")
    private boolean leapMonth; // 윤달 여부
}
