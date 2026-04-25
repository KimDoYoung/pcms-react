package kr.co.kalpa.pcms.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final FileProperties fileProperties;

    @Value("${apnode.file.base-dir}")
    private String apnodeBaseDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String editorImagesDir = fileProperties.getUpload().getEditorImagesDir();
        String absolutePath = Paths.get(editorImagesDir).toAbsolutePath().normalize().toString();

        registry.addResourceHandler("/editor-images/**")
                .addResourceLocations("file:" + absolutePath + "/");

        String apnodeAbsolutePath = Paths.get(apnodeBaseDir).toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/apnodes/**")
                .addResourceLocations("file:" + apnodeAbsolutePath + "/");

        String tempAbsolutePath = Paths.get(fileProperties.getTempDir()).toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/temp/**")
                .addResourceLocations("file:" + tempAbsolutePath + "/");
    }
}
