package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewDto;
import kr.co.kalpa.pcms.domain.movie.dto.MovieReviewSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.MovieReview;
import kr.co.kalpa.pcms.domain.file.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MovieReviewServiceImpl implements MovieReviewService {

    private static final String TABLE_NAME = "movie_review";
    private static final String FILE_TYPE_IMAGE = "editor-image";

    private final MovieReviewMapper movieReviewMapper;
    private final FileUploadService fileUploadService;

    @Override
    public Long register(MovieReviewDto movieReviewDto) {
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(movieReviewDto.getContent());
        movieReviewDto.setContent(imageResult.content());

        Long nextId = movieReviewMapper.selectMaxId() + 1;
        
        MovieReview movieReview = toEntity(movieReviewDto);
        movieReview.setId(nextId);
        
        movieReviewMapper.insert(movieReview);
        Long id = movieReview.getId();

        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, id, imageResult.fileIds(), FILE_TYPE_IMAGE);
        }

        return id;
    }

    @Override
    @Transactional(readOnly = true)
    public MovieReviewDto get(Long id) {
        MovieReview movieReview = movieReviewMapper.selectOne(id);
        if (movieReview == null) {
            throw new RuntimeException("MovieReview not found: " + id);
        }
        return toDto(movieReview);
    }

    @Override
    public void modify(MovieReviewDto movieReviewDto) {
        FileUploadService.ProcessResult imageResult =
                fileUploadService.processEditorImages(movieReviewDto.getContent());
        movieReviewDto.setContent(imageResult.content());

        MovieReview movieReview = toEntity(movieReviewDto);
        movieReviewMapper.update(movieReview);

        if (!imageResult.fileIds().isEmpty()) {
            fileUploadService.linkFiles(TABLE_NAME, movieReview.getId(), imageResult.fileIds(), FILE_TYPE_IMAGE);
        }
    }

    @Override
    public void remove(Long id) {
        movieReviewMapper.delete(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<MovieReviewDto> getList(MovieReviewSearchDto searchDto) {
        List<MovieReview> list = movieReviewMapper.selectList(searchDto);
        int total = movieReviewMapper.selectCount(searchDto);

        List<MovieReviewDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<MovieReviewDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    private MovieReviewDto toDto(MovieReview entity) {
        return MovieReviewDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .nara(entity.getNara())
                .year(entity.getYear())
                .lvl(entity.getLvl())
                .ymd(entity.getYmd())
                .content(entity.getContent())
                .lastmodifyDt(entity.getLastmodifyDt())
                .build();
    }

    private MovieReview toEntity(MovieReviewDto dto) {
        return MovieReview.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .nara(dto.getNara())
                .year(dto.getYear())
                .lvl(dto.getLvl())
                .ymd(dto.getYmd())
                .content(dto.getContent())
                .lastmodifyDt(dto.getLastmodifyDt() != null ? dto.getLastmodifyDt() : LocalDateTime.now())
                .build();
    }
}
