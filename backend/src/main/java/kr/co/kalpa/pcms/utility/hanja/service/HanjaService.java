package kr.co.kalpa.pcms.utility.hanja.service;

import kr.co.kalpa.pcms.utility.hanja.dto.HanjaDto;

import java.util.List;

public interface HanjaService {
    List<HanjaDto> search(String korean);
}
