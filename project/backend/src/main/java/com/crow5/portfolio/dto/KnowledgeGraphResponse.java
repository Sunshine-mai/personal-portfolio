package com.crow5.portfolio.dto;

import com.crow5.portfolio.entity.KnowledgeNode;

import java.util.List;

public record KnowledgeGraphResponse(List<KnowledgeNode> nodes, List<KnowledgeEdge> edges) {
    public record KnowledgeEdge(String source, String target, String relation) {
    }
}
