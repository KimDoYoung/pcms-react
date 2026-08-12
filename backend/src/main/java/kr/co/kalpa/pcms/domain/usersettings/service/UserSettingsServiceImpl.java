package kr.co.kalpa.pcms.domain.usersettings.service;

import kr.co.kalpa.pcms.domain.usersettings.dto.UserSettingDto;
import kr.co.kalpa.pcms.domain.usersettings.entity.UserSetting;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserSettingsServiceImpl implements UserSettingsService {

    private final UserSettingsMapper userSettingsMapper;

    @Override
    @Transactional(readOnly = true)
    public UserSettingDto get(String key) {
        UserSetting userSetting = userSettingsMapper.selectUserSetting(currentUserId(), key);
        return UserSettingDto.builder()
                .key(key)
                .value(userSetting != null ? userSetting.getSettingValue() : null)
                .build();
    }

    @Override
    public void upsert(UserSettingDto dto) {
        UserSetting userSetting = UserSetting.builder()
                .userId(currentUserId())
                .settingKey(dto.getKey())
                .settingValue(dto.getValue())
                .build();
        userSettingsMapper.upsertUserSetting(userSetting);
    }

    @Override
    public void remove(String key) {
        userSettingsMapper.deleteUserSetting(currentUserId(), key);
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
