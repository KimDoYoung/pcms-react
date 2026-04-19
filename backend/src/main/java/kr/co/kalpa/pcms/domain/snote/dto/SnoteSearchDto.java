package kr.co.kalpa.pcms.domain.snote.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SnoteSearchDto extends PageRequestDto {
    private String keyword;
}
