package kr.co.kalpa.pcms.domain.file;

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
    List<CmsFile> selectFilesByIds(@Param("fileIds") List<Long> fileIds);
    void deleteFileMatchByTarget(
            @Param("tableName") String tableName,
            @Param("targetId") Long targetId,
            @Param("fileType") String fileType
    );
    void deleteFileMatchByFileIds(@Param("fileIds") List<Long> fileIds);
    void deleteFilesByIds(@Param("fileIds") List<Long> fileIds);
}
