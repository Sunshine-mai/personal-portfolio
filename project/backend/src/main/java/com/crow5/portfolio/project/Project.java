package com.crow5.portfolio.project;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("projects")
public class Project {
    @TableId
    private Long id;
    private String slug;
    private String title;
    private String summary;
    private String background;
    private String outcome;
    private String role;
    private String projectType;
    private String status;
    private Boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
