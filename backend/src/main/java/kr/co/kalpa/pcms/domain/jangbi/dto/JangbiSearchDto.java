package kr.co.kalpa.pcms.domain.jangbi.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JangbiSearchDto extends PageRequestDto {
    private String startYmd;
    private String endYmd;
    private String keyword;
    private String lvl;
}
