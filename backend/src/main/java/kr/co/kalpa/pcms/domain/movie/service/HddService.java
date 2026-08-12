package kr.co.kalpa.pcms.domain.movie.service;

import kr.co.kalpa.pcms.common.dto.PageResponseDto;
import kr.co.kalpa.pcms.domain.movie.dto.HddDto;
import kr.co.kalpa.pcms.domain.movie.dto.HddSearchDto;

import java.util.List;

public interface HddService {
    PageResponseDto<HddDto> getList(HddSearchDto searchDto);
    void modify(HddDto hddDto);
    HddDto get(Integer id);
    List<String> getVolumeNames();
    List<HddDto> getChildren(String volumnName, Integer pid);
}
