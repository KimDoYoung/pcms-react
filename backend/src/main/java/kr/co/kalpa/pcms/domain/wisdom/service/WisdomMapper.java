package kr.co.kalpa.pcms.domain.wisdom.service;

import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomSearchDto;
import kr.co.kalpa.pcms.domain.wisdom.entity.Wisdom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface WisdomMapper {

    int insertWisdom(Wisdom wisdom);

    int updateWisdom(Wisdom wisdom);

    int deleteWisdom(String id);

    Optional<Wisdom> selectWisdomById(String id);

    List<Wisdom> selectWisdomList(WisdomSearchDto searchDto);

    int selectWisdomCount(WisdomSearchDto searchDto);

    List<String> selectDomains();

    List<String> selectCategories(@Param("domain") String domain);

    int existsById(String id);

    Optional<Wisdom> selectRandomWisdom(
            @Param("domain") String domain,
            @Param("category") String category,
            @Param("contextTrigger") String contextTrigger
    );

    String selectMaxIdByPrefix(@Param("prefix") String prefix);
}
