# 旧项目归档、审查与发布流程

## 1. 目标

三个旧项目不能直接复制到公开平台。必须先确认版本、授权、隐私、运行状态、内容真实性和证据，再生成可发布快照。

## 2. 每个项目的审查包

```text
project-audit/<project-slug>/
├── inventory.md
├── version-report.md
├── secret-scan-report.md
├── license-report.md
├── run-report.md
├── feature-checklist.md
├── contribution-boundary.md
├── evidence-index.md
└── publish-decision.md
```

## 3. 审查顺序

```text
收集素材
→ 归属与授权检查
→ 当前树与 Git 历史秘密扫描
→ 依赖与版本核验
→ 干净环境安装和运行
→ 核心功能与 Demo 验证
→ 架构、贡献和事实核验
→ 脱敏整理
→ 人工批准
→ 生成发布快照
```

## 4. 阻断项

- API Key、密码、Token、私钥或真实用户数据命中。
- 合作项目公开授权不明确。
- 项目描述夸大个人贡献。
- 展示版本与源码、Demo、截图不一致。
- 无法在干净环境运行且没有明确说明。
- 关键事实没有证据支撑。
- 未知许可证或内部资料被公开。

## 5. 发布状态

```text
DRAFT
→ READY_FOR_REVIEW
→ IN_REVIEW
→ CHANGES_REQUESTED → DRAFT
→ APPROVED
→ PUBLISHING
→ PUBLISHED
```

异常状态：`PUBLISH_FAILED`、`UNPUBLISHED`、`ARCHIVED`。

## 6. 版本绑定

每次发布必须记录：项目源码完整 commit SHA、发布标签、前后端和数据库版本、Demo 核验时间、内容修订号、扫描报告摘要、构建产物摘要和人工批准记录。

## 7. 公开原则

作品集平台不下载、不克隆、不执行旧项目源码。旧项目运行验证在独立人工环境完成，平台只保存审查结果和脱敏后的展示材料。
