package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.CmsFile;
import kr.co.kalpa.pcms.domain.FileMatch;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FileMapper {
    void insertFile(CmsFile file);
    void insertFileMatch(FileMatch fileMatch);
    List<FileMatch> selectFileMatchByTarget(
            @Param("tableName") String tableName,
            @Param("targetId") Long targetId,
            @Param("fileType") String fileType
    );
    void deleteFileMatchByTarget(
            @Param("tableName") String tableName,
            @Param("targetId") Long targetId,
            @Param("fileType") String fileType
    );
}
