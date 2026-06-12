# AutoMedia

AutoMedia 是一个自动视频剪辑与多平台发布项目。目标是让用户上传一个或多个视频后，由系统自动完成合并、清理、字幕、特效、标题、封面和发布准备，同时保留可见、可改、可回退的 timeline。

这个项目独立于 `projects/ai-assistant`。

## 当前文档

- [AutoMedia PRD](docs/prd.md)
- [历史初始计划](docs/initial_plan.md)

## Demo

- [Web demo](index.html)

## Local App Shell

```bash
npm run serve
```

The demo runs at `http://127.0.0.1:4173`.

## Verification

```bash
npm run verify:m0
```

The M0 verifier starts the static server, launches headless Chrome, executes the app JavaScript, clicks the main user paths, and checks the route/view state.
