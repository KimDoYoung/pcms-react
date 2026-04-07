package kr.co.kalpa.pcms.domain.diary;

import jakarta.validation.constraints.NotBlank;
import kr.co.kalpa.pcms.domain.file.AttachmentDto;
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

    private Integer attachmentCount;
    private List<Long> deletedAttachmentIds;
    private List<AttachmentDto> attachments;
}
