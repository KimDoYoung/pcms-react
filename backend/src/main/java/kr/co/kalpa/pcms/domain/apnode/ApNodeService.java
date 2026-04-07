package kr.co.kalpa.pcms.domain.apnode;

import kr.co.kalpa.pcms.domain.apnode.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface ApNodeService {
    List<ApNodeDto> listRoots();
    List<ApNodeDto> listChildren(String parentId);
    List<ApNodeDto> getPath(String id);
    ApNodeDto getNode(String id);

    ApNodeDto createDirectory(DirectoryCreateDto dto);
    ApNodeDto uploadFile(String parentId, MultipartFile file) throws IOException;
    ApNodeDto createLink(LinkCreateDto dto);

    ApNodeDto rename(String id, NodeRenameDto dto);
    ApNodeDto move(String id, NodeMoveDto dto);
    void delete(String id);

    FileDownloadDto getFileForDownload(String id);
}
