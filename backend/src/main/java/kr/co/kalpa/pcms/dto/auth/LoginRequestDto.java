package kr.co.kalpa.pcms.dto.auth;

import lombok.Getter;

@Getter
public class LoginRequestDto {
    private String userId;
    private String userPw;
}
