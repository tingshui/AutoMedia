# AutoMedia PRD

## 1. 文档状态

| 项 | 内容 |
|---|---|
| 文档类型 | Product Requirements Document |
| 当前依据 | 最新静态 demo：`AutoMedia/index.html`、`AutoMedia/src/styles.css`、`AutoMedia/src/app.js` |
| 产品阶段 | Demo → MVP 规格定义 |
| 当前实现状态 | 静态前端 demo，无真实后端、数据库、视频处理、平台发布 |
| 目标 | 把最新页面变化沉淀成产品功能、交互状态、数据库和后续实现边界 |

## 2. 产品定义

AutoMedia 是一个自动视频剪辑、风格记忆、发布准备和多平台运营系统。用户从主页进入项目，可以恢复最近编辑的视频，也可以创建新视频。创建时选择素材和剪辑风格，进入剪辑工作台后，AutoMedia 根据用户选择的自动剪辑步骤和风格规则生成可编辑 timeline。剪辑完成后进入视频发布页，准备标题、封面、平台选择和定时发布。

产品的核心不是单纯模仿 CapCut 的工具面板，而是把工具面板、timeline、风格记忆和发布准备串成一个 agentic workflow。自动生成的内容必须可见、可修改、可删除、可追踪。

## 3. 范围分层

| 能力 | 当前 Demo 已表达 | MVP 需要实现 | Future |
|---|---:|---:|---:|
| 暗色主页工作台 | 是 | 是 | 是 |
| 最近编辑视频恢复 | 静态卡片 | 读取真实 projects | 加搜索、过滤、归档 |
| 新视频创建弹窗 | 静态 modal | 导入真实视频文件 | 云端素材库、批量导入 |
| 风格选择 | 静态选项 | 绑定 style_profiles | 自动推荐风格 |
| 视频剪辑工作台 | 静态 UI | 可编辑 timeline 和导出 | 协作编辑 |
| 自动剪辑步骤选择 | 静态 checkbox | 写入 edit_steps 并触发 job | 根据素材自动推荐步骤 |
| 视频预览和 timeline 分割线 | Demo 交互 | 持久化布局偏好 | 多布局 preset |
| Timeline 横向滚动 | Demo 交互 | 长视频真实时间轴 | 缩放、多轨锁定 |
| 右侧 8 个剪辑工具 tab | 静态面板 | 操作真实 timeline item | 插件化素材市场 |
| 视频发布页 | 静态 UI | 生成标题、封面、平台草稿 | 真实 API 发布 |
| 平台分析 | 主页 summary | 可先保留 summary | 真实平台数据采集 |
| 留言回复 | 主页 summary | 可先保留 summary | 评论采集、草稿、审批、回复 |
| 语音控制 | 未在最新 demo 表达 | 不进 MVP 必做 | 后续作为 timeline command layer |

## 4. 信息架构和 View State

### 4.1 Home

主页是 AutoMedia 的默认入口。一打开 demo 时直接进入主页。

主页规则：

| 项 | 要求 |
|---|---|
| Sidebar | 不显示 |
| 背景 | 暗色工作台风格 |
| Topbar | 显示 `AutoMedia 工作台` |
| Editor-only actions | 不显示撤销、重做、开始自动剪辑、导出、保存 |
| 页面模块 | 最近编辑的视频、制作新视频、我的视频风格管理、平台分析、留言回复 |

### 4.2 Editor

只有用户点击最近视频，或在新视频弹窗中确认创建后，才进入视频剪辑页。

Editor 规则：

| 项 | 要求 |
|---|---|
| Sidebar | 显示 |
| Sidebar 项 | 主页、视频剪辑、视频发布 |
| 点击主页 | 完全退出视频编辑上下文，返回无 sidebar 的主页 |
| Topbar | 显示可编辑视频名、撤销、重做、开始自动剪辑、导出、保存 |
| 视频剪辑下拉 | 任何时候都可展开/收起 |
| 自动剪辑步骤 | 默认全选，取消任一项时弹出是否重新开始自动剪辑 |

### 4.3 Publishing

视频发布页从 sidebar 的 `视频发布` 进入。

Publishing 规则：

