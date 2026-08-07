package kr.co.kalpa.pcms.domain.asset.service;

import kr.co.kalpa.pcms.domain.asset.dto.AssetDto;
import kr.co.kalpa.pcms.domain.asset.entity.Asset;

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
public class AssetServiceImpl implements AssetService {

    private final AssetMapper assetMapper;

    @Override
    public Long register(AssetDto assetDto) {
        Asset asset = Asset.builder()
                .atype(assetDto.getAtype())
                .name(assetDto.getName())
                .value(assetDto.getValue())
                .build();
        assetMapper.insertAsset(asset);
        return asset.getId();
    }

    @Override
    public void modify(AssetDto assetDto) {
        Asset asset = Asset.builder()
                .id(assetDto.getId())
                .atype(assetDto.getAtype())
                .name(assetDto.getName())
                .value(assetDto.getValue())
                .build();
        assetMapper.updateAsset(asset);
    }

    @Override
    public void remove(Long id) {
        assetMapper.deleteAsset(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetDto> getList(String atype) {
        return assetMapper.selectAssetList(atype).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private AssetDto toDto(Asset asset) {
        return AssetDto.builder()
                .id(asset.getId())
                .atype(asset.getAtype())
                .name(asset.getName())
                .value(asset.getValue())
                .build();
    }
}
