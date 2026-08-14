package kr.co.kalpa.pcms.domain.tmdb.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TmdbMovieDto {
    private Long id;
    private String title;
    private String originalTitle;
    private String overview;
    private String posterPath;
    private String posterUrl;
    private String releaseDate;
    private Double voteAverage;
    private Double popularity;
    private String originalLanguage;
}
