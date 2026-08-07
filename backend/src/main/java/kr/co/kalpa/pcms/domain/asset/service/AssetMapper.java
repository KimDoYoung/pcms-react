package kr.co.kalpa.pcms.domain.asset.service;

import kr.co.kalpa.pcms.domain.asset.entity.Asset;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AssetMapper {
    void insertAsset(Asset asset);
    void updateAsset(Asset asset);
    void deleteAsset(@Param("id") Long id);
    List<Asset> selectAssetList(@Param("atype") String atype);
}
