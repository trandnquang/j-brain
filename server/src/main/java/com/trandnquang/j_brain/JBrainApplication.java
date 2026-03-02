package com.trandnquang.j_brain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class JBrainApplication {

    public static void main(String[] args) {
        SpringApplication.run(JBrainApplication.class, args);
    }

}
