package com.crow5.portfolio.common;

import cn.dev33.satoken.exception.NotLoginException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Map<String, String>> authentication(IllegalArgumentException exception) {
        return new ApiResponse<>(401, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> validation() {
        return new ApiResponse<>(400, "VALIDATION_ERROR", Map.of());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> status(ResponseStatusException exception) {
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                exception.getStatusCode().value(), exception.getReason(), Map.of()
        );
        return ResponseEntity.status(exception.getStatusCode()).body(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> state(IllegalStateException exception) {
        int status = "RESOURCE_NOT_FOUND".equals(exception.getMessage()) ? 404 : 409;
        ApiResponse<Map<String, String>> response = new ApiResponse<>(status, exception.getMessage(), Map.of());
        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(NotLoginException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> notLogin() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(401, "AUTHENTICATION_REQUIRED", Map.of()));
    }
}
