package com.taans.zennercore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ZennerCoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZennerCoreApplication.class, args);
    }

}