| 项 | 要求 |
|---|---|
| Sidebar | 显示 |
| Sidebar 项 | 主页、视频剪辑、视频发布 |
| 主要 tabs | 标题推荐、封面设计、平台选择、定时发布 |
| 当前边界 | 只做发布准备和排期 UI，不执行真实外部发布 |

### 4.4 Style Manager

风格管理页从主页的 `我的视频风格管理` 进入。

Style Manager 规则：

| 项 | 要求 |
|---|---|
| Sidebar | 显示简化版 |
| Sidebar 项 | 只显示主页 |
| 隐藏项 | 视频剪辑、视频发布、style memory card |
| 返回主页 | 点击主页退出风格管理，回到无 sidebar 的主页 |

## 5. Home 功能需求

### 5.1 最近编辑的视频

展示用户最近编辑过的视频项目。

| 字段 | 说明 | 数据来源 |
|---|---|---|
| 缩略图 | 最近保存的 cover 或视频 frame | `projects.thumbnail_asset_id` 或 `publish_assets` |
| 标题 | 项目名 | `projects.title` |
| 草稿状态 | 未完成、字幕待确认、封面待选择等 | `projects.status`、派生 job 状态 |
| 最近编辑位置 | playhead 或最后保存时间点 | `projects.last_playhead_ms` |

交互：

1. 点击视频卡片进入 Editor。
2. Editor 读取对应项目的素材、timeline、风格、步骤设置。
3. 如果有未完成 job，MVP 可以显示恢复状态，当前 demo 不实现。

### 5.2 制作新视频

点击 `制作新视频` 打开 `newVideoModal`。

弹窗包含：

| 功能 | 要求 |
|---|---|
| 视频选择 | 支持拖拽本地视频，也支持从 pull-down/library 打开 |
| 风格选择 | 展示 AutoMedia 根据历史视频总结出的风格，例如严肃、日常、幽默 |
| 取消 | 关闭弹窗，不创建 project |
| 确认 | 创建 project，导入素材，绑定选中风格，进入 Editor |

MVP 需要写入：

| 表 | 写入内容 |
|---|---|
| `projects` | 新项目、标题、状态、默认布局 |
| `source_assets` | 用户导入的视频文件 |
| `project_assets` | project 与素材关系 |
| `project_style_profiles` | project 选择的风格 |
| `edit_steps` | 默认自动剪辑步骤 |

### 5.3 我的视频风格管理入口

主页展示用户已有风格 chip，并提供 `进入管理`。

当前 demo 风格：

| 风格 | 含义 |
|---|---|
| 严肃 | 观点型内容、低频特效、字幕清晰 |
| 日常 | 生活片段、轻背景乐、柔和转场 |
| 幽默 | 综艺标签、强调音效、快节奏切点 |

### 5.4 平台分析 Summary

当前主页只展示平台分析摘要。完整分析页不在当前 demo 中。

MVP 边界：

| 层级 | 范围 |
|---|---|
| Demo | 展示 summary card |
| MVP | 可以保留 summary，占位即可 |
| Future | 对接平台数据，生成趋势、规律和策略建议 |

### 5.5 留言回复 Summary

当前主页只展示留言回复摘要。完整评论管理和自动回复不在当前 demo 中。

MVP 边界：

| 层级 | 范围 |
|---|---|
| Demo | 展示 summary card |
| MVP | 可以保留 summary，占位即可 |
| Future | 评论采集、分类、回复草稿、用户审批、真实回复 |

## 6. 视频剪辑功能需求

### 6.1 Topbar

Editor topbar 包含：

| 控件 | 要求 | 数据影响 |
|---|---|---|
| 可编辑视频名 | 用户可直接修改项目名 | 更新 `projects.title` |
| 撤销 | 撤回最近一次 timeline 操作 | 读取 `edit_history` |
| 重做 | 恢复被撤销操作 | 读取 `edit_history` |
| 开始自动剪辑 | 按当前步骤和风格创建自动剪辑 job | 写入 `jobs` |
| 导出 | 创建本地 export job | 写入 `exports`、`jobs` |
| 保存 | 保存 project、timeline、布局、步骤状态 | 更新多个 project 相关表 |

### 6.2 自动剪辑步骤下拉

`视频剪辑` sidebar item 下方展示自动剪辑步骤。默认全选。

