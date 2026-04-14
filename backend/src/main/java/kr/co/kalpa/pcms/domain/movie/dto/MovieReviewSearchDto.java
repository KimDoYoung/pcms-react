package kr.co.kalpa.pcms.domain.movie.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieReviewSearchDto extends PageRequestDto {
    private String keyword;
    private String startYmd;
    private String endYmd;
    private Integer minLvl;
}
