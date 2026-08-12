package kr.co.kalpa.pcms.domain.usersettings.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSetting {
    private Long settingId;
    private String userId;
    private String settingKey;
    private String settingValue;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
