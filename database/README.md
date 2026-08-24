# 数据库目录

存放数据库迁移、初始化数据和验证脚本。

禁止存放：

- 真实数据库密码
- 真实用户数据
- 生产数据库备份
- API Key、Token 或私钥

迁移由 `project/backend/alembic` 管理。进入 `project/backend` 后执行 `..\.venv\Scripts\alembic.exe -c alembic.ini upgrade head`；通过 `DATABASE_URL` 覆盖默认 SQLite 连接。基线包含项目、修订、管理员和审计事件表。
