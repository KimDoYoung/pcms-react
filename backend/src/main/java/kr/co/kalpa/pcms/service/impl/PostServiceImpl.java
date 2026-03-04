package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Post;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.PostDto;
import kr.co.kalpa.pcms.dto.board.PostSearchDto;
import kr.co.kalpa.pcms.mapper.PostMapper;
import kr.co.kalpa.pcms.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;

    @Override
    public Long register(PostDto postDto) {
        Post post = Post.builder()
                .boardId(postDto.getBoardId())
                .title(postDto.getTitle())
                .author(postDto.getAuthor() != null ? postDto.getAuthor() : "관리자")
                .content(postDto.getContent())
                .baseYmd(postDto.getBaseYmd())
                .build();
        postMapper.insertPost(post);
        return post.getId();
    }

    @Override
    // incrementViewCount + selectPostById 두 쿼리를 하나의 트랜잭션으로 처리
    public PostDto get(Long id) {
        postMapper.incrementViewCount(id);
        Post post = postMapper.selectPostById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
        return toDto(post);
    }

    @Override
    public void modify(PostDto postDto) {
        Post post = Post.builder()
                .id(postDto.getId())
                .title(postDto.getTitle())
                .author(postDto.getAuthor())
                .content(postDto.getContent())
                .baseYmd(postDto.getBaseYmd())
                .build();
        postMapper.updatePost(post);
    }

    @Override
    public void remove(Long id) {
        postMapper.deletePost(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<PostDto> getList(PostSearchDto searchDto) {
        List<Post> posts = postMapper.selectPostList(searchDto);
        int total = postMapper.selectPostCount(searchDto);

        List<PostDto> dtoList = posts.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<PostDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    private PostDto toDto(Post post) {
        return PostDto.builder()
                .id(post.getId())
                .boardId(post.getBoardId())
                .title(post.getTitle())
                .author(post.getAuthor())
                .content(post.getContent())
                .viewCount(post.getViewCount())
                .baseYmd(post.getBaseYmd())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
