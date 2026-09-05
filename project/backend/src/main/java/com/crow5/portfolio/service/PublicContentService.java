package com.crow5.portfolio.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.crow5.portfolio.entity.KnowledgeNode;
import com.crow5.portfolio.entity.LearningSummary;
import com.crow5.portfolio.dto.KnowledgeGraphResponse;
import com.crow5.portfolio.mapper.KnowledgeNodeMapper;
import com.crow5.portfolio.mapper.LearningSummaryMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PublicContentService {
    private final KnowledgeNodeMapper knowledgeNodeMapper;
    private final LearningSummaryMapper learningSummaryMapper;

    public PublicContentService(KnowledgeNodeMapper knowledgeNodeMapper, LearningSummaryMapper learningSummaryMapper) {
        this.knowledgeNodeMapper = knowledgeNodeMapper;
        this.learningSummaryMapper = learningSummaryMapper;
    }

    public List<KnowledgeNode> findPublishedKnowledgeNodes() {
        return knowledgeNodeMapper.selectList(new QueryWrapper<KnowledgeNode>().orderByAsc("id"));
    }

    public List<LearningSummary> findPublishedLearningSummaries() {
        return learningSummaryMapper.selectList(new QueryWrapper<LearningSummary>()
                .eq("published", true).orderByAsc("id"));
    }

    public KnowledgeGraphResponse findPublishedKnowledgeGraph() {
        return new KnowledgeGraphResponse(findPublishedKnowledgeNodes(), List.of());
    }
}
