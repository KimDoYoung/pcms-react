package kr.co.kalpa.pcms.domain.jangbi;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface JangbiMapper {
    void insertJangbi(Jangbi jangbi);
    Optional<Jangbi> selectJangbiById(Long id);
    void updateJangbi(Jangbi jangbi);
    void deleteJangbi(Long id);
    List<Jangbi> selectJangbiList(JangbiSearchDto searchDto);
    int selectJangbiCount(JangbiSearchDto searchDto);
}
