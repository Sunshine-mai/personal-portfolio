package com.crow5.portfolio.project;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService extends ServiceImpl<ProjectMapper, Project> {
    public List<Project> findPublished() {
        return lambdaQuery()
                .eq(Project::getPublished, true)
                .orderByDesc(Project::getUpdatedAt)
                .list();
    }

    public Project findPublishedBySlug(String slug) {
        return lambdaQuery()
                .eq(Project::getSlug, slug)
                .eq(Project::getPublished, true)
                .one();
    }
}
