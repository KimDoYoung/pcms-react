package kr.co.kalpa.pcms.domain.kofic.dto.kobis;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class KoficListResponse {
    @JsonProperty("movieListResult")
    private MovieListResult movieListResult;
}
