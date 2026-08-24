# Alembic 迁移

在 `project/backend` 目录执行：

```powershell
..\.venv\Scripts\alembic.exe -c alembic.ini upgrade head
```

迁移会读取 `DATABASE_URL`；未设置时使用本地 `sqlite:///./portfolio.db`。生产环境不得把密钥或密码写入迁移文件。