| 步骤 | 写入字段 | 说明 |
|---|---|---|
| 按上传顺序放入 timeline | `edit_steps.step_key = arrange_timeline` | 将 source assets 顺序生成 video clips |
| 去气音、停顿、重复和口误 | `step_key = clean_speech` | 生成音频清理和裁剪建议 |
| 生成中文 + 英文字幕 | `step_key = subtitles_bilingual` | 生成字幕轨道 |
| 套用最近剪辑风格 | `step_key = apply_style_profile` | 根据 style rules 生成效果 |

取消任一步骤时，系统弹出 `recutConfirmModal`：

| 用户动作 | 结果 |
|---|---|
| 暂时不用 | 只更新 checkbox 状态，不立即重剪 |
| 重新开始 | 新建 auto_edit job，按最新步骤重建 generated timeline items |

### 6.3 视频 Canvas

视频 Canvas 展示当前 playhead 位置的合成预览。

需要展示：

| 内容 | 来源 |
|---|---|
| 原视频 frame | `source_assets`、`timeline_items` |
| 字幕 | `timeline_items.item_type = subtitle` |
| 特效 overlay | `item_type = effect/sticker/text` |
| 背景音状态 | `item_type = background_music` |

### 6.4 视频与 Timeline 分割线

视频预览和 timeline 中间有水平分割线，用户可上下拖动。

MVP 数据：

| 字段 | 表 | 说明 |
|---|---|---|
| `video_panel_height` | `project_layout_preferences` | 视频区域高度 |
| `timeline_panel_height` | `project_layout_preferences` | timeline 区域高度 |

### 6.5 Timeline

Timeline 是编辑状态的 source of truth。长视频 timeline 必须可横向滚动。

当前轨道：

| Track | 内容 |
|---|---|
| Video | 原始片段、裁剪片段、补充视频 |
| Audio | 清理后人声、原始音频、voice tail |
| Subtitles | 中文字幕、英文字幕、关键词高亮 |
| Effects | zoom、pop label、frame、transition |

Timeline item 要求：

| 字段 | 说明 |
|---|---|
| `id` | timeline item id |
| `project_id` | 所属项目 |
| `track_id` | 所属轨道 |
| `item_type` | video、audio、subtitle、effect、music、text、sticker、transition |
| `source_asset_id` | 可为空，特效或文本可能没有源素材 |
| `start_ms` | timeline 起点 |
| `end_ms` | timeline 终点 |
| `duration_ms` | item 时长。可持久化，默认等于 `end_ms - start_ms` |
| `source_start_ms` | 源素材起点 |
| `source_end_ms` | 源素材终点 |
| `properties_json` | 字幕文本、特效强度、crop、音量等 |
| `generated_by_job_id` | 由哪个自动剪辑 job 生成 |
| `is_locked` | 是否锁定 |
| `is_muted` | 是否静音 |
| `created_at`、`updated_at` | 时间戳 |

自动生成的 timeline item 必须可删除、可修改。用户修改后需要记录为人工 override。

### 6.6 右侧动态工具栏

视频剪辑页右侧有 8 个 tab。

| Tab | 功能 | 主要数据表 |
|---|---|---|
| 添加视频 | 展示项目素材，加入 timeline | `source_assets`、`project_assets`、`timeline_items` |
| 特效 | 添加视觉效果、frame、综艺效果 | `effect_presets`、`timeline_items` |
| 音效 | 添加短音效、音频增强、降噪参数 | `audio_presets`、`timeline_items` |
| 字幕 | 生成、编辑、选择中文/英文/双语字幕 | `subtitle_segments`、`timeline_items` |
| 背景音 | 选择背景音乐和音量 | `music_assets`、`timeline_items` |
| 文本 | 添加标题卡、关键词、步骤编号、CTA | `text_templates`、`timeline_items` |
| 贴纸 | 添加贴纸、箭头、气泡、轻量表情 | `sticker_assets`、`timeline_items` |
| 转场 | 添加 clip 间转场 | `transition_presets`、`timeline_items` |

## 7. 视频发布功能需求

视频发布页是剪辑完成后的发布准备页面。当前 demo 不执行真实外部发布。

### 7.1 标题推荐

