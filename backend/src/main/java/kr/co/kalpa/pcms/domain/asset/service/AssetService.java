package kr.co.kalpa.pcms.domain.asset.service;

import kr.co.kalpa.pcms.domain.asset.dto.AssetDto;

import java.util.List;

public interface AssetService {
    Long register(AssetDto assetDto);
    void modify(AssetDto assetDto);
    void remove(Long id);
    List<AssetDto> getList(String atype);
}
