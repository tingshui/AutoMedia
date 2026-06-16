# AutoMedia PRD

## 1. 文档状态

| 项 | 内容 |
|---|---|
| 文档类型 | Product Requirements Document |
| 最近细化 | 2026-06-16 |
| 产品阶段 | 本地 MVP 实现中 |
| 当前依据 | `index.html`、`src/app.js`、`scripts/serve.mjs`、`db/migrations/001_initial_schema.sql`、现有 validation docs 至 M8 planning |
| 核心术语表 | `AutoMedia/CONTEXT.md` |
| 目标 | 定义一个本地视频剪辑工作流的产品合同：从 source assets 和 style memory 生成可检查 timeline、可 review 的自动剪辑、本地 export 和 publishing drafts。 |

AutoMedia 已经不再是静态 demo。当前 app shell 已经包含本地 HTTP server、SQLite、hash route、API-backed Home/Style/Editor flows、timeline persistence、fixture media import、catalog-backed timeline items、auto-edit dry-run 和 Auto Edit Review。后续能力仍然需要明确标注 claim layer，尤其是真实 transcription、真实 render/export 和外部 publishing。

## 2. 产品定义

AutoMedia 是一个 agentic video editing 与 publishing preparation 系统。用户创建或恢复 project，选择 source media 和 style profile，让系统根据 edit steps 与 style rules 生成 timeline items，再逐条 review generated actions，手动 override 不满意的部分，最后准备平台发布所需的 title、cover、draft 和 schedule。

产品核心不是复刻 CapCut 的手工工具面板，而是把自动生成、人工修正、风格记忆和发布准备串成一个可追踪 workflow。所有 generated output 都必须回答四个问题：

| 问题 | 产品要求 |
|---|---|
| 改了什么 | 产生 timeline item、subtitle segment、publish asset、title candidate、export 或 publishing draft。 |
| 为什么改 | 能看到来源 edit step、style rule、job input/output 或 user action。 |
| 用户能否改 | 用户可以 edit、delete、accept、reject 或标记 needs_change。 |
| 系统能声称什么 | MVP 必须区分 plan-level、fixture-level、mock 和 real-rendered output。 |

## 3. 用户和任务

| 用户 | Job To Be Done |
|---|---|
| 从原始素材剪视频的 creator | 创建 project、导入视频、生成第一版 timeline，并手动调整 generated items。 |
| 有稳定剪辑偏好的 creator | 维护 style profiles 和 style rules，让后续 project 复用自己的剪辑习惯。 |
| 准备多平台发布的 creator | 生成并选择 title、cover、platform draft 和 schedule，但避免误发到外部平台。 |
| 验证 AutoMedia 的 builder | 用确定性的 browser/API/DB checks 证明 user-visible behavior 与 persistence 一致。 |

## 4. 产品范围

| 能力 | MVP 状态 | 边界 |
|---|---|---|
| 本地 app shell | In scope | `scripts/serve.mjs` 提供静态资源和 API；浏览器 route 使用 hash routes。 |
| SQLite persistence | In scope | 本地 DB 位于 `data/automedia.sqlite3`；reset 与 verifier 定义 deterministic state。 |
| Home project workflow | In scope | Recent projects 读 DB；新建 project 写 project、source asset、project asset、layout、tracks、edit steps、selected style。 |
| Style memory | In scope | 读取、重命名、enable/disable rule、删除 rule/style 并写 confirmation event；Jianying-derived styles 是 reviewable style profiles。 |
| Timeline editing | In scope | 通过 UI/API 添加 video、text、subtitle、effect、audio effect、music、sticker、transition；删除使用 soft delete。 |
| Auto-edit dry run | In scope | 根据 enabled edit steps 和 enabled style rules 创建 `auto_edit` job 与 generated timeline preview items。 |
| Auto Edit Review | In scope | Latest dry-run actions 可检查，可标记 accepted、rejected、needs_change。 |
| Fixture subtitle/audio pipeline | Planned M8a | 只生成 deterministic fixture transcript 和 pause markers；不声称真实 Whisper 或 audio extraction。 |
| Local export | Planned M9 | 优先真实 FFmpeg export；mock export 必须标记 `mock_rendered`。 |
| Publishing preparation | Planned M10 | 持久化 titles、covers、platform drafts 和 schedules；MVP 不执行外部发布。 |
| Analytics/comments/replies | Future | Home summary 可以保留；真实 ingestion 和 reply actions 进入后续范围。 |
| Voice control | Future | 作为 timeline command layer 延后。 |

## 5. 信息架构

### 5.1 Home

Home 是默认入口。Home 不显示 sidebar，也不显示 editor-only topbar actions。