展示多个标题候选。

| 字段 | 表 |
|---|---|
| title text | `title_candidates.title` |
| target platform | `title_candidates.platform_key` |
| rationale | `title_candidates.rationale` |
| selected | `title_candidates.is_selected` |

### 7.2 封面设计

封面设计包含 master cover 和平台比例适配。

控件：

| 控件 | 写入字段 |
|---|---|
| 缩放 | `publish_assets.crop_json.scale` |
| 横向位置 | `crop_json.x` |
| 纵向位置 | `crop_json.y` |
| 标题字号 | `cover_text_json.font_size` |

平台比例：

| 平台 | 比例 | 说明 |
|---|---|---|
| 小红书 | 3:4 | 生活方式封面，标题更醒目 |
| Bilibili | 16:10 | 横版封面，适合分区和信息密度 |
| YouTube | 16:9 | thumbnail，需要适配英文标题 |
| 抖音 | 9:16 | 竖版封面，适合短标题 |

### 7.3 平台选择

平台选择列出：

| 平台 | 需要准备的字段 |
|---|---|
| 小红书 | title、cover、description、hashtags、topic tags |
| Bilibili | title、cover、description、category、tags |
| YouTube | title、thumbnail、description、tags、visibility |
| 抖音 | title、cover、hashtags、music policy check |

### 7.4 定时发布

定时发布 tab 展示已选平台和发布时间。

| 字段 | 表 |
|---|---|
| platform_key | `platform_posts.platform_key` |
| scheduled_at | `platform_posts.scheduled_at` |
| status | `platform_posts.status` |
| publish_asset_id | `platform_posts.publish_asset_id` |

外部发布规则：

1. MVP 只生成草稿和排期数据。
2. 真实对外发布必须另有最终确认。
3. 没有用户确认时，不允许发到小红书、Bilibili、YouTube 或抖音。

## 8. 风格管理功能需求

风格管理用于维护 AutoMedia 从用户历史视频中总结出的剪辑风格。

### 8.1 风格列表

每个风格展示：

| 字段 | 说明 |
|---|---|
| 风格名 | 可编辑 |
| 创建时间 | `style_profiles.created_at` |
| 摘要 | 自动总结或用户填写 |
| 规则数量 | 派生自 `style_rules` |

### 8.2 风格详情

点击风格卡片打开详情弹窗。

功能：

| 功能 | 要求 |
|---|---|
| 修改风格名 | 更新 `style_profiles.name` |
| 查看规则 | 展示 `style_rules` |
| 勾选/取消规则 | 更新 `style_rules.enabled` |
| 删除规则 | 弹出确认框，确认后软删除或硬删除 |
| 保存风格 | 保存名称和规则状态 |

### 8.3 删除风格

用户要求风格可删除。当前 demo 没有风格级删除按钮，这是 demo gap。

PRD 要求：

1. 风格详情中应增加删除风格入口。
2. 删除风格必须弹确认框。
3. 已被 project 使用的风格默认软删除，保留历史 project 可回放。
4. 未被任何 project 使用的风格可以硬删除或软删除，MVP 建议统一软删除。

### 8.4 添加新风格

点击添加新风格打开 `newStyleModal`。

流程：

1. 用户选择多个参考视频。
2. AutoMedia 分析切点、字幕、音效、背景音、特效、转场、文本和贴纸使用规律。
3. 生成风格规则草稿。
4. 用户勾选、取消或删除规则。
5. 用户保存后写入 `style_profiles` 和 `style_rules`。

## 9. Modal 和确认合同

| Modal | 触发 | 确认动作 | 取消动作 | 外部副作用 |
|---|---|---|---|---|
| `newVideoModal` | 主页点击制作新视频 | 创建 project，进入 Editor | 关闭弹窗 | 无 |
| `styleDetailModal` | 点击风格卡片 | 保存风格名和规则状态 | 关闭弹窗 | 无 |
| `newStyleModal` | 点击添加新风格 | 生成并保存新风格 | 关闭弹窗 | 无 |
| `deleteConfirmModal` | 删除规则或风格 | 删除或软删除对应对象 | 关闭弹窗 | 无 |
| `recutConfirmModal` | 取消任一自动剪辑步骤 | 重新开始自动剪辑 job | 保留当前状态 | 无 |
| `memoryModal` | 点击查看记忆文档 | 无保存动作 | 关闭弹窗 | 无 |

