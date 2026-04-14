package kr.co.kalpa.pcms.domain.movie.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Movie {
    private Long id;
    private String mid;
    private String gubun;
    private String title1;
    private String title2;
    private String title3;
    private String category;
    private String gamdok;
    private String makeYear;
    private String nara;
    private String dvdId;
    private String title1num;
    private String title1title2;
}
