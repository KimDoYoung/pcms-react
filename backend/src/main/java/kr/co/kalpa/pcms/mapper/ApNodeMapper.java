package kr.co.kalpa.pcms.mapper;

import kr.co.kalpa.pcms.domain.ApNode;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ApNodeMapper {
    void insertNode(ApNode node);
    Optional<ApNode> selectById(String id);
    List<ApNode> selectRoots();
    List<ApNode> selectChildren(String parentId);
    List<ApNode> selectAncestors(String id); // breadcrumb: 루트까지 조상 목록

    void softDelete(String id);
    void updateName(@Param("id") String id, @Param("name") String name);
    void updateParent(@Param("id") String id, @Param("parentId") String parentId, @Param("depth") int depth);

    void incrementChildCount(String parentId);
    void decrementChildCount(String parentId);
    void updateTotalSize(@Param("parentId") String parentId, @Param("delta") long delta);
}
