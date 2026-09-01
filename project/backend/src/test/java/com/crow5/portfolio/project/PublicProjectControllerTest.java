package com.crow5.portfolio.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicProjectController.class)
class PublicProjectControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @Test
    void listsOnlyPublishedProjectsFromService() throws Exception {
        Project project = new Project();
        project.setSlug("translator");
        project.setTitle("AI Translator");
        project.setPublished(true);
        when(projectService.findPublished()).thenReturn(List.of(project));

        mockMvc.perform(get("/api/public/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].slug").value("translator"));
    }

    @Test
    void returnsNotFoundForMissingSlug() throws Exception {
        when(projectService.findPublishedBySlug(eq("missing"))).thenReturn(null);

        mockMvc.perform(get("/api/public/projects/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("RESOURCE_NOT_FOUND"));
    }
}
