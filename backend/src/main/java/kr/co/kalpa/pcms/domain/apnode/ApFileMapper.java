package kr.co.kalpa.pcms.domain.apnode;

import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface ApFileMapper {
    void insertFile(ApFile file);
    Optional<ApFile> selectByNodeId(String nodeId);
}
