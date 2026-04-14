package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.domain.movie.dto.HddSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.Hdd;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface HddMapper {
    List<Hdd> selectList(HddSearchDto searchDto);
    int selectCount(HddSearchDto searchDto);
    Hdd selectOne(Integer id);
    void update(Hdd hdd);
}
