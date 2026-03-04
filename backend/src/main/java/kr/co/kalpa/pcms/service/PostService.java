package kr.co.kalpa.pcms.service;

import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.PostDto;
import kr.co.kalpa.pcms.dto.board.PostSearchDto;

public interface PostService {
    Long register(PostDto postDto);
    PostDto get(Long id);
    void modify(PostDto postDto);
    void remove(Long id);
    PageResponseDto<PostDto> getList(PostSearchDto searchDto);
}
