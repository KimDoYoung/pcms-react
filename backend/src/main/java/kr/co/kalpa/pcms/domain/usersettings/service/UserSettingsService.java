package kr.co.kalpa.pcms.domain.usersettings.service;

import kr.co.kalpa.pcms.domain.usersettings.dto.UserSettingDto;

public interface UserSettingsService {
    UserSettingDto get(String key);
    void upsert(UserSettingDto dto);
    void remove(String key);
}
