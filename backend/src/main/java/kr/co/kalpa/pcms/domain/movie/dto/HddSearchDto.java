package kr.co.kalpa.pcms.domain.movie.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HddSearchDto extends PageRequestDto {
    private String keyword;
    private String volumnName;
    private String extension;
    private String gubun;
}
