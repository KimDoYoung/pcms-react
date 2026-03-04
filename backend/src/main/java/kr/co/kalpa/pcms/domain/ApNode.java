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
public class ApNode {
    private String id;           // UUID
    private String nodeType;     // F:파일, D:디렉토리, L:링크
    private String parentId;     // UUID, nullable (루트면 null)
    private String name;
    private int depth;
    private boolean deleted;     // is_deleted 컬럼 (alias 필요)
    private OffsetDateTime deleteDt;
    private OffsetDateTime createDt;
    private OffsetDateTime modifyDt;
    private int childCount;
    private long totalSize;
    private String linkTargetId; // UUID, L 타입일 때만 사용
}
