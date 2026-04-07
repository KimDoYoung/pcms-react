package kr.co.kalpa.pcms.domain.jangbi.service;
import kr.co.kalpa.pcms.domain.jangbi.dto.JangbiDto;
import kr.co.kalpa.pcms.domain.jangbi.dto.JangbiSearchDto;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface JangbiService {
    Long register(JangbiDto jangbiDto, List<MultipartFile> attachments);
    JangbiDto get(Long id);
    void modify(JangbiDto jangbiDto, List<MultipartFile> attachments);
    void remove(Long id);
    PageResponseDto<JangbiDto> getList(JangbiSearchDto searchDto);
}
