package com.crow5.portfolio.project;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.crow5.portfolio.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/projects")
@SaCheckLogin
public class AdminProjectController {
    private final ProjectService projectService;

    public AdminProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Project> create(@Valid @RequestBody ProjectCreateRequest request) {
        return new ApiResponse<>(201, "created", projectService.createDraft(request));
    }

    @PostMapping("/{id}/submit-review")
    public ApiResponse<Project> submitReview(@PathVariable Long id) {
        return ApiResponse.success(projectService.submitReview(id));
    }
}
