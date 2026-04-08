package kr.co.kalpa.pcms.domain.diary.service;
import kr.co.kalpa.pcms.domain.diary.dto.DiaryDto;
import kr.co.kalpa.pcms.domain.diary.dto.DiarySearchDto;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DiaryService {
    Long register(DiaryDto diaryDto, List<MultipartFile> attachments);
    DiaryDto get(Long id);
    DiaryDto getByYmd(String ymd);
    void modify(DiaryDto diaryDto, List<MultipartFile> attachments);
    void remove(Long id);
    PageResponseDto<DiaryDto> getList(DiarySearchDto searchDto);
}
