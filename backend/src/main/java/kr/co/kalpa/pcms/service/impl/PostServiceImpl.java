package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Post;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.PostDto;
import kr.co.kalpa.pcms.dto.board.PostSearchDto;
import kr.co.kalpa.pcms.mapper.PostMapper;
import kr.co.kalpa.pcms.service.FileUploadService;
import kr.co.kalpa.pcms.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PostServiceImpl implements PostService {

    private static final String TABLE_NAME = "posts";
    private static final String FILE_TYPE_IMAGE = "editor-image";
    private static final String FILE_TYPE_ATTACH = "attachment";

    private final PostMapper postMapper;
    private final FileUploadService fileUploadService;

    @Override
    public Long register(PostDto postDto, List<MultipartFile> attachments) {
        // 1. 에디터 이미지 추출 → 디스크 저장 + URL 치환
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(postDto.getContent());

        // 2. 포스트 저장
        Post post = Post.builder()
                .boardId(postDto.getBoardId())
                .title(postDto.getTitle())
                .author(postDto.getAuthor() != null ? postDto.getAuthor() : "관리자")
                .content(imageResult.content())
                .baseYmd(postDto.getBaseYmd())
                .build();
        postMapper.insertPost(post);
        Long postId = post.getId();

        // 3. 에디터 이미지 file_match 연결
        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, postId, imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        // 4. 첨부파일 저장 + file_match 연결
        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, postId, attachFileIds, FILE_TYPE_ATTACH);
        }

        return postId;
    }

    @Override
    public PostDto get(Long id) {
        postMapper.incrementViewCount(id);
        Post post = postMapper.selectPostById(id)
                .orElseThrow(() -> new RuntimeException("Post not found: " + id));
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
                .attachments(fileUploadService.getAttachments(TABLE_NAME, id))
                .build();
    }

    @Override
    public void modify(PostDto postDto, List<MultipartFile> attachments) {
        // 1. 삭제 요청된 첨부파일 제거
        if (postDto.getDeletedAttachmentIds() != null && !postDto.getDeletedAttachmentIds().isEmpty()) {
            fileUploadService.deleteAttachments(postDto.getDeletedAttachmentIds());
        }

        // 2. 에디터 이미지 추출 → 디스크 저장 + URL 치환
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(postDto.getContent());

        // 3. 포스트 업데이트
        Post post = Post.builder()
                .id(postDto.getId())
                .title(postDto.getTitle())
                .author(postDto.getAuthor())
                .content(imageResult.content())
                .baseYmd(postDto.getBaseYmd())
                .build();
        postMapper.updatePost(post);

        // 4. 새로 추가된 에디터 이미지 file_match 연결
        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, postDto.getId(), imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        // 5. 새 첨부파일 저장 + file_match 연결
        List<Long> attachFileIds = saveAttachments(attachments);
        if (!attachFileIds.isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, postDto.getId(), attachFileIds, FILE_TYPE_ATTACH);
        }
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

    private List<Long> saveAttachments(List<MultipartFile> attachments) {
        if (attachments == null || attachments.isEmpty()) return List.of();
        List<Long> ids = new ArrayList<>();
        for (MultipartFile file : attachments) {
            if (!file.isEmpty()) {
                ids.add(fileUploadService.saveAttachment(file));
            }
        }
        return ids;
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
