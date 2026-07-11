package com.noordisplay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NoorDisplayApplication {
    public static void main(String[] args) {
        SpringApplication.run(NoorDisplayApplication.class, args);
    }
}
