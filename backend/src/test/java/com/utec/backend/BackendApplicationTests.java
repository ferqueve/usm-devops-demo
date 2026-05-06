package com.utec.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class BackendApplicationTests {

	@Test
	void contextLoads() {
		// Spring Boot context bootstrapping smoke test:
		// si el contexto no levanta, JUnit reporta el fallo automáticamente.
	}

}
