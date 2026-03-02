package com.trandnquang.j_brain.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Global WebClient configuration for non-blocking external API calls.
 *
 * <p>
 * WHY: Configuring Netty-level timeouts at the {@link WebClient} bean level
 * prevents resource starvation caused by slow/hanging upstream responses from
 * the Jotoba API. A single slow request should never hold a Reactor pipeline
 * thread indefinitely.
 */
@Configuration
public class WebClientConfig {

    /**
     * TCP connection establishment deadline in milliseconds (from
     * application.yaml).
     */
    @Value("${webclient.jotoba.connect-timeout-ms:5000}")
    private int connectTimeoutMs;

    /**
     * Full HTTP response body read deadline in milliseconds (from
     * application.yaml).
     */
    @Value("${webclient.jotoba.response-timeout-ms:10000}")
    private int responseTimeoutMs;

    /**
     * Pre-configured {@link WebClient} for all Jotoba dictionary API calls.
     * Netty-level connection and read/write timeouts are applied to prevent
     * thread starvation under network degradation.
     *
     * @param builder Spring-injected builder (pre-configured with actuator metrics)
     * @return Singleton WebClient scoped to {@code https://jotoba.de/api}
     */
    @Bean
    public WebClient jotobaWebClient(WebClient.Builder builder) {
        HttpClient httpClient = HttpClient.create()
                // Layer 1 — TCP connect timeout (handshake must complete within window)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
                // Layer 2 — Full response deadline from first byte to last
                .responseTimeout(Duration.ofMillis(responseTimeoutMs))
                // Layer 3 — Per-channel read/write handler (guards against slow streams)
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(responseTimeoutMs, TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(connectTimeoutMs, TimeUnit.MILLISECONDS)));

        return builder
                .baseUrl("https://jotoba.de/api")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
