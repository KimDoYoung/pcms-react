package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.JangbiDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.jangbi.JangbiSearchDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface JangbiService {
    Long register(JangbiDto jangbiDto, List<MultipartFile> attachments);
    JangbiDto get(Long id);
    void modify(JangbiDto jangbiDto, List<MultipartFile> attachments);
    void remove(Long id);
    PageResponseDto<JangbiDto> getList(JangbiSearchDto searchDto);
}
