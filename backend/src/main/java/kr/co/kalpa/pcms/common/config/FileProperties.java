package kr.co.kalpa.pcms.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "file")
@Getter
@Setter
public class FileProperties {

    private Upload upload = new Upload();
    private Image image = new Image();
    private String tempDir;

    @Getter
    @Setter
    public static class Upload {
        private String baseDir;
        private String attachFilesDir;
        private String editorImagesDir;
    }

    @Getter
    @Setter
    public static class Image {
        private String baseUrl;
    }
}
