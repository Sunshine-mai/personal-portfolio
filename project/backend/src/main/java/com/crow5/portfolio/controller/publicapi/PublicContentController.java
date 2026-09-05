package com.crow5.portfolio.controller.publicapi;

import com.crow5.portfolio.common.ApiResponse;
import com.crow5.portfolio.dto.KnowledgeGraphResponse;
import com.crow5.portfolio.entity.KnowledgeNode;
import com.crow5.portfolio.entity.LearningSummary;
import com.crow5.portfolio.service.PublicContentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicContentController {
    private final PublicContentService publicContentService;

    public PublicContentController(PublicContentService publicContentService) {
        this.publicContentService = publicContentService;
    }

    @GetMapping("/knowledge/nodes")
    public ApiResponse<List<KnowledgeNode>> knowledgeNodes() {
        return ApiResponse.success(publicContentService.findPublishedKnowledgeNodes());
    }

    @GetMapping("/knowledge/graph")
    public ApiResponse<KnowledgeGraphResponse> knowledgeGraph() {
        return ApiResponse.success(publicContentService.findPublishedKnowledgeGraph());
    }

    @GetMapping("/learning-summaries")
    public ApiResponse<List<LearningSummary>> learningSummaries() {
        return ApiResponse.success(publicContentService.findPublishedLearningSummaries());
    }
}
