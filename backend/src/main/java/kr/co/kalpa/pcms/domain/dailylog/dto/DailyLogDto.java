package kr.co.kalpa.pcms.domain.dailylog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyLogDto {
    private Long id;

    @NotBlank(message = "날짜를 입력해 주세요.")
    private String ymd;

    @NotBlank(message = "제목을 입력해 주세요.")
    private String title;

    @NotBlank(message = "값을 입력해 주세요.")
    private String value;
}
