package kr.co.kalpa.pcms.domain.auth.service;
import kr.co.kalpa.pcms.domain.auth.dto.TokenResponseDto;
import kr.co.kalpa.pcms.domain.auth.dto.LoginRequestDto;

public interface AuthService {
    TokenResponseDto login(LoginRequestDto request);
    void logout(String accessToken);
    TokenResponseDto refresh(String refreshToken);
}
