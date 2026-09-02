package kr.co.kalpa.pcms.domain.wisdom.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WisdomSearchDto extends PageRequestDto {
    private String domain;
    private String category;
    private String keyword;
    private String authorSource;
    private String contextTrigger;
}
