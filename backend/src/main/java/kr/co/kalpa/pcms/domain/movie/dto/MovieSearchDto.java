package kr.co.kalpa.pcms.domain.movie.dto;

import kr.co.kalpa.pcms.common.dto.PageRequestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MovieSearchDto extends PageRequestDto {
    private String keyword;
    private String category;
    private String gamdok;
    private String makeYear;
    private String gubun;
}