## 10. 数据库设计

MVP 建议使用 SQLite 或 Postgres。字段类型用通用 SQL 表达。

### 10.1 Projects

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `projects` | `id` | text pk | project id |
|  | `title` | text | 可编辑视频名 |
|  | `status` | text | draft、editing、ready_to_publish、archived |
|  | `thumbnail_asset_id` | text fk nullable | 首页缩略图 |
|  | `last_playhead_ms` | integer | 最近编辑位置 |
|  | `duration_ms` | integer nullable | 当前 timeline 时长 |
|  | `created_at` | datetime | 创建时间 |
|  | `updated_at` | datetime | 更新时间 |
|  | `deleted_at` | datetime nullable | 软删除 |

### 10.2 Assets

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `source_assets` | `id` | text pk | 素材 id |
|  | `asset_type` | text | video、audio、image、music、sticker |
|  | `file_path` | text | 本地文件路径 |
|  | `original_name` | text | 原文件名 |
|  | `duration_ms` | integer nullable | 音视频时长 |
|  | `width`、`height` | integer nullable | 尺寸 |
|  | `checksum` | text nullable | 去重 |
|  | `metadata_json` | json | codec、fps、bitrate 等 |
|  | `created_at` | datetime | 导入时间 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `project_assets` | `project_id` | text fk | project |
|  | `asset_id` | text fk | asset |
|  | `role` | text | source、background_music、cover_source、reference |
|  | `sort_order` | integer | 素材顺序 |
|  | `created_at` | datetime | 加入 project 的时间 |

约束和读写归属：

- `primary key (project_id, asset_id, role)`。
- Create new video modal 写入本表。
- Home 最近视频、Editor 添加视频 tab、Auto-edit job 读取本表。

### 10.2.1 Layout Preferences

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `project_layout_preferences` | `project_id` | text pk fk | project |
|  | `video_panel_height` | integer nullable | Editor 视频预览区域高度 |
|  | `timeline_panel_height` | integer nullable | Editor timeline 区域高度 |
|  | `sidebar_collapsed` | boolean | Editor sidebar 是否折叠 |
|  | `updated_at` | datetime | 更新时间 |

读写归属：

- Editor 的视频/timeline 分割线拖动写入 `video_panel_height` 和 `timeline_panel_height`。
- 进入 Editor 时读取本表恢复布局。

### 10.3 Timeline

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `timeline_tracks` | `id` | text pk | track id |
|  | `project_id` | text fk | project |
|  | `track_type` | text | video、audio、subtitles、effects |
|  | `name` | text | 展示名 |
|  | `sort_order` | integer | 排序 |
|  | `is_visible` | boolean | 是否显示 |
|  | `is_locked` | boolean | 是否锁定 |
|  | `created_at`、`updated_at` | datetime | 时间戳 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `timeline_items` | `id` | text pk | item id |
|  | `project_id` | text fk | project |
|  | `track_id` | text fk | track |
|  | `item_type` | text | video、audio、subtitle、effect、music、text、sticker、transition |
|  | `source_asset_id` | text fk nullable | 源素材 |
|  | `start_ms`、`end_ms` | integer | timeline 区间 |
|  | `duration_ms` | integer | 默认等于 `end_ms - start_ms`，用于查询和 UI 性能 |
|  | `source_start_ms`、`source_end_ms` | integer nullable | 源素材区间 |
|  | `properties_json` | json | 文本、字幕、音量、crop、effect params |
|  | `generated_by_job_id` | text fk nullable | 自动生成来源 |
|  | `manual_override` | boolean | 用户是否修改过 |
|  | `is_muted` | boolean | 是否静音 |
|  | `is_locked` | boolean | 是否锁定 |
|  | `created_at`、`updated_at` | datetime | 时间戳 |
|  | `deleted_at` | datetime nullable | 删除 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `edit_history` | `id` | text pk | 操作 id |
|  | `project_id` | text fk | project |
|  | `operation_type` | text | add、update、delete、move、split、auto_generate |
|  | `before_json` | json | 操作前 |
|  | `after_json` | json | 操作后 |
|  | `created_at` | datetime | 操作时间 |

