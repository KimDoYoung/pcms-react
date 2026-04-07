package kr.co.kalpa.pcms.domain.apnode.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApNodeDto {
    private String id;
    private String nodeType;     // F, D, L
    private String parentId;
    private String name;
    private int depth;
    private OffsetDateTime createDt;
    private OffsetDateTime modifyDt;

    private int childCount;
    private long totalSize;

    private String linkTargetId;
    private boolean brokenLink;

    private String fileUrl;
    private String originalName;
    private Long fileSize;
    private String contentType;
    private Integer width;
    private Integer height;
}
