package com.crow5.portfolio.controller.admin;

import com.crow5.portfolio.mapper.ProjectMapper;
import com.crow5.portfolio.mapper.RevisionMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.http.MediaType.APPLICATION_JSON;

@WebMvcTest(AdminAuthController.class)
class AdminAuthControllerTest {
    @MockBean
    private ProjectMapper projectMapper;

    @MockBean
    private RevisionMapper revisionMapper;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void rejectsInvalidCredentials() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("AUTHENTICATION_REQUIRED"));
    }

    @Test
    void rejectsBlankCredentialsBeforeAuthentication() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_ERROR"));
    }
}
