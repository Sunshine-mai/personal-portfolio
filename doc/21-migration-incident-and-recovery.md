# V2 迁移丢失事故与恢复记录

记录时间：2026-09-10

## 事件

`project/backend/src/main/resources/db/migration/` 只存在 `V1__create_portfolio_baseline.sql` 和 `V3__create_public_content_tables.sql`，但本地 MySQL 的 `flyway_schema_history` 记录了版本 2 已成功执行。也就是说：**仓库无法复现线上库的构建过程**。

## 原始证据

重建前从 `personal_portfolio` 库读出的 `flyway_schema_history`：

```text
rank=1  version=1  script=V1__create_portfolio_baseline.sql        checksum=1881988467  success=true  installed_on=2026-09-02 20:58:23
rank=2  version=2  script=V2__add_revision_review_status.sql       checksum=472695228   success=true  installed_on=2026-09-02 20:58:23
rank=3  version=3  script=V3__create_public_content_tables.sql     checksum=1707037090  success=true  installed_on=2026-09-03 16:26:16
```

补充证据：

- 全部 Git 历史（含所有分支）中从未出现过 `V2__*.sql`，该文件从未提交。
- IntelliJ 本地历史（`IntelliJIdea2024.3/LocalHistory`）中保留了一次文件系统快照，其中出现
  `target/classes/db/migration/V2__add_revision_review_status.sql`，说明该文件曾被 Maven 复制到 `target/classes`，
  但本地历史只保存了路径列表、没有保存文件正文，正文不可恢复。
- 重建前的库中 7 张表全部为 0 行，属于无业务数据的本地开发库。

## 影响

- 全新环境执行 `flyway migrate` 会得到与本地库不一致的 schema。
- `application.yml` 中的 `ignore-migration-patterns: *:missing` 会吞掉 Flyway 的告警，
  使这个问题不会被任何一次启动暴露。实测将该配置还原为默认值后启动即失败：

```text
Validate failed: Migrations have failed validation
Detected applied migration not resolved locally: 2.
```

## 处置决策

采用**复建迁移文件 + 本地库从零重建**（ADR-012），不使用 `repair` 掩盖，也不保留 `ignore-migration-patterns` 兜底。

理由：

1. `repair` 只对齐校验和，无法让全新环境复现迁移过程；
2. `ignore-migration-patterns` 会让 Flyway 长期失去发现同类问题的能力；
3. 本地库无业务数据，从零重建没有数据损失，并顺带完成 `doc/08` 要求的“从零建库迁移”验证。

## 处置过程

1. 完整导出重建前的 schema 指纹与 Flyway 历史作为证据。
2. 依据版本号、描述和现存 schema 复建 `V2__add_revision_review_status.sql`。
   由于 `revisions.status` 与 `idx_revisions_project_status` 已存在于 V1 基线中，
   复建版本写成幂等形式，保证对现有库和全新库执行结果一致。
3. 校验重建前的 6 张业务表行数为 0，然后删除全部表（含 `flyway_schema_history`）。
4. 移除 `application.yml` 的 `ignore-migration-patterns`，让 Flyway 恢复默认校验行为。
5. 启动后端，由 Flyway 从零执行 V1 → V2 → V3。

## 验证结果

```text
rank=1  version=1  script=V1__create_portfolio_baseline.sql      checksum=1881988467  success=true  installed_on=2026-09-10 21:36:52
rank=2  version=2  script=V2__add_revision_review_status.sql     checksum=318876657   success=true  installed_on=2026-09-10 21:36:52
rank=3  version=3  script=V3__create_public_content_tables.sql   checksum=1707037090  success=true  installed_on=2026-09-10 21:36:52
```

- V1 与 V3 的校验和与事故前记录完全一致，证明仓库中的 V1/V3 文件从未被改动。
- 重建后的 schema 结构与重建前逐列、逐索引一致。
- 用独立的 Flyway 校验和实现复核，V2 重建文件计算结果为 `318876657`，与 Flyway 实际记录一致。
- 后端在无任何 `ignore` 配置下启动成功，`/api/health`、`/api/public/projects`、`/api/public/learning-summaries` 均返回 200。

## 遗留说明

- 复建版本只保证**执行结果一致**，不保证与丢失的原始文件字节一致，原始校验和 `472695228` 已不可恢复。
- 本次只验证了本地 MySQL 8.0 环境的从零迁移；测试数据库隔离与事务回滚验证仍属于待补证据。

## 预防措施

- 迁移文件一经应用即视为不可变资产，必须在同一次提交中入库。
- 不使用 `ignore-migration-patterns` 之类的配置掩盖迁移状态不一致。
- 新增迁移后至少验证一次“全新库从零迁移 + schema 比对”，避免只在已有库上验证。
