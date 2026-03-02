package com.trandnquang.j_brain.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Global Configuration for Spring AI ChatClient.
 * 
 * WHY: We inject ChatClient application-wide so we can easily swap between
 * models
 * (e.g. cloud OpenAI vs Local LM Studio) strictly driven by application.yml
 * properties without altering service logic.
 */
@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        // Properties mapping to OpenAI spec are defined in application.yml
        return builder.build();
    }
}
