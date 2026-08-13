package kr.co.kalpa.pcms.domain.kofic.service;

import kr.co.kalpa.pcms.domain.kofic.dto.KoficMovieDto;

import java.util.List;

public interface KoficService {
    List<KoficMovieDto> searchMovies(String movieNm, String directorNm, String prdtYear);
}
