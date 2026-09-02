package com.crow5.portfolio.project;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("revisions")
public class Revision {
    @TableId
    private Long id;
    private Long projectId;
    private Integer number;
    private String snapshot;
    private String changeSummary;
    private String status;
    private LocalDateTime createdAt;
}
