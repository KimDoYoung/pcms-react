package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.DiaryDto;
import kr.co.kalpa.pcms.dto.PageRequestDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;

public interface DiaryService {
    Long register(DiaryDto diaryDto);
    DiaryDto get(Long id);
    void modify(DiaryDto diaryDto);
    void remove(Long id);
    PageResponseDto<DiaryDto> getList(PageRequestDto pageRequestDto);
}