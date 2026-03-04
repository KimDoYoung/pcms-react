package kr.co.kalpa.pcms.service.impl;

import kr.co.kalpa.pcms.domain.Jangbi;
import kr.co.kalpa.pcms.dto.JangbiDto;
import kr.co.kalpa.pcms.dto.PageResponseDto;
import kr.co.kalpa.pcms.dto.jangbi.JangbiSearchDto;
import kr.co.kalpa.pcms.mapper.JangbiMapper;
import kr.co.kalpa.pcms.service.JangbiService;
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
public class JangbiServiceImpl implements JangbiService {

    private final JangbiMapper jangbiMapper;

    @Override
    public Long register(JangbiDto jangbiDto) {
        Jangbi jangbi = Jangbi.builder()
                .ymd(jangbiDto.getYmd())
                .item(jangbiDto.getItem())
                .location(jangbiDto.getLocation())
                .cost(jangbiDto.getCost())
                .spec(jangbiDto.getSpec())
                .lvl(jangbiDto.getLvl() != null ? jangbiDto.getLvl() : "2")
                .build();
        jangbiMapper.insertJangbi(jangbi);
        return jangbi.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public JangbiDto get(Long id) {
        Jangbi jangbi = jangbiMapper.selectJangbiById(id)
                .orElseThrow(() -> new RuntimeException("Jangbi not found: " + id));
        return toDto(jangbi);
    }

    @Override
    public void modify(JangbiDto jangbiDto) {
        Jangbi jangbi = Jangbi.builder()
                .id(jangbiDto.getId())
                .ymd(jangbiDto.getYmd())
                .item(jangbiDto.getItem())
                .location(jangbiDto.getLocation())
                .cost(jangbiDto.getCost())
                .spec(jangbiDto.getSpec())
                .lvl(jangbiDto.getLvl())
                .build();
        jangbiMapper.updateJangbi(jangbi);
    }

    @Override
    public void remove(Long id) {
        jangbiMapper.deleteJangbi(id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<JangbiDto> getList(JangbiSearchDto searchDto) {
        List<Jangbi> list = jangbiMapper.selectJangbiList(searchDto);
        int total = jangbiMapper.selectJangbiCount(searchDto);

        List<JangbiDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<JangbiDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    private JangbiDto toDto(Jangbi jangbi) {
        return JangbiDto.builder()
                .id(jangbi.getId())
                .ymd(jangbi.getYmd())
                .item(jangbi.getItem())
                .location(jangbi.getLocation())
                .cost(jangbi.getCost())
                .spec(jangbi.getSpec())
                .lvl(jangbi.getLvl())
                .modifyDt(jangbi.getModifyDt())
                .build();
    }
}
