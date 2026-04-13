package kr.co.kalpa.pcms.utility.hanja.mapper;

import kr.co.kalpa.pcms.utility.hanja.dto.HanjaDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HanjaMapper {
    List<HanjaDto> findByKorean(@Param("korean") String korean);
    void insertBatch(@Param("list") List<HanjaDto> list);
}
