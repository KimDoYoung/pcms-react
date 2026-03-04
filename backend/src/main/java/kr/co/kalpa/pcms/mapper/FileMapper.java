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
    /** fileId 목록에 해당하는 files 레코드 조회 (물리 삭제 경로 확인용) */
    List<CmsFile> selectFilesByIds(@Param("fileIds") List<Long> fileIds);
    void deleteFileMatchByTarget(
            @Param("tableName") String tableName,
            @Param("targetId") Long targetId,
            @Param("fileType") String fileType
    );
    /** 특정 fileId들의 file_match 삭제 */
    void deleteFileMatchByFileIds(@Param("fileIds") List<Long> fileIds);
    /** 특정 fileId들의 files 레코드 삭제 (물리 파일은 서비스에서 삭제) */
    void deleteFilesByIds(@Param("fileIds") List<Long> fileIds);
}
