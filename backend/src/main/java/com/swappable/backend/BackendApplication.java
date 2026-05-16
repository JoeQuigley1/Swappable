package com.swappable.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.content.SpringBootTest;
@SpringBootTest(webEnviornment = SpringBootTest.WebEnviornment.RANDOM_PORT)
public class BackendApplicationTests {
// ...
}
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
@test
void contextLoads() {
}

