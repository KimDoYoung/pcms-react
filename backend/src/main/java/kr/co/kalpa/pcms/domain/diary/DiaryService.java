package kr.co.kalpa.pcms.domain.diary;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DiaryService {
    Long register(DiaryDto diaryDto, List<MultipartFile> attachments);
    DiaryDto get(Long id);
    void modify(DiaryDto diaryDto, List<MultipartFile> attachments);
    void remove(Long id);
    PageResponseDto<DiaryDto> getList(DiarySearchDto searchDto);
}
