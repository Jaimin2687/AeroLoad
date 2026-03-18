package com.aeroload.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // Allow any origin so the SSE EventSource works regardless of
                // the Next.js dev-server port (3000, 3001, etc.)
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                // Expose headers so the browser can read custom response headers
                .exposedHeaders("*")
                // Must be false when allowedOriginPatterns("*") is used
                .allowCredentials(false)
                // Cache preflight for 1 hour
                .maxAge(3600);
    }
}