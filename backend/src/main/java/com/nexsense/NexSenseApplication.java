package com.nexsense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class NexSenseApplication {
    public static void main(String[] args) {
        SpringApplication.run(NexSenseApplication.class, args);
    }
}
