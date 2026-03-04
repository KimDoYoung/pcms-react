package kr.co.kalpa.pcms.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User {
    private Long id;
    private String userId;
    private String userPw;
    private String userNm;
    private LocalDateTime createdAt;
}
