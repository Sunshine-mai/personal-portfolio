# AI Second Brain 演示种子包

用于为一台**全新环境**重建一个不含真实资料的演示账号与演示语料，
以便安全地采集截图或对外演示。整理自 2026-09-12 的采集过程。

## 为什么要独立演示语料

该项目的检索条件是 `s.user_id = ? OR d.is_public = 1`。
只要库中存在标记为公共的文档，演示账号提问就可能把它们捞进回答与引用面板。
因此用于对外展示的截图必须在**独立演示语料**上采集，而不是在真实资料上采集。

## 目录内容

| 文件 | 用途 |
|---|---|
| `rag-basics.md` | 演示文档：检索增强生成的四个核心环节 |
| `vector-search.md` | 演示文档：向量检索与相似度计算 |
| `prompt-design.md` | 演示文档：提示词设计与上下文组装 |
| `kb-guidelines.md` | 演示文档：知识库整理规范与使用边界 |
| `upload-demo.ps1` | 上传前两份文档并触发解析与向量化 |
| `upload-demo2.ps1` | 上传后两份文档并触发解析与向量化 |
| `PublicFlag.java` | 查看或临时调整 `is_public` 标记，用于采集时隔离公共文档 |
| `capture-brain.mjs` | 驱动无头 Chrome 采集文档页与对话页，并在写图前校验引用来源 |

四份演示文档均为**自撰技术说明**，不含任何第三方作品或真实业务资料。

## 重建步骤

前置：后端运行在 8080，前端在 5173，MySQL 可用。

```powershell
# 1. 注册演示账号（密码需满足大小写字母 + 数字，8-20 位）
curl.exe -s -X POST http://127.0.0.1:8080/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"username\":\"demo_showcase\",\"password\":\"DemoShowcase2026\",\"nickname\":\"Demo\"}'

# 2. 上传演示文档并向量化（脚本内使用 curl.exe，兼容 Windows PowerShell 5.1）
& utils\demo-seed\second-brain\upload-demo.ps1
& utils\demo-seed\second-brain\upload-demo2.ps1

# 3. 若库中存在他人标记为公共的文档，采集前先临时置私有
java -cp <mysql-connector-j.jar> utils\demo-seed\second-brain\PublicFlag.java dump
java -cp <mysql-connector-j.jar> utils\demo-seed\second-brain\PublicFlag.java set 0 12,35,36

# 4. 采集（脚本自带引用来源校验，命中他人文档特征时拒绝写图）
node utils\demo-seed\second-brain\capture-brain.mjs

# 5. 无论采集结果如何，都要还原公共标记（原值以第 3 步 dump 的输出为准）
java -cp <mysql-connector-j.jar> utils\demo-seed\second-brain\PublicFlag.java set 1 12,35,36
java -cp <mysql-connector-j.jar> utils\demo-seed\second-brain\PublicFlag.java dump
```

## 注意事项

- 向量化由本地 BGE-Small-ZH 完成，不产生外部调用费用；只有对话生成会调用付费模型。
- 第 3 步与第 5 步必须成对执行。建议用 `try/finally` 包住采集步骤，保证还原一定发生。
- 采集脚本的校验是**内容级**的：引用面板显示的是片段正文而非文档标题，
  因此校验必须针对正文中的特征短语，检查标题是无效的。
- `PublicFlag.java` 只改动 `is_public` 一个字段，不触碰其他任何数据。
