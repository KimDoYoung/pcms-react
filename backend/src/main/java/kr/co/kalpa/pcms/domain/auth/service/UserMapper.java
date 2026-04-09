package kr.co.kalpa.pcms.domain.auth.service;
import kr.co.kalpa.pcms.domain.auth.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

@Mapper
public interface UserMapper {
    Optional<User> findByUserId(String userId);
    
    void updatePassword(@Param("userId") String userId, @Param("password") String password);
}
