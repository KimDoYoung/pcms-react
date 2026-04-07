package kr.co.kalpa.pcms.domain.apnode;

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
    private String id;
    private String nodeType;     // F:파일, D:디렉토리, L:링크
    private String parentId;
    private String name;
    private int depth;
    private boolean deleted;
    private OffsetDateTime deleteDt;
    private OffsetDateTime createDt;
    private OffsetDateTime modifyDt;
    private int childCount;
    private long totalSize;
    private String linkTargetId;
}
