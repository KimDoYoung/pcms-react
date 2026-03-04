package kr.co.kalpa.pcms.controller;

import jakarta.validation.Valid;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.PostDto;
import kr.co.kalpa.pcms.dto.board.PostSearchDto;
import kr.co.kalpa.pcms.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/boards/{boardId}/posts")
@Slf4j
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(
            @PathVariable Long boardId,
            @Valid @RequestBody PostDto postDto) {
        log.info("register post: boardId={}, {}", boardId, postDto);
        postDto.setBoardId(boardId);
        Long id = postService.register(postDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping("/{postsId}")
    public ResponseEntity<PostDto> get(
            @PathVariable Long boardId,
            @PathVariable Long postsId) {
        log.info("get post: boardId={}, postsId={}", boardId, postsId);
        return ResponseEntity.ok(postService.get(postsId));
    }

    @PutMapping("/{postsId}")
    public ResponseEntity<Map<String, String>> modify(
            @PathVariable Long boardId,
            @PathVariable Long postsId,
            @Valid @RequestBody PostDto postDto) {
        log.info("modify post: boardId={}, postsId={}", boardId, postsId);
        postDto.setBoardId(boardId);
        postDto.setId(postsId);
        postService.modify(postDto);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @DeleteMapping("/{postsId}")
    public ResponseEntity<Map<String, String>> remove(
            @PathVariable Long boardId,
            @PathVariable Long postsId) {
        log.info("remove post: boardId={}, postsId={}", boardId, postsId);
        postService.remove(postsId);
        return ResponseEntity.ok(Map.of("result", "success"));
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<PostDto>> getList(
            @PathVariable Long boardId,
            PostSearchDto searchDto) {
        log.info("getList posts: boardId={}, {}", boardId, searchDto);
        searchDto.setBoardId(boardId);
        return ResponseEntity.ok(postService.getList(searchDto));
    }
}
