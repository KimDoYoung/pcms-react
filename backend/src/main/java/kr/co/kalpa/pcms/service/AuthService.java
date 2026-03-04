package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.auth.LoginRequestDto;
import kr.co.kalpa.pcms.dto.auth.TokenResponseDto;

public interface AuthService {
    TokenResponseDto login(LoginRequestDto request);
    void logout(String accessToken);
    TokenResponseDto refresh(String refreshToken);
}
