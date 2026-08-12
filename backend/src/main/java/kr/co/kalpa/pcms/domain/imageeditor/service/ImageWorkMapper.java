package kr.co.kalpa.pcms.domain.imageeditor.service;

import kr.co.kalpa.pcms.domain.imageeditor.entity.ImageWork;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ImageWorkMapper {
    void insertImageWork(ImageWork imageWork);
    int updateImageWork(ImageWork imageWork);
    int deleteImageWork(@Param("id") Long id, @Param("createdBy") String createdBy);
    List<ImageWork> selectImageWorkList(@Param("createdBy") String createdBy);
    int selectImageWorkCount(@Param("createdBy") String createdBy);
}