| Surface | Requirement |
|---|---|
| Recent projects | 读取 non-deleted projects，按最近更新时间排序；empty state 和 DB-error state 必须可见。 |
| New video | 打开 modal；confirm 必须有 filename 和 active style；cancel 不创建任何 row。 |
| Style summary | 读取 active style profiles；deleted styles 不显示。 |
| Platform analysis summary | MVP 只保留 summary 或 placeholder，不声称 analytics ingestion。 |
| Comment reply summary | MVP 只保留 summary 或 placeholder，不执行外部 reply。 |

### 5.2 Editor

Editor 由 recent project 或 new project 进入。Editor 包含 sidebar、可编辑 project title、save、auto-edit、export、preview area、timeline 和右侧 tool panel。

| Surface | Requirement |
|---|---|
| Route | `#/editor/:projectId` 加载指定 project；missing/failed project 显示可见错误或 toast。 |
| Sidebar | 显示 Home、Video Editing、Video Publishing；点击 Home 退出 editing context 并隐藏 sidebar。 |
| Project title | 用户编辑后标记 dirty；save 持久化到 `projects.title`。 |
| Layout divider | 拖动改变 preview/timeline 高度；save 持久化到 `project_layout_preferences`。 |
| Edit steps | 四个 canonical edit steps 对 project 持久化：`arrange_timeline`、`clean_speech`、`subtitles_bilingual`、`apply_style_profile`。 |
| Timeline | 按 track 渲染 active timeline items；deleted items 不出现在 timeline。 |
| Tool panel | 所有工具通过 public controls 创建 timeline items，reload/re-entry 后仍可见。 |

### 5.3 Style Manager

Style Manager 从 Home 进入，只显示简化 sidebar，里面只有 Home。

| Surface | Requirement |
|---|---|
| Style list | 读取 `style_profiles.deleted_at IS NULL` 的 styles。 |
| Style detail | 展示 style name 和 active rules。 |
| Rename | 更新 `style_profiles.name`，并刷新 Home、modal、Style Manager。 |
| Rule enablement | 更新 `style_rules.enabled`。 |
| Rule delete | 必须弹 confirmation modal，并写 `confirmation_events`；confirm soft-delete rule，cancel 保留 rule。 |
| Style delete | 必须弹 confirmation modal，并写 `confirmation_events`；confirm soft-delete style，cancel 保留 style。 |
| New style | MVP 可以从 reference videos 生成 deterministic draft rules；真实 style ML 需要另行实现和验证。 |

### 5.4 Publishing

Publishing 在存在明确外部发布流程前，只做发布准备。

| Surface | Requirement |
|---|---|
| Title candidates | 按 project/platform 持久化，遵守单选或多选 policy。 |
| Cover assets | 持久化 master cover 和 platform-specific crops。 |
| Platform drafts | 持久化平台选择、账号、title、cover/video asset、description、tags、status 和 schedule。 |
| Schedule | 持久化 `scheduled_at`；不调用外部平台 API。 |
| External publish | MVP 阻断；后续必须有 confirmation flow 和 platform integration。 |

## 6. 核心领域模型

### 6.1 Project Creation Contract

确认创建新视频时，必须在一个 transaction 里创建 project 的最小可用子状态。

| Object | Required rows or fields |
|---|---|
| `projects` | `title`、`status='draft'`、thumbnail asset、zero playhead、timestamps。 |
| `source_assets` | placeholder 或 imported source video，并带 metadata JSON。 |
| `project_assets` | `role='source'` 的 source relationship 和 deterministic ordering。 |
| `project_layout_preferences` | 默认 preview/timeline heights。 |
| `timeline_tracks` | Video、Audio、Subtitles、Effects。 |
| `edit_steps` | 四个 canonical steps 默认 enabled。 |
| `project_style_profiles` | selected style profile relationship。 |

### 6.2 Timeline Contract

Timeline 是 project 的 editable source of truth。

| Rule | Requirement |
|---|---|
| Time range | `start_ms >= 0`，`end_ms >= start_ms`，默认 `duration_ms = end_ms - start_ms`。 |
| Track placement | item type 决定 track：video → Video，audio/music → Audio，subtitle → Subtitles，effect/text/sticker/transition → Effects。 |
| Properties | `properties_json` 保存 type-specific editable values 和 provenance，且必须是 valid JSON。 |
| Generated provenance | generated items 设置 `generated_by_job_id`，并保留 reason/claim metadata。 |
| Manual override | 用户编辑 generated item 后设置 `manual_override=1`；regeneration 保留 overridden items。 |
| Delete | 删除 timeline item 使用 soft delete；linked subtitle segments 遵守 subtitle orphan policy。 |

### 6.3 Subtitle Contract

字幕文本和 timing 的 source of truth 是 `subtitle_segments`。Subtitle timeline items 是 timeline 上的可编辑 surface，指向一个或多个 segments。

