package kr.co.kalpa.pcms.domain.board.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDto {
    private Long id;

    @NotBlank(message = "게시판 코드를 입력해 주세요.")
    private String boardCode;

    @NotBlank(message = "게시판 이름을 입력해 주세요.")
    private String boardNameKor;

    private String contentType;
    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
