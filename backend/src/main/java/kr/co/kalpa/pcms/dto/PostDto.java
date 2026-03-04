package kr.co.kalpa.pcms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private Long id;
    private Long boardId;

    @NotBlank(message = "제목을 입력해 주세요.")
    private String title;

    private String author;
    private String content;
    private Integer viewCount;

    @NotBlank(message = "날짜를 입력해 주세요.")
    private String baseYmd;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
