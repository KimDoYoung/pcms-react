package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.PostDto;
import kr.co.kalpa.pcms.dto.board.PostSearchDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {
    Long register(PostDto postDto, List<MultipartFile> attachments);
    PostDto get(Long id);
    void modify(PostDto postDto, List<MultipartFile> attachments);
    void remove(Long id);
    PageResponseDto<PostDto> getList(PostSearchDto searchDto);
}
