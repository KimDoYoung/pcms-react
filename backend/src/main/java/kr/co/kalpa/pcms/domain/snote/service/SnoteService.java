package kr.co.kalpa.pcms.domain.snote.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.snote.dto.SnoteDto;
import kr.co.kalpa.pcms.domain.snote.dto.SnoteSearchDto;

public interface SnoteService {
    Long register(SnoteDto dto);
    SnoteDto get(Long id);
    void modify(SnoteDto dto);
    void remove(Long id);
    PageResponseDto<SnoteDto> getList(SnoteSearchDto searchDto);
}
