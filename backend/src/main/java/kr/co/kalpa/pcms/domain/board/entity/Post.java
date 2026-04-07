package kr.co.kalpa.pcms.domain.board.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Post {
    private Long id;
    private Long boardId;
    private String title;
    private String author;
    private String content;
    private Integer viewCount;
    private String baseYmd;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer attachmentCount;
}
