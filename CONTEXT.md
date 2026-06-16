# AutoMedia Context

AutoMedia 把源素材和用户的剪辑偏好转成可检查、可修改、可追踪的视频项目。本术语表固定 PRD、实现计划、UI、API 和 validation 文档里的产品语言。

## Language

**Project**:
一个面向单个目标视频输出的持久编辑工作区。Project 拥有 source assets、timeline tracks、timeline items、edit steps、style profiles、publishing drafts 和 exports。
_Avoid_: video, draft, document

**Source Asset**:
导入到系统里的原始媒体或参考文件。Source Asset 是输入材料，不是 timeline 上的编辑结果。
_Avoid_: upload, file, media item

**Project Asset**:
Project 与 Source Asset 的关系，包含素材角色和排序。
_Avoid_: asset copy, attached file

**Timeline**:
Project 当前视频的可编辑时间线。AutoMedia 中，Timeline 是编辑器、预览、review 和 export 的主要 source of truth。
_Avoid_: canvas state, preview state

**Track**:
Timeline 里的类型化轨道。MVP 轨道为 Video、Audio、Subtitles、Effects。
_Avoid_: layer, row

**Timeline Item**:
Track 上带时间范围和属性的可编辑对象。它可以表示 video、audio、subtitle、effect、music、text、sticker 或 transition。
_Avoid_: clip when referring to every item type

**Manual Override**:
用户对 generated timeline item 做出的人工修改。Regeneration 必须保留 manual override，除非后续有显式替换策略。
_Avoid_: user change, lock

**Edit Step**:
用户可选择的自动剪辑能力，例如按素材顺序铺入 timeline、清理口播、生成双语字幕、套用 style profile。
_Avoid_: task, checkbox, pipeline stage

**Job**:
一次持久化的自动处理尝试，例如 auto-edit、transcribe、render、export 或 style analysis。
_Avoid_: run, task

**Auto-Edit Dry Run**:
plan-level 的自动剪辑 job。它生成可见 timeline 预览项和 review cards，但不声称已经产出 rendered video。
_Avoid_: auto edit, rendered edit, final cut

**Auto Edit Review**:
用于检查 latest auto-edit dry run 的用户界面。它展示每个 generated item 为什么被生成，并允许用户 accept、reject 或标记 needs_change。
_Avoid_: approval screen, job log

**Subtitle Segment**:
字幕文本、语言和时间范围的 source-of-truth row。Subtitle timeline item 指向一个或多个 subtitle segments。
_Avoid_: caption item, subtitle clip

**Style Profile**:
一个命名的剪辑风格，由 human-readable 和 machine-readable rules 组成。Project 在自动剪辑前选择 style profile。
_Avoid_: template, preset, theme

**Style Rule**:
Style profile 内的一条可执行或可审核剪辑偏好，例如 pacing、subtitle、effect、audio、transition、text、sticker。
_Avoid_: prompt, guideline

**Reference Video**:
用于推断或校准 style profile 的 source asset。它是 style learning 的证据，不是 project output。
_Avoid_: sample, training video

**Publishing Draft**:
平台维度的发布准备记录，包含 title、cover 或 rendered asset、description、tags、schedule 和 status。MVP 的 publishing draft 不执行外部发布。
_Avoid_: published post, upload

**Confirmation Event**:
记录用户对破坏性或外部可见动作的决策，例如删除 style/rule、recut、publish 或 reply。
_Avoid_: modal result, audit log entry

**Export**:
从 latest project timeline 生成的本地渲染输出。Export 与 platform publishing 是不同概念。
_Avoid_: publish, upload
