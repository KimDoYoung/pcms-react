package kr.co.kalpa.pcms.domain.usersettings.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingDto {
    @NotBlank(message = "key를 입력해 주세요.")
    private String key;

    private String value;
}
