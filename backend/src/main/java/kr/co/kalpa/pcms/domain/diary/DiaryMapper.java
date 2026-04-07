package kr.co.kalpa.pcms.domain.diary;

import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface DiaryMapper {
    void insertDiary(Diary diary);
    Optional<Diary> selectDiaryById(Long id);
    void updateDiary(Diary diary);
    void deleteDiary(Long id);
    List<Diary> selectDiaryList(DiarySearchDto searchDto);
    int selectDiaryCount(DiarySearchDto searchDto);
}
