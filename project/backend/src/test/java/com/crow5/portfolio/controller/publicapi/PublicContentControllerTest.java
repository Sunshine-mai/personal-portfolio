package com.crow5.portfolio.controller.publicapi;

import com.crow5.portfolio.mapper.KnowledgeNodeMapper;
import com.crow5.portfolio.mapper.LearningSummaryMapper;
import com.crow5.portfolio.dto.KnowledgeGraphResponse;
import com.crow5.portfolio.service.PublicContentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicContentController.class)
class PublicContentControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PublicContentService publicContentService;

    @MockBean
    private KnowledgeNodeMapper knowledgeNodeMapper;

    @MockBean
    private LearningSummaryMapper learningSummaryMapper;

    @Test
    void returnsEmptyKnowledgeListWhenNoPublishedNodesExist() throws Exception {
        when(publicContentService.findPublishedKnowledgeNodes()).thenReturn(List.of());

        mockMvc.perform(get("/api/public/knowledge/nodes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void returnsPublishedLearningSummaries() throws Exception {
        when(publicContentService.findPublishedLearningSummaries()).thenReturn(List.of());

        mockMvc.perform(get("/api/public/learning-summaries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isEmpty());
    }

    @Test
    void returnsKnowledgeGraphShapeWithoutInventingEdges() throws Exception {
        when(publicContentService.findPublishedKnowledgeGraph())
                .thenReturn(new KnowledgeGraphResponse(List.of(), List.of()));

        mockMvc.perform(get("/api/public/knowledge/graph"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.nodes").isEmpty())
                .andExpect(jsonPath("$.data.edges").isEmpty());
    }
}
