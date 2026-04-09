package kr.co.kalpa.pcms.domain.board.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Board {
    private Long id;
    private String boardCode;
    private String boardNameKor;
    private String contentType;
    private String description;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
