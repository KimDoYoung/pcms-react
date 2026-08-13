package kr.co.kalpa.pcms.domain.kofic.dto.kobis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MovieListResult {
    private String totCnt;
    private String source;
    private List<MovieListItem> movieList;
}
