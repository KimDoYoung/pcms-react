package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.Movie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MovieServiceImpl implements MovieService {

    private final MovieMapper movieMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<MovieDto> getList(MovieSearchDto searchDto) {
        List<Movie> list = movieMapper.selectList(searchDto);
        int total = movieMapper.selectCount(searchDto);

        List<MovieDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<MovieDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    @Override
    public void modify(MovieDto movieDto) {
        Movie movie = toEntity(movieDto);
        movieMapper.update(movie);
    }

    @Override
    public void batchModify(List<MovieDto> movieDtoList) {
        movieDtoList.forEach(dto -> movieMapper.update(toEntity(dto)));
    }

    @Override
    @Transactional(readOnly = true)
    public MovieDto get(Long id) {
        Movie movie = movieMapper.selectOne(id);
        if (movie == null) {
            throw new RuntimeException("Movie not found: " + id);
        }
        return toDto(movie);
    }

    private MovieDto toDto(Movie movie) {
        return MovieDto.builder()
                .id(movie.getId())
                .mid(movie.getMid())
                .gubun(movie.getGubun())
                .title1(movie.getTitle1())
                .title2(movie.getTitle2())
                .title3(movie.getTitle3())
                .category(movie.getCategory())
                .gamdok(movie.getGamdok())
                .makeYear(movie.getMakeYear())
                .nara(movie.getNara())
                .dvdId(movie.getDvdId())
                .title1num(movie.getTitle1num())
                .title1title2(movie.getTitle1title2())
                .build();
    }

    private Movie toEntity(MovieDto dto) {
        return Movie.builder()
                .id(dto.getId())
                .mid(dto.getMid())
                .gubun(dto.getGubun())
                .title1(dto.getTitle1())
                .title2(dto.getTitle2())
                .title3(dto.getTitle3())
                .category(dto.getCategory())
                .gamdok(dto.getGamdok())
                .makeYear(dto.getMakeYear())
                .nara(dto.getNara())
                .dvdId(dto.getDvdId())
                .title1num(dto.getTitle1num())
                .title1title2(dto.getTitle1title2())
                .build();
    }
}
