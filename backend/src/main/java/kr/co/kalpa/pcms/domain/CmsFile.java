package kr.co.kalpa.pcms.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CmsFile {
    private Long fileId;
    private String savedFolder;
    private String orgFileName;
    private String physicalFileName;
    private long fileSize;
    private String mimeType;
    private LocalDateTime createdAt;
}
