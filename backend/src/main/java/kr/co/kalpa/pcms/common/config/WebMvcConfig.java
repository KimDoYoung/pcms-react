package kr.co.kalpa.pcms.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final FileProperties fileProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String editorImagesDir = fileProperties.getUpload().getEditorImagesDir();
        String absolutePath = Paths.get(editorImagesDir).toAbsolutePath().normalize().toString();

        registry.addResourceHandler("/editor-images/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}
