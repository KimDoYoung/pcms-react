package kr.co.kalpa.pcms.domain.movie.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MovieReview {
    private Long id;
    private String title;
    private String nara;
    private String year;
    private Integer lvl;
    private String ymd;
    private String content;
    private LocalDateTime lastmodifyDt;
}