### 10.4 Edit Steps And Jobs

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `edit_steps` | `id` | text pk | step id |
|  | `project_id` | text fk | project |
|  | `step_key` | text | arrange_timeline、clean_speech、subtitles_bilingual、apply_style_profile |
|  | `enabled` | boolean | 是否选中 |
|  | `sort_order` | integer | 顺序 |
|  | `updated_at` | datetime | 更新时间 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `jobs` | `id` | text pk | job id |
|  | `project_id` | text fk nullable | project |
|  | `job_type` | text | auto_edit、transcribe、render、export、style_analysis |
|  | `status` | text | queued、running、succeeded、failed、cancelled |
|  | `input_json` | json | 输入 |
|  | `output_json` | json nullable | 输出 |
|  | `error_json` | json nullable | 错误 |
|  | `created_at`、`updated_at` | datetime | 时间戳 |

### 10.5 Style Memory

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `style_profiles` | `id` | text pk | style id |
|  | `name` | text | 风格名 |
|  | `summary` | text | 摘要 |
|  | `created_at` | datetime | 创建时间 |
|  | `updated_at` | datetime | 更新时间 |
|  | `deleted_at` | datetime nullable | 软删除 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `style_rules` | `id` | text pk | rule id |
|  | `style_profile_id` | text fk | style |
|  | `rule_type` | text | pacing、subtitle、effect、audio、transition、text、sticker |
|  | `rule_text` | text | 人可读规则 |
|  | `rule_json` | json | 机器可执行参数 |
|  | `enabled` | boolean | 是否启用 |
|  | `confidence` | real nullable | 自动总结置信度 |
|  | `source` | text | inferred、manual、performance_feedback |
|  | `created_at`、`updated_at` | datetime | 时间戳 |
|  | `deleted_at` | datetime nullable | 删除 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `style_reference_videos` | `id` | text pk | reference id |
|  | `style_profile_id` | text fk | style |
|  | `asset_id` | text fk | reference video |
|  | `analysis_json` | json | 风格分析结果 |
|  | `created_at` | datetime | 时间戳 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `project_style_profiles` | `project_id` | text fk | project |
|  | `style_profile_id` | text fk | style |
|  | `applied_at` | datetime | 应用时间 |
|  | `created_at` | datetime | 关系创建时间 |

约束和读写归属：

- `primary key (project_id, style_profile_id)`。
- Create new video modal 确认后写入本表。
- Auto-edit job 读取本表决定使用哪些 style rules。

### 10.6 Publishing

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `title_candidates` | `id` | text pk | title id |
|  | `project_id` | text fk | project |
|  | `platform_key` | text nullable | xiaohongshu、bilibili、youtube、douyin |
|  | `title` | text | 标题 |
|  | `rationale` | text nullable | 推荐理由 |
|  | `is_selected` | boolean | 是否选中 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `publish_assets` | `id` | text pk | asset id |
|  | `project_id` | text fk | project |
|  | `asset_type` | text | cover、rendered_video、thumbnail |
|  | `platform_key` | text nullable | 平台 |
|  | `file_path` | text nullable | 文件路径 |
|  | `aspect_ratio` | text | 3:4、16:10、16:9、9:16 |
|  | `crop_json` | json | scale、x、y |
|  | `cover_text_json` | json | 标题字号、位置、颜色 |
|  | `created_at` | datetime | 时间戳 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `platform_accounts` | `id` | text pk | account id |
|  | `platform_key` | text | xiaohongshu、bilibili、youtube、douyin |
|  | `display_name` | text | 账号名 |
|  | `auth_status` | text | disconnected、connected、expired |
|  | `metadata_json` | json | 平台配置 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `platform_posts` | `id` | text pk | post id |
|  | `project_id` | text fk | project |
|  | `platform_key` | text | 平台 |
|  | `account_id` | text fk nullable | 平台账号 |
|  | `title_candidate_id` | text fk nullable | 标题 |
|  | `publish_asset_id` | text fk nullable | 封面或视频 |
|  | `description` | text nullable | 简介 |
|  | `tags_json` | json | tags、hashtags |
|  | `scheduled_at` | datetime nullable | 定时发布时间 |
|  | `status` | text | draft、scheduled、needs_confirmation、published、failed |
|  | `external_post_id` | text nullable | 平台返回 id |
|  | `created_at`、`updated_at` | datetime | 时间戳 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `exports` | `id` | text pk | export id |
|  | `project_id` | text fk | project |
|  | `job_id` | text fk nullable | render/export job |
|  | `file_path` | text nullable | 导出文件路径 |
|  | `format` | text | mp4、mov、webm |
|  | `resolution` | text nullable | 例如 1080x1920 |
|  | `status` | text | queued、rendering、ready、failed |
|  | `created_at`、`updated_at` | datetime | 时间戳 |

