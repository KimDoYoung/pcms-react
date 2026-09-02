package kr.co.kalpa.pcms.domain.wisdom.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomDto;
import kr.co.kalpa.pcms.domain.wisdom.dto.WisdomSearchDto;

import java.util.List;

public interface WisdomService {

    String register(WisdomDto dto);

    WisdomDto get(String id);

    void modify(WisdomDto dto);

    void remove(String id);

    PageResponseDto<WisdomDto> getList(WisdomSearchDto searchDto);

    List<String> getDomains();

    List<String> getCategories(String domain);

    boolean existsById(String id);

    WisdomDto getRandom(String domain, String category, String contextTrigger);
}
