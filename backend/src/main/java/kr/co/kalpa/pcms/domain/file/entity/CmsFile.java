package kr.co.kalpa.pcms.domain.file.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

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
    private String fileCategory;
    private String tag;
    private OffsetDateTime createdAt;
}
