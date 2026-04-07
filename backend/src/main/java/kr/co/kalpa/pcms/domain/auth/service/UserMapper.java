package kr.co.kalpa.pcms.domain.auth.service;
import kr.co.kalpa.pcms.domain.auth.entity.User;

import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface UserMapper {
    Optional<User> findByUserId(String userId);
}
