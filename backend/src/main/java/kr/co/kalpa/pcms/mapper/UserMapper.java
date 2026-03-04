package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.User;
import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface UserMapper {
    Optional<User> findByUserId(String userId);
}
