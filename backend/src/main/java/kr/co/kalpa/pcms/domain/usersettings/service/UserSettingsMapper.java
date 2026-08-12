package kr.co.kalpa.pcms.domain.usersettings.service;

import kr.co.kalpa.pcms.domain.usersettings.entity.UserSetting;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserSettingsMapper {
    void upsertUserSetting(UserSetting userSetting);
    UserSetting selectUserSetting(@Param("userId") String userId, @Param("settingKey") String settingKey);
    void deleteUserSetting(@Param("userId") String userId, @Param("settingKey") String settingKey);
}
