package kr.co.kalpa.pcms.domain.board.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostSearchDto extends PageRequestDto {
    private Long boardId;
    private String keyword;
    private String startBaseYmd;
    private String endBaseYmd;
}
