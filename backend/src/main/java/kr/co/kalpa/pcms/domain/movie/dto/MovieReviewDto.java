package kr.co.kalpa.pcms.domain.movie.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieReviewDto {
    private Long id;
    private String title;
    private String nara;
    private String year;
    private Integer lvl;
    private String ymd;
    private String content;
    private LocalDateTime lastmodifyDt;
}
