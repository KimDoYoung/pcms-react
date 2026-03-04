package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.ApFile;
import org.apache.ibatis.annotations.Mapper;

import java.util.Optional;

@Mapper
public interface ApFileMapper {
    void insertFile(ApFile file);
    Optional<ApFile> selectByNodeId(String nodeId);
}