读写归属：

- Editor topbar 的导出按钮创建 `exports` 和 `jobs`。
- Publishing 页读取最新 ready export 作为发布视频源。

### 10.6.1 Confirmation Events

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `confirmation_events` | `id` | text pk | confirmation id |
|  | `project_id` | text fk nullable | project |
|  | `target_type` | text | style_rule、style_profile、auto_edit_steps、platform_post、reply_draft |
|  | `target_id` | text | 被确认对象 id |
|  | `action` | text | delete、recut、publish、reply |
|  | `decision` | text | confirmed、cancelled |
|  | `created_at` | datetime | 时间戳 |

读写归属：

- `deleteConfirmModal` 写入 delete confirmation。
- `recutConfirmModal` 写入 recut confirmation。
- 未来真实平台发布和真实评论回复必须写入 confirmation event 后才能执行外部动作。

### 10.7 Analytics And Comments

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `analytics_metrics` | `id` | text pk | metric id |
|  | `platform_post_id` | text fk | post |
|  | `metric_date` | date | 日期 |
|  | `views`、`likes`、`saves`、`shares`、`comments_count` | integer | 指标 |
|  | `completion_rate` | real nullable | 完播率 |
|  | `raw_json` | json | 平台原始数据 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `comments` | `id` | text pk | comment id |
|  | `platform_post_id` | text fk | post |
|  | `external_comment_id` | text | 平台评论 id |
|  | `author_name` | text nullable | 评论者 |
|  | `body` | text | 评论内容 |
|  | `classification` | text | question、praise、criticism、collaboration、spam、sensitive |
|  | `status` | text | new、drafted、approved、replied、ignored |
|  | `created_at` | datetime | 评论时间 |

| 表 | 字段 | 类型 | 说明 |
|---|---|---|---|
| `reply_drafts` | `id` | text pk | reply id |
|  | `comment_id` | text fk | comment |
|  | `body` | text | 回复草稿 |
|  | `status` | text | drafted、approved、rejected、posted |
|  | `approved_at` | datetime nullable | 审批时间 |
|  | `posted_at` | datetime nullable | 发布时间 |

## 11. 数据关系

```text
projects
  -> project_assets -> source_assets
  -> project_layout_preferences
  -> timeline_tracks -> timeline_items
  -> edit_steps
  -> jobs
  -> exports
  -> title_candidates
  -> publish_assets
  -> platform_posts -> analytics_metrics
                    -> comments -> reply_drafts
  -> confirmation_events

style_profiles
  -> style_rules
  -> style_reference_videos -> source_assets
  -> project_style_profiles -> projects
```

## 11.1 Table Ownership Matrix

