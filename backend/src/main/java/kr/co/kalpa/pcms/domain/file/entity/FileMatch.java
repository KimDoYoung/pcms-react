package kr.co.kalpa.pcms.domain.file.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FileMatch {
    private Long id;
    private String tableName;
    private Long targetId;
    private Long fileId;
    private String fileType;
    private LocalDateTime createdAt;
}
