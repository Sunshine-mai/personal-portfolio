# 个人作品集 V3 高保真原型

## 结论

V3 将首页从“工程叙述型档案”调整为“作品优先”的编辑式作品集：访客首先看到个人定位、精选作品和作品数量，再按 AI 作品、剪辑作品、灵感与计划、关于我浏览内容。V2 文件全部保留，作为可回滚基线。

## 原型访问方式

直接双击打开 `prototype/portfolio-v3.html` 即可访问；HTML 通过相对路径加载同目录的 `portfolio-v3.css` 与 `portfolio-v3.js`。字体使用 DM Sans、DM Mono、Playfair Display 的网络字体回退链；页面不依赖图片、后端或构建工具。若离线打开，系统字体回退仍可运行。

## 内容编辑位置

所有作品内容集中在 `prototype/portfolio-v3.js` 顶部的 `works` 数组；字段包括 `group`、`filter`、`cover`、`title`、`type`、`status`、`summary`、`role`、`tools`、`boundary`、`next` 和 `tags`。灵感与计划内容位于同文件的 `ideas` 数组。替换剪辑示例时，只需替换对应数组对象，并保留授权与真实状态说明。

## 已实现交互

- 顶部导航锚点：首页、AI 作品、剪辑作品、灵感与计划、关于我。
- AI 与剪辑独立分区，分别拥有分类筛选、数量和空状态。
- 每张卡片可通过按钮或键盘 Enter/空格打开详情抽屉，卡片有 hover、focus 和点击反馈。
- 详情抽屉展示类型、状态、摘要、我的角色、技术/工具、结果/边界、下一步。
- 抽屉支持关闭按钮、ESC、点击遮罩，并在关闭后恢复触发元素焦点。
- 移动端导航菜单、复制联系邮箱 toast、收藏/重点标记反馈；收藏保存在浏览器 localStorage。
- `prefers-reduced-motion` 下关闭滚动、抽屉和卡片动效。
- 使用语义化 section、article、nav、aside、dialog 语义属性、可见焦点样式与至少 44px 触控目标。

## 范围与安全边界

本次只新增 `prototype/` 和 `doc/` 下的文件，不修改 `project/frontend`、`project/backend`、数据库、工具包或现有原型。AI Translator、AI Second Brain、大学新闻网和教学平台内容来自 V2 证据台账的脱敏事实；大学新闻网明确为合作项目，教学平台明确为原型。剪辑内容明确标注“示例待替换”，封面全部为 CSS 构成，不使用外部图片或占位图。

## 当前阶段与回滚

当前仍处于原型阶段，尚未进入正式开发，也未迁移到 Vue 前端。回滚基线为现有 `prototype/portfolio-v2.html` 及其已存在的 V2 相关文件；V3 不覆盖、不重命名、不删除 V2 文件。确认 V3 视觉与交互后，迁移路径为：确认信息架构与字段 → 在 Vue 3 + Vite 中复刻组件和状态 → 对接已发布内容 API → 补充单元、接口、浏览器和响应式验收 → 人工确认后发布不可变快照。

## 验收记录

- 已检查新增 HTML、CSS、JS 和文档的内容结构。
- 已确认作品数据位于 JS 数组，HTML 不重复维护作品正文。
- 已执行 `git diff --check`，无空白错误。
- 未提交 Git；V2 与业务前后端目录保持不变。
