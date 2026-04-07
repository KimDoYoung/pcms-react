package kr.co.kalpa.pcms.domain.diary.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Diary {
    private Long id;
    private String ymd;
    private String content;
    private String summary;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Integer attachmentCount;
}
