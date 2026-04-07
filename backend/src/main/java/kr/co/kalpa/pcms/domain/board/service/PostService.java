package kr.co.kalpa.pcms.domain.board.service;
import kr.co.kalpa.pcms.domain.board.dto.PostDto;
import kr.co.kalpa.pcms.domain.board.dto.PostSearchDto;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {
    Long register(PostDto postDto, List<MultipartFile> attachments);
    PostDto get(Long id);
    void modify(PostDto postDto, List<MultipartFile> attachments);
    void remove(Long id);
    PageResponseDto<PostDto> getList(PostSearchDto searchDto);
}
