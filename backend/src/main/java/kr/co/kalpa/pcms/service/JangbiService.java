package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.JangbiDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.jangbi.JangbiSearchDto;

public interface JangbiService {
    Long register(JangbiDto jangbiDto);
    JangbiDto get(Long id);
    void modify(JangbiDto jangbiDto);
    void remove(Long id);
    PageResponseDto<JangbiDto> getList(JangbiSearchDto searchDto);
}
