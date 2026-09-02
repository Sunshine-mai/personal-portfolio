package com.crow5.portfolio;

import com.crow5.portfolio.project.ProjectMapper;
import com.crow5.portfolio.project.RevisionMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration"
})
class PortfolioApplicationTests {
    @MockBean
    private ProjectMapper projectMapper;

    @MockBean
    private RevisionMapper revisionMapper;

    @Test
    void contextLoadsWithoutDatabase() {
        assertTrue(true);
    }
}
