package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.HddDto;
import kr.co.kalpa.pcms.domain.movie.dto.HddSearchDto;
import kr.co.kalpa.pcms.domain.movie.entity.Hdd;
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
public class HddServiceImpl implements HddService {

    private final HddMapper hddMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponseDto<HddDto> getList(HddSearchDto searchDto) {
        List<Hdd> list = hddMapper.selectList(searchDto);
        int total = hddMapper.selectCount(searchDto);

        List<HddDto> dtoList = list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponseDto.<HddDto>withAll()
                .dtoList(dtoList)
                .total(total)
                .pageRequestDto(searchDto)
                .build();
    }

    @Override
    public void modify(HddDto hddDto) {
        Hdd hdd = toEntity(hddDto);
        hddMapper.update(hdd);
    }

    @Override
    @Transactional(readOnly = true)
    public HddDto get(Integer id) {
        Hdd hdd = hddMapper.selectOne(id);
        if (hdd == null) {
            throw new RuntimeException("HDD not found: " + id);
        }
        return toDto(hdd);
    }

    private HddDto toDto(Hdd hdd) {
        return HddDto.builder()
                .id(hdd.getId())
                .volumnName(hdd.getVolumnName())
                .gubun(hdd.getGubun())
                .path(hdd.getPath())
                .fileName(hdd.getFileName())
                .name(hdd.getName())
                .pdir(hdd.getPdir())
                .extension(hdd.getExtension())
                .size(hdd.getSize())
                .sha1Cd(hdd.getSha1Cd())
                .srchKey(hdd.getSrchKey())
                .lastModifiedYmd(hdd.getLastModifiedYmd())
                .pid(hdd.getPid())
                .rightPid(hdd.getRightPid())
                .build();
    }

    private Hdd toEntity(HddDto dto) {
        return Hdd.builder()
                .id(dto.getId())
                .volumnName(dto.getVolumnName())
                .gubun(dto.getGubun())
                .path(dto.getPath())
                .fileName(dto.getFileName())
                .name(dto.getName())
                .pdir(dto.getPdir())
                .extension(dto.getExtension())
                .size(dto.getSize())
                .sha1Cd(dto.getSha1Cd())
                .srchKey(dto.getSrchKey())
                .lastModifiedYmd(dto.getLastModifiedYmd())
                .pid(dto.getPid())
                .rightPid(dto.getRightPid())
                .build();
    }
}
