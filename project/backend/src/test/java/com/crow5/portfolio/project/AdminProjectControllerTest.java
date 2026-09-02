package com.crow5.portfolio.project;

import cn.dev33.satoken.stp.StpUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminProjectController.class, com.crow5.portfolio.auth.AdminAuthController.class},
        properties = "ADMIN_PASSWORD=secret")
class AdminProjectControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @Test
    void rejectsDraftCreationWithoutAdminSession() throws Exception {
        mockMvc.perform(post("/api/admin/projects")
                        .contentType(APPLICATION_JSON)
                        .content("{\"slug\":\"demo\",\"title\":\"Demo\",\"summary\":\"s\",\"background\":\"b\",\"outcome\":\"o\",\"role\":\"r\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createsDraftWhenAdminIsLoggedIn() throws Exception {
        Project project = new Project();
        project.setId(1L);
        project.setSlug("demo");
        project.setStatus("DRAFT");
        when(projectService.createDraft(any())).thenReturn(project);

        MvcResult login = mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andReturn();

        mockMvc.perform(post("/api/admin/projects")
                        .cookie(login.getResponse().getCookies()[0])
                        .contentType(APPLICATION_JSON)
                        .content("{\"slug\":\"demo\",\"title\":\"Demo\",\"summary\":\"s\",\"background\":\"b\",\"outcome\":\"o\",\"role\":\"r\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
    }
}
