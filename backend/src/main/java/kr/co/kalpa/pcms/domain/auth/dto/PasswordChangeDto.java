package kr.co.kalpa.pcms.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordChangeDto {
    @NotBlank(message = "현재 비밀번호를 입력해 주세요.")
    private String currentPassword;
    
    @NotBlank(message = "새로운 비밀번호를 입력해 주세요.")
    private String newPassword;
    
    @NotBlank(message = "새로운 비밀번호 확인을 입력해 주세요.")
    private String confirmPassword;
}
