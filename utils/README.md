# 工具目录

存放项目归档、秘密扫描、版本核验、外链检查、证据整理和发布前验证工具。

工具不得自动执行旧项目源码。旧项目的运行验证必须在独立、受控的人工环境中完成。

## browser-check.mjs

浏览器验收工具。用 Chrome DevTools Protocol 驱动无头 Chrome，**真的点击、翻页、按键和切换筛选**，而不只是截图。

```powershell
# 先启动前端（1001）与后端（2001），然后：
node utils/browser-check.mjs http://127.0.0.1:1001/
```

覆盖范围：

- 首屏统计、项目卡片数量与 API 状态行
- 卡片标签区分「公开截图」与「设计版式」
- 项目详情抽屉：图组缩略图、上一张/下一张、右箭头循环、点击缩略图跳转
- Escape 关闭抽屉并恢复页面滚动
- 合作项目的设计版式徽标与证据状态行
- 全部 / 独立开发 / 原型方案 / 合作项目 四种筛选
- 390px 移动端菜单展开
- 把关键交互状态截图写入 `gui-test-screenshots/`

退出码 `0` 表示全部通过，`1` 表示存在失败项，可直接用于门禁。

环境要求：本机安装 Chrome 或 Edge。脚本不使用 `child_process` 管道，浏览器通过 CDP 的 HTTP 与 WebSocket 端口通信。

## flyway-checksum.py

独立复算 Flyway 迁移校验和，用于判断迁移文件是否被改动过、以及仓库文件与
`flyway_schema_history` 记录的校验和是否一致。

```powershell
python utils/flyway-checksum.py project/backend/src/main/resources/db/migration/*.sql
python utils/flyway-checksum.py --expect 1881988467 <单个迁移文件>   # 不一致时退出码 1
```

这是 ADR-012 的配套控制项：迁移状态一旦不一致应当立刻发现，而不是被
`ignore-migration-patterns` 之类的配置掩盖。核对方法见脚本头部注释。

## demo-seed/second-brain/

AI Second Brain 的演示种子包：四份自撰演示文档、上传与向量化脚本、
`is_public` 标记工具，以及带引用来源校验的采集脚本。
用于在独立演示语料上采集对外截图，避免把真实资料带进公开页面。

```powershell
# 重建步骤与注意事项见
utils/demo-seed/second-brain/README.md
```

工具不得自动执行旧项目源码。旧项目的运行验证必须在独立、受控的人工环境中完成。
演示种子包只通过项目自身的公开接口写入数据，不执行旧项目源码。
