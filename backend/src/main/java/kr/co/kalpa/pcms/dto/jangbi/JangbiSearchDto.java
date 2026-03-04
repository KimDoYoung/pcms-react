package kr.co.kalpa.pcms.dto.jangbi;

import kr.co.kalpa.pcms.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JangbiSearchDto extends PageRequestDto {
    private String startYmd;
    private String endYmd;
    private String keyword;
}
