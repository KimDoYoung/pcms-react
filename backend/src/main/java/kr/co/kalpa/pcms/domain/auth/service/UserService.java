package kr.co.kalpa.pcms.domain.auth.service;

import kr.co.kalpa.pcms.domain.auth.dto.PasswordChangeDto;
import kr.co.kalpa.pcms.domain.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    @Transactional
    public void changePassword(String userId, PasswordChangeDto dto) {
        User user = userMapper.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 현재 개발 상태에서는 평문 비교 (user.getUserPw() 가 평문이라고 가정)
        if (!user.getUserPw().equals(dto.getCurrentPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new IllegalArgumentException("새로운 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        }

        userMapper.updatePassword(userId, dto.getNewPassword());
    }
}
