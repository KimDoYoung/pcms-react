package kr.co.kalpa.pcms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private Long id;
    private Long boardId;

    @NotBlank(message = "제목을 입력해 주세요.")
    private String title;

    private String author;
    private String content;
    private Integer viewCount;

    @NotBlank(message = "날짜를 입력해 주세요.")
    private String baseYmd;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 목록 조회 시 첨부파일 개수 */
    private Integer attachmentCount;

    /** 수정 시 삭제할 첨부파일 fileId 목록 */
    private List<Long> deletedAttachmentIds;

    /** 조회 시 첨부파일 목록 */
    private List<AttachmentDto> attachments;
}
