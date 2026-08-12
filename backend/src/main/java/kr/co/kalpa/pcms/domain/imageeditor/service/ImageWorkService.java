package kr.co.kalpa.pcms.domain.imageeditor.service;

import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkListDto;
import kr.co.kalpa.pcms.domain.imageeditor.dto.ImageWorkUpsertDto;

public interface ImageWorkService {
    ImageWorkListDto getList();
    Long upsert(ImageWorkUpsertDto dto);
    void remove(Long id);
}
