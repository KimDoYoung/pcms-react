package kr.co.kalpa.pcms.domain.auth;

public interface AuthService {
    TokenResponseDto login(LoginRequestDto request);
    void logout(String accessToken);
    TokenResponseDto refresh(String refreshToken);
}
