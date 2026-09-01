package com.crow5.portfolio.auth;

import cn.dev33.satoken.stp.StpUtil;
import com.crow5.portfolio.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
    private final String adminUsername;
    private final String adminPassword;

    public AdminAuthController(
            @Value("${ADMIN_USERNAME:admin}") String adminUsername,
            @Value("${ADMIN_PASSWORD:}") String adminPassword
    ) {
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        if (!adminUsername.equals(request.username()) || !adminPassword.equals(request.password())) {
            throw new IllegalArgumentException("AUTHENTICATION_REQUIRED");
        }
        StpUtil.login(request.username());
        return ApiResponse.success(Map.of("token_type", "satoken", "access_token", StpUtil.getTokenValue()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        StpUtil.logout();
        return ApiResponse.success(null);
    }
}
