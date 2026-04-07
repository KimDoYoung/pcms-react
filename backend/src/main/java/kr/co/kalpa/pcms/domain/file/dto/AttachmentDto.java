package kr.co.kalpa.pcms.domain.file.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDto {
    private Long fileId;
    private String orgFileName;
    private long fileSize;
    private String mimeType;
}
