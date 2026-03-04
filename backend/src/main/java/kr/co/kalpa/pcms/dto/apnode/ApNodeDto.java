package kr.co.kalpa.pcms.dto.apnode;

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
    // 공통
    private String id;
    private String nodeType;     // F, D, L
    private String parentId;
    private String name;
    private int depth;
    private OffsetDateTime createDt;
    private OffsetDateTime modifyDt;

    // D 전용
    private int childCount;
    private long totalSize;

    // L 전용
    private String linkTargetId;
    private boolean brokenLink;  // 대상 노드가 삭제된 경우

    // F 및 L (링크 대상 resolve) 공통
    private String fileUrl;
    private String originalName;
    private Long fileSize;
    private String contentType;
    private Integer width;
    private Integer height;
}
