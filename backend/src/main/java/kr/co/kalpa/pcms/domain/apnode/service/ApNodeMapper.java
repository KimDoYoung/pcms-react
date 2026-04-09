package kr.co.kalpa.pcms.domain.apnode.service;
import kr.co.kalpa.pcms.domain.apnode.entity.ApNode;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ApNodeMapper {
    void insertNode(ApNode node);
    Optional<ApNode> selectById(String id);
    Optional<ApNode> selectByNameAndParent(@Param("name") String name, @Param("parentId") String parentId);
    List<ApNode> selectRoots();
    List<ApNode> selectChildren(String parentId);
    List<ApNode> selectAncestors(String id);

    void softDelete(String id);
    void softDeleteDescendants(String id);
    void updateName(@Param("id") String id, @Param("name") String name);
    void updateParent(@Param("id") String id, @Param("parentId") String parentId, @Param("depth") int depth);

    void incrementChildCount(String parentId);
    void decrementChildCount(String parentId);
    void updateTotalSize(@Param("parentId") String parentId, @Param("delta") long delta);
    void updateTotalSizeForAncestors(@Param("ids") String ids, @Param("delta") long delta);
    void updateNodeTotalSize(@Param("id") String id, @Param("size") long size);
}