| 表 | 主要写入者 | 主要读取者 |
|---|---|---|
| `projects` | Home 新建视频、Editor 保存、导出状态更新 | Home 最近项目、Editor、Publishing |
| `source_assets` | Create new video modal、Add Video tab、New Style modal | Home thumbnails、Editor tabs、Auto-edit jobs |
| `project_assets` | Create new video modal、Add Video tab | Editor 添加视频 tab、Auto-edit jobs |
| `project_layout_preferences` | Editor 分割线、sidebar 折叠状态 | Editor 初始化布局 |
| `timeline_tracks` | Project 初始化、Auto-edit job、用户新增轨道 | Editor timeline |
| `timeline_items` | Auto-edit job、Editor 右侧 tabs、用户手动修改 | Editor preview、timeline、export job |
| `edit_history` | Editor timeline 操作 | 撤销、重做 |
| `edit_steps` | Sidebar 自动剪辑步骤 checkbox | Auto-edit job |
| `jobs` | 自动剪辑、转写、导出、风格分析 | Home/Editor job 状态、debug view |
| `style_profiles` | Style Manager、New Style modal | Home style chips、Create new video modal、Auto-edit job |
| `style_rules` | Style Detail modal、Style analysis job | Auto-edit job、Style Manager |
| `style_reference_videos` | New Style modal、Style analysis job | Style Manager、Style analysis rerun |
| `project_style_profiles` | Create new video modal、Style selection | Auto-edit job、Project restore |
| `title_candidates` | Publishing title generation job | Publishing 标题推荐 tab |
| `publish_assets` | Cover design tab、export/render jobs | Publishing preview、platform posts |
| `platform_accounts` | Platform connection settings | Publishing platform selection、future publish jobs |
| `platform_posts` | Publishing platform selection、schedule tab | Publishing summary、future analytics/comment ingestion |
| `exports` | Editor 导出按钮、render job | Publishing video source、Home status |
| `confirmation_events` | Delete/recut/publish/reply confirmation modals | Audit log、future safety checks |
| `analytics_metrics` | Future platform ingestion job | Home analytics summary、future analytics page |
| `comments` | Future comment ingestion job | Home comment summary、future comment page |
| `reply_drafts` | Future reply drafting job、user approval | Future comment reply workflow |

## 12. 旧 PRD 功能的删改和降级

| 旧功能 | 新处理 |
|---|---|
| 编辑器右侧 `发布` tab | 删除。发布内容移到独立 `视频发布` 页面。 |
| 剪辑页 `推荐标题和封面` | 删除。移到 `视频发布` 页。 |
| `Before Editing` 页面整栏 | 删除。步骤移到 sidebar 的 `视频剪辑` 下拉。 |
| 语音控制 | 当前 demo 未表达，移到 future。 |
| 真实平台发布 | 当前 demo 不做，MVP 先生成草稿和排期，真实发布必须最终确认。 |
| 平台数据自动分析完整页 | 当前只在主页 summary 表达，完整模块 future。 |
| 自动回复留言完整页 | 当前只在主页 summary 表达，完整模块 future。 |
| 文件型 memory 作为唯一存储 | 改为数据库为 source of truth，Markdown/JSON 可作为导出或可读镜像。 |

## 13. 权限和安全

| 行为 | 要求 |
|---|---|
| 导入本地视频 | 用户主动选择或拖拽 |
| 删除 style rule | 弹确认框 |
| 删除 style profile | 必须弹确认框，MVP 软删除 |
| 重新自动剪辑 | 取消步骤后弹确认框 |
| 真实平台发布 | 必须用户最终确认 |
| 真实评论回复 | 必须用户审批 |
| 平台账号连接 | 后续实现时必须明确授权 |

## 14. MVP 里程碑

| 里程碑 | 输出 |
|---|---|
| M0 | 当前 PRD、数据模型、UI 状态合同定稿 |
| M1 | 本地 project 数据层：projects、assets、timeline、style tables |
| M2 | Home 读取真实最近项目，新视频创建写 DB |
| M3 | Editor 读取和保存真实 timeline |
| M4 | 自动剪辑步骤写入 DB，并能触发 mock job |
| M5 | Style Manager 读取、修改、删除规则和风格 |
| M6 | Publishing 页生成标题候选和封面资产记录 |
| M7 | 本地导出视频文件 |
| M8 | 平台发布草稿和定时发布数据，不执行真实外部发布 |

## 15. Open Issues

| 问题 | 当前决定 |
|---|---|
| Style 删除按钮 demo 未展示 | PRD 要求保留，demo gap。后续 UI 应补。 |
| 主页 topbar title 是否需要可编辑 | 当前 demo 可编辑。MVP 可保留为 workspace title 或改为不可编辑，待产品决定。 |
| 字幕生成模型 | 未定。MVP 可先用本地 whisper 或外部 ASR。 |
| 剪辑风格分析方式 | 未定。需要先定义参考视频输入格式和分析指标。 |
| 真实平台发布 API | 后续逐平台调研。MVP 不承诺真实发布。 |
