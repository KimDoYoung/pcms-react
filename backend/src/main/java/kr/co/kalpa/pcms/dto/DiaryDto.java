package kr.co.kalpa.pcms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiaryDto {
    private Long id;

    @NotBlank(message = "날짜를 입력해 주세요.")
    private String ymd;

    private String content;
    private String summary;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    /** 수정 시 삭제할 첨부파일 fileId 목록 */
    private List<Long> deletedAttachmentIds;

    /** 조회 시 첨부파일 목록 */
    private List<AttachmentDto> attachments;
}
