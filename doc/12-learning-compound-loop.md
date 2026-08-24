# 复利学习闭环

## 1. 三次复用

```text
第一次：ai-dev-lab 学习概念并复述
第二次：在 ai-translator 或 Java 项目中精读和验证
第三次：在个人作品集里用自己的话解释，并关联证据
```

## 2. Java→Python 映射

| Python | Java 对照 | 复习任务 |
|---|---|---|
| 函数 | 方法 | 解释翻译服务的输入和输出 |
| 模块/import | package/import | 画出后端导入链 |
| 类 | class | 对照 SQLAlchemy 模型 |
| 字典/列表 | Map/List | 用真实项目数据做统计 |
| 异常 | try/catch | 追踪统一异常处理 |
| FastAPI 依赖注入 | Spring 依赖注入 | 解释请求到服务的调用链 |
| Pydantic | DTO 与校验 | 对照请求和响应模型 |
| SQLAlchemy | JPA/MyBatis | 对照查询、事务和迁移 |
| async/await | Java 异步模型 | 用实际 API 调用比较差异 |
| middleware | Filter/Interceptor | 解释 CORS、限流和异常链 |

映射用于建立直觉，不代表两种语言机制完全相同。每个对照必须回到 Python 原理本身。

## 3. 私教验证三问

每个阶段结束回答：

1. 能否不查资料画出数据流？
2. 能否主动修改 AI 代码 3 处逻辑？
3. 能否指出 AI 代码 1 处边界、性能或安全问题？

## 4. 作品集中的学习证据

每条公开学习摘要尽量包含：学习问题、对照项目、实践输出、理解变化和下一步。详细过程和私人反思继续留在 `ai-dev-lab/NOTES.md`、`ai-dev-lab/REFLECTION.md`。

## 5. 不返工原则

- 学习实验不直接污染正式项目。
- 实验成熟后整理成干净实现，再进入正式项目。
- 作品集只接收审查通过的发布快照。
- 不能公开的内容只保留脱敏结论和验证摘要。
