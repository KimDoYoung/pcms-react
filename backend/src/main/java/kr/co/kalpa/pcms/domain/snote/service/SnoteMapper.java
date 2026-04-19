package kr.co.kalpa.pcms.domain.snote.service;

import kr.co.kalpa.pcms.domain.snote.dto.SnoteSearchDto;
import kr.co.kalpa.pcms.domain.snote.entity.Snote;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface SnoteMapper {
    void insertSnote(Snote snote);
    Optional<Snote> selectSnoteById(Long id);
    void updateSnote(Snote snote);
    void deleteSnote(Long id);
    List<Snote> selectSnoteList(SnoteSearchDto searchDto);
    int selectSnoteCount(SnoteSearchDto searchDto);
}
