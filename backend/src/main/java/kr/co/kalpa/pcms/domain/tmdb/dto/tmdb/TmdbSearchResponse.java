package kr.co.kalpa.pcms.domain.tmdb.dto.tmdb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TmdbSearchResponse {
    private List<TmdbSearchResult> results;
}
