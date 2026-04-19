package kr.co.kalpa.pcms.domain.snote.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.snote.dto.SnoteDto;
import kr.co.kalpa.pcms.domain.snote.dto.SnoteSearchDto;
import kr.co.kalpa.pcms.domain.snote.entity.Snote;
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
public class SnoteServiceImpl implements SnoteService {

    private final SnoteMapper snoteMapper;

    @Override
    public Long register(SnoteDto dto) {
        Snote snote = Snote.builder()
                .title(dto.getTitle())
                .note(dto.getNote())
                .build();
        snoteMapper.insertSnote(snote);
        return snote.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public SnoteDto get(Long id) {
        Snote snote = snoteMapper.selectSnoteById(id)
                .orElseThrow(() -> new RuntimeException("Snote not found: " + id));
        return toDto(snote);
    }

    @Override
    public void modify(SnoteDto dto) {
        Snote snote = Snote.builder()
                .id(dto.getId())
                .title(dto.getTitle())
                .note(dto.getNote())
                .build();
        snoteMapper.updateSnote(snote);
    }

    @Override
    public void remove(Long id) {
        snoteMapper.deleteSnote(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<SnoteDto> getList(SnoteSearchDto searchDto) {
        List<Snote> list = snoteMapper.selectSnoteList(searchDto);
        int total = snoteMapper.selectSnoteCount(searchDto);

        List<SnoteDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<SnoteDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    private SnoteDto toDto(Snote snote) {
        return SnoteDto.builder()
                .id(snote.getId())
                .title(snote.getTitle())
                .note(snote.getNote())
                .createDt(snote.getCreateDt())
                .build();
    }
}
