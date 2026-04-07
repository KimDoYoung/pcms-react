package kr.co.kalpa.pcms.domain.apnode.entity;

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
    private String nodeId;
    private String savedPath;
    private String originalName;
    private long fileSize;
    private String contentType;
    private String sha256Hash;
    private Integer width;
    private Integer height;
    private String thumbnailPath;
    private OffsetDateTime uploadDt;
}
