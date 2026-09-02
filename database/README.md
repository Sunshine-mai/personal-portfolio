# 数据库目录

存放数据库迁移、初始化数据和验证脚本。

禁止存放：

- 真实数据库密码
- 真实用户数据
- 生产数据库备份
- API Key、Token 或私钥

Java 后端的数据库迁移由 Flyway 管理，迁移文件位于 `project/backend/src/main/resources/db/migration/`，应用启动时会自动执行。连接配置通过 `DB_URL`、`DB_USERNAME` 和 `DB_PASSWORD` 注入，默认服务端口为 `2001`，默认数据库为 MySQL 8 的 `personal_portfolio`。

当前 `project/backend/alembic/` 和 `project/backend/portfolio.db` 属于旧 Python/FastAPI 实现，仅用于迁移参考，不由 Java 服务接管，也不要直接删除。Java 基线迁移包含项目、修订、管理员和审计事件表；真实 MySQL 环境建立后，应从空数据库执行 Flyway 迁移并验证重复启动幂等性。
