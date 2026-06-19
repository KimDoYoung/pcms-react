package kr.co.kalpa.pcms.domain.dailylog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TitleTemplateDto {
    private String title;
    private String value;
    private String color;
}
