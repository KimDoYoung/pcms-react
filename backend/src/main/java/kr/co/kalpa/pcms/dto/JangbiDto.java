package kr.co.kalpa.pcms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JangbiDto {
    private Long id;

    @NotBlank(message = "날짜를 입력해 주세요.")
    private String ymd;

    @NotBlank(message = "장비명을 입력해 주세요.")
    private String item;

    private String location;
    private Integer cost;
    private String spec;
    private String lvl;
    private OffsetDateTime modifyDt;
}
