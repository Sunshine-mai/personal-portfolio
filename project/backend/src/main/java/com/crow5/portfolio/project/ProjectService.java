package com.crow5.portfolio.project;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import java.util.Map;

import java.util.List;

@Service
public class ProjectService {
    private final ProjectMapper projectMapper;
    private final RevisionMapper revisionMapper;
    private final ObjectMapper objectMapper;

    public ProjectService(ProjectMapper projectMapper, RevisionMapper revisionMapper, ObjectMapper objectMapper) {
        this.projectMapper = projectMapper;
        this.revisionMapper = revisionMapper;
        this.objectMapper = objectMapper;
    }

    public List<Project> findPublished() {
        return projectMapper.selectList(new QueryWrapper<Project>()
                .eq("published", true)
                .orderByDesc("updated_at"));
    }

    public Project findPublishedBySlug(String slug) {
        return projectMapper.selectOne(new QueryWrapper<Project>()
                .eq("slug", slug)
                .eq("published", true));
    }

    @Transactional
    public Project createDraft(ProjectCreateRequest request) {
        Project project = new Project();
        project.setSlug(request.slug());
        project.setTitle(request.title());
        project.setSummary(request.summary());
        project.setBackground(request.background());
        project.setOutcome(request.outcome());
        project.setRole(request.role());
        project.setProjectType(request.projectType() == null ? "independent" : request.projectType());
        project.setStatus("DRAFT");
        project.setPublished(false);
        projectMapper.insert(project);

        Revision revision = new Revision();
        revision.setProjectId(project.getId());
        revision.setNumber(1);
        revision.setSnapshot(snapshot(request));
        revision.setChangeSummary("Initial project draft");
        revision.setStatus("DRAFT");
        revisionMapper.insert(revision);
        return project;
    }

    @Transactional
    public Project submitReview(Long projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new IllegalStateException("RESOURCE_NOT_FOUND");
        }
        if (!"DRAFT".equals(project.getStatus())) {
            throw new IllegalStateException("INVALID_STATE_TRANSITION");
        }
        Revision revision = revisionMapper.selectOne(
                new QueryWrapper<Revision>()
                        .eq("project_id", projectId)
                        .eq("number", 1)
        );
        if (revision == null || !"DRAFT".equals(revision.getStatus())) {
            throw new IllegalStateException("INVALID_STATE_TRANSITION");
        }
        revision.setStatus("READY_FOR_REVIEW");
        revisionMapper.updateById(revision);
        project.setStatus("READY_FOR_REVIEW");
        projectMapper.updateById(project);
        return project;
    }

    private String snapshot(ProjectCreateRequest request) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "slug", request.slug(), "title", request.title(), "summary", request.summary(),
                    "background", request.background(), "outcome", request.outcome(), "role", request.role(),
                    "projectType", request.projectType() == null ? "independent" : request.projectType()
            ));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("SNAPSHOT_SERIALIZATION_FAILED", exception);
        }
    }
}
