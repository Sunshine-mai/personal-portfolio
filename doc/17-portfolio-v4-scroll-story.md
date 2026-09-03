# 个人作品集 V4 滚动叙事原型

## 目标

V4 在 V3 的作品优先信息架构上增加滚动叙事：访客向下滚动时依次打开首页、AI 作品、剪辑作品、灵感与计划、关于我五个章节。页面仍然以可扫描的作品档案为主体，动画只负责揭示层级，不接管用户滚轮。

## 原型访问

直接双击 `prototype/portfolio-v4.html` 即可访问，也可以在项目根目录执行 `python -m http.server 4173 --directory prototype` 后打开 `http://127.0.0.1:4173/portfolio-v4.html`。页面通过相对路径加载 V4 CSS 与 JS，不依赖后端、构建工具或图片资源。

## 滚动行为

- 桌面端使用 `scroll-snap-type: y proximity`，滚动到章节附近时自然吸附，不阻止 `wheel` 事件，也不强制跳页。
- `IntersectionObserver` 在章节进入视口后加入可见状态，依次揭示标题、筛选、作品和章节脚注。
- 左侧细线显示阅读进度，顶部导航同步当前章节。
- 手机端关闭 scroll snap，采用自然滚动，避免窄屏设备被强制带走。
- 系统设置减少动效时，揭示动画和过渡会关闭。

## 内容编辑

作品内容全部集中在 `prototype/portfolio-v4.js` 顶部的 `works` 数组，灵感内容集中在 `ideas` 数组。替换真实剪辑作品时，替换对应对象的标题、封面类名、状态、摘要、工具和链接字段即可；当前两个剪辑条目明确标注为“示例待替换”。

## 已实现交互

- AI 作品与剪辑作品独立章节、筛选按钮和空状态。
- 作品卡片支持鼠标点击、键盘 Enter/空格打开详情抽屉。
- 详情抽屉展示类型、状态、摘要、角色、工具、结果/边界和下一步。
- 抽屉支持关闭按钮、ESC、点击遮罩，并恢复打开前的焦点。
- 收藏状态通过 `localStorage` 保存，卡片和详情抽屉同步显示。
- 联系邮箱复制与 Toast 反馈、移动端导航菜单、可见焦点状态。

## 版本边界与回滚

V3 文件保留为本轮稳定回滚基线：`prototype/portfolio-v3.html`、`prototype/portfolio-v3.css`、`prototype/portfolio-v3.js`。V4 仍是高保真原型，尚未迁移到 `project/frontend/`，不修改正式前端和后端。确认后再按“字段确认 → Vue 组件迁移 → API 对接 → 单元/接口/浏览器验收 → 人工发布”进入开发。

## 验证记录

- `node --check prototype/portfolio-v4.js`：通过。
- `git diff --check`：通过。
- 仅新增 V4 原型和说明文档，未覆盖 V3。
