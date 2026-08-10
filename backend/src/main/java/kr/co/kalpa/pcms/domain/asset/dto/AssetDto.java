package kr.co.kalpa.pcms.domain.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDto {
    private Long id;

    @NotBlank(message = "타입을 입력해 주세요.")
    @Pattern(regexp = "EMOJI|SYMBOL|PHRASE|TEMPLATE", message = "타입은 EMOJI, SYMBOL, PHRASE, TEMPLATE만 가능합니다.")
    private String atype;

    @NotBlank(message = "이름을 입력해 주세요.")
    private String name;

    @NotBlank(message = "값을 입력해 주세요.")
    private String value;
}
