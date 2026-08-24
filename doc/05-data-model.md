# 数据模型设计

## 1. 核心实体

### Project

- `id`
- `slug`
- `title`
- `summary`
- `background`
- `outcome`
- `project_type`：`collaborative` / `independent`
- `role`
- `maturity`
- `visibility`
- `repository_url`
- `demo_url`
- `run_guide_id`
- `current_revision_id`
- `published_revision_id`
- 时间字段

### ProjectContribution

记录负责范围、具体工作、产出、共享成果和公开级别。合作项目必须使用此实体区分团队成果与个人贡献。

### TechStackItem

技术名称、分类、官方链接、项目使用版本、使用方式和选型理由。

### DecisionRecord

采用 ADR 结构：背景、约束、候选方案、最终决策、理由、代价、状态、关联项目版本。

### Evidence

证据类型、支持的声明、来源 URL、文件引用、commit SHA、发布版本、核验时间、状态、公开级别和完整性摘要。

### ArchitectureArtifact

架构图类型、标题、说明、来源格式、文件引用、关联项目版本和核验时间。

### KnowledgeNode / KnowledgeEdge

节点保存知识点；边保存“使用于、影响决策、验证于、前置于”等关系。关系型数据库即可支撑首期图谱。

### LearningSummary

公开学习主题、理解变化、实践输出、关联项目、关联知识点和 `ai-dev-lab` 详细记录链接。

### ContentRevision

实体修订号、快照、修改摘要、作者和时间。公开版本不可被后续编辑覆盖。

### Review / Publication / AuditEvent

分别记录审核结果、发布制品和安全审计事件。

## 2. 关键约束

- `slug` 唯一。
- 公开查询只读取发布投影。
- 公开边不能指向私有节点。
- 知识边端点必须存在，默认禁止自环。
- 发布快照绑定内容版本、源码 SHA、构建摘要和审核记录。
- 删除、下线和修改必须记录审计事件。