| Flow | Requirement |
|---|---|
| Manual subtitle creation | 按句子切分输入文本，创建 subtitle segments，把 segment ids 写入 timeline item properties，并标记 manual override。 |
| Generated fixture subtitle | M8a 计划同时写 singular `subtitle_segment_id` 和 array `subtitle_segment_ids`，兼容 M6 manual subtitle。 |
| Edit subtitle | 更新 timeline item properties 和所有 active linked subtitle segment text，同时保留 timing/provenance。 |
| Delete subtitle item | Soft-delete item，并按当前 policy soft-delete active linked subtitle segments。 |

### 6.4 Style Memory Contract

Style profiles 是可复用剪辑偏好，不是 final rendered edits。

| Object | Requirement |
|---|---|
| `style_profiles` | Name、summary、timestamps、optional soft-delete。 |
| `style_rules` | Rule type、human-readable text、machine-readable JSON、enabled flag、confidence、source、optional soft-delete。 |
| Jianying import | Imported styles 是 reviewable；V3 rules 在 rule JSON 中标记 `review_status='needs_review'`，不能默认当成正确规则。 |
| Project style selection | Auto-edit 读取 latest active project style relationship 和 enabled active rules。 |

### 6.5 Auto-Edit Dry Run Contract

Auto-edit v1 是 plan-level。它生成可检查 preview items 和 job output，不声称 final video rendering。

| Step | Generated behavior |
|---|---|
| `arrange_timeline` | 从 primary source asset 创建 generated video item。 |
| `clean_speech` | 创建表示口播清理意图的 generated marker 或 text item。 |
| `subtitles_bilingual` | 创建 dry-run 范围内的 generated subtitle preview item。 |
| `apply_style_profile` | 根据 enabled style rules 创建 generated preview items。 |

规则：

1. 运行 auto-edit 创建 `job_type='auto_edit'` 且 `status='succeeded'` 的 `jobs` row。
2. `jobs.input_json` 记录 project id、style id/name、enabled edit steps、enabled rule ids、source asset id、duration basis。
3. `jobs.output_json` 记录 `claim_layer='plan_level_only'`、ordered actions、generated timeline item ids 和 warnings。
4. 插入新 dry-run output 前，soft-delete 当前 project 里 previous non-overridden generated auto-edit items。
5. Generated item properties 必须保留 label、text、action kind、style rule id/type、reason、claim layer。

### 6.6 Auto Edit Review Contract

Review 只针对 project 的 latest successful auto-edit job。

| Review status | Timeline effect | DB effect |
|---|---|---|
| `pending` | Item 保持 active。 | `properties_json.review_status` 缺失时由 UI/server derive。 |
| `accepted` | Item 保持 active。 | Merge `review_status='accepted'`，保持 `manual_override=0`。 |
| `needs_change` | Item 保持 active。 | Merge `review_status='needs_change'`，设置 `manual_override=1`。 |
| `rejected` | Item 从 active timeline 消失，但仍在 Review 中可检查。 | Merge `review_status='rejected'`，设置 `deleted_at`；当前 slice 中 terminal。 |

Review cards 必须从 latest job 的 `output_json.actions` 派生，并 join 到包含 soft-deleted rows 的 timeline items。这样 rejected items 不污染 active timeline，但仍可被用户检查。

### 6.7 Fixture Subtitle/Audio Pipeline Contract

M8a 是 fixture-only，除非后续 PRD 更新把真实 transcription 提升为 in scope。

| Claim | Requirement |
|---|---|
| Transcript | 只使用 deterministic fixture rows。 |
| Audio cleanup | 只生成 deterministic silence/long-pause markers。 |
| Job type | `transcribe`，input/output JSON 必须写 fixture pipeline metadata。 |
| UI | Subtitles tab 暴露可见 run control，并显示 editable generated subtitle textareas。 |
| Boundary | 不声称 Whisper、不声称 rendered-video、不自动剪掉 silence。 |

### 6.8 Export Contract

M9 目标是真实 local export。如果开发环境没有 FFmpeg，只允许临时 mock output，并且必须使用 `exports.status='mock_rendered'` 和 visible UI copy 标明 mock export。

| Case | Requirement |
|---|---|
| Real export | 创建 `exports`/`jobs` rows，并生成存在于磁盘上的 file。 |
| Failed export | 写 failed status，并展示 visible error。 |
| Timeline changed | Export 使用 latest active timeline state。 |
| Mock export | 不能显示为 `ready`。 |

### 6.9 Publishing Draft Contract

Publishing 只创建 durable preparation data，并停在外部 side effects 之前。

