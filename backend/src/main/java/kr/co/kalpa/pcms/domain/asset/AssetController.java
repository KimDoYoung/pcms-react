package kr.co.kalpa.pcms.domain.asset;

import kr.co.kalpa.pcms.domain.asset.dto.AssetDto;
import kr.co.kalpa.pcms.domain.asset.service.AssetService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assets")
@Slf4j
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @PostMapping
    public ResponseEntity<Map<String, Long>> register(@RequestBody @Valid AssetDto assetDto) {
        log.info("register asset: {}", assetDto);
        Long id = assetService.register(assetDto);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @PutMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> modify(@PathVariable Long id, @RequestBody @Valid AssetDto assetDto) {
        log.info("modify asset: {}", assetDto);
        assetDto.setId(id);
        assetService.modify(assetDto);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        log.info("remove asset: {}", id);
        assetService.remove(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<AssetDto>> getList(@RequestParam(value = "atype", required = false) String atype) {
        return ResponseEntity.ok(assetService.getList(atype));
    }
}
