package kr.co.kalpa.pcms.domain.apnode.service;
import kr.co.kalpa.pcms.domain.apnode.entity.ApFile;

import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface ApFileMapper {
    void insertFile(ApFile file);
    Optional<ApFile> selectByNodeId(String nodeId);
}