| Object | Requirement |
|---|---|
| `title_candidates` | generated 或 user-entered titles、platform target、rationale、selected flag。 |
| `publish_assets` | covers、rendered videos、thumbnails、crop JSON、cover text JSON、platform ratio。 |
| `platform_accounts` | stub account records 和 auth status。 |
| `platform_posts` | draft 或 scheduled post records。 |
| Confirmation | external publish 必须等后续 confirmation event 和 platform integration。 |

## 7. Public Interfaces

### 7.1 Browser Routes

| Route | Requirement |
|---|---|
| `#/home` | Home without sidebar。 |
| `#/editor/:projectId` | 加载 project-specific editor state。 |
| `#/editor` | 加载 current project 或 first project。 |
| `#/styles` | Style Manager。 |
| `#/publishing` | Publishing preparation page。 |

### 7.2 API Surface

| Endpoint | Purpose |
|---|---|
| `GET /api/bootstrap` | Home bootstrap：recent projects 和 active styles。 |
| `POST /api/projects` | 根据 filename 和 style id 创建 project。 |
| `GET /api/projects/:projectId` | 加载 project workspace。 |
| `PATCH /api/projects/:projectId/save` | 持久化 title、layout、edit steps。 |
| `POST /api/projects/:projectId/import-asset` | 导入 fixture 或 allowed local source asset。 |
| `POST /api/projects/:projectId/timeline-items` | 创建 manual 或 catalog timeline item。 |
| `POST /api/projects/:projectId/auto-edit-dry-run` | 创建 plan-level generated timeline preview items。 |
| `PATCH /api/timeline-items/:itemId` | 更新 editable timeline item properties。 |
| `DELETE /api/timeline-items/:itemId` | Soft-delete active timeline item。 |
| `PATCH /api/timeline-items/:itemId/review` | Review latest auto-edit generated item。 |
| `GET /api/styles` | 列出 active styles。 |
| `GET /api/styles/:styleId` | 加载 style detail。 |
| `PATCH /api/styles/:styleId` | Rename style。 |
| `DELETE /api/styles/:styleId` | Confirm/cancel style delete。 |
| `PATCH /api/style-rules/:ruleId` | Enable/disable style rule。 |
| `DELETE /api/style-rules/:ruleId` | Confirm/cancel style rule delete。 |
| `POST /api/styles/import-jianying-first` | 导入 first Jianying-derived style。 |
| `POST /api/styles/import-jianying-v3` | Upsert calibrated Jianying v3 style。 |

Planned endpoints 实现后必须补进这张表，尤其是 M8 subtitle/audio、M9 export、M10 publishing APIs。

## 8. Safety And Confirmation Policy

| Action | MVP requirement |
|---|---|
| Delete style rule | 需要 confirmation，写 `confirmation_events`。 |
| Delete style profile | 需要 confirmation，写 `confirmation_events`。 |
| Recut generated timeline | 当 recut 会破坏性改变 persisted output 时，需要先 confirmation。 |
| External publish | 在 confirmation 和 platform integration 存在前阻断。 |
| External reply | 在 confirmation 和 comment/reply integration 存在前阻断。 |

取消 confirmation 不能产生 destructive state change。为了 auditability，显示过 confirmation flow 的 cancel 可以记录为 `decision='cancelled'`。

## 9. Acceptance Principles

1. 每个 write path 必须通过 public browser action 或 public API 触发，再用 persisted state audit。
2. Write-path validation 必须包含 reload 或 route re-entry。
3. Generated output 必须包含 provenance 和 claim layer。
4. Silent failure risk 需要具体 verifier，不能用 keyword grep 代替。
5. Model/prompt-tuned features 在 tuning 前必须定义 train/validation/test split。Deterministic fixture-only flows 可以标记 N/A。
6. External side effects 不进 MVP，除非后续 PRD 更新明确 confirmation、credentials、API behavior 和 rollback/audit policy。

## 10. Open Product Decisions

下面是按 grill-with-docs 方式压出来的剩余决策。推荐答案已写入上面的 PRD，但在 M8 之后继续实现前值得再确认。

| Decision | Recommended answer |
|---|---|
| Generated auto-edit 是否可以叫 final editing | 使用 `Auto-Edit Dry Run`，直到 real render/export 被验证。 |
| Subtitle text 的 source of truth 在哪里 | `subtitle_segments` 是 source of truth；timeline items 是 editable surface，并缓存 linked text 供渲染。 |
| Rejected review items 是否彻底消失 | 从 active timeline 隐藏，但通过 latest job actions 保留在 Auto Edit Review 里。 |
| MVP publishing 是否真实发平台 | 不发。MVP 只创建 drafts 和 schedules。External publish 进入单独 confirmation-gated milestone。 |
| Imported Jianying styles 是否自动启用全部规则 | 不自动。Imported/calibrated rules 保持 reviewable，由 enabled rules 决定 auto-edit output。 |
