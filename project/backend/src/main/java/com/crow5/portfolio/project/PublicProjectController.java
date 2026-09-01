package com.crow5.portfolio.project;

import com.crow5.portfolio.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/projects")
public class PublicProjectController {
    private final ProjectService projectService;

    public PublicProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ApiResponse<List<Project>> list() {
        return ApiResponse.success(projectService.findPublished());
    }

    @GetMapping("/{slug}")
    public ApiResponse<Project> detail(@PathVariable String slug) {
        Project project = projectService.findPublishedBySlug(slug);
        if (project == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND");
        }
        return ApiResponse.success(project);
    }
}
