package kr.co.kalpa.pcms.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApFile {
    private String nodeId;        // UUID (PK, FK → ap_node)
    private String savedPath;     // 상대경로: yyyy/MM/dd/filename
    private String originalName;
    private long fileSize;
    private String contentType;
    private String sha256Hash;
    private Integer width;        // 이미지 전용
    private Integer height;       // 이미지 전용
    private String thumbnailPath;
    private OffsetDateTime uploadDt;
}
