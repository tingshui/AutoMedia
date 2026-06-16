# AutoMedia TDD Validation Test List

## 1. 目的

这份文档把 refined PRD 转成 behavior-first validation list。它按 Matt Pocock TDD skill 的原则组织：通过 public interface 验证行为，用 vertical slices 推进，测试描述系统做什么，而不是绑定内部实现细节。

这不是一次性写完所有测试的清单。每个 milestone 先选一个 tracer bullet test，写到 red，做最小实现到 green，再根据刚学到的系统形状增加下一个行为测试。

## 2. 测试入口

| Interface | 用途 |
|---|---|
| Browser UI | 主验证入口：routes、modals、tabs、timeline、review、publish prep。 |
| HTTP API | 公开 app boundary：setup、negative cases、exact response contracts。 |
| SQLite DB | public behavior 之后的 persistence audit。DB 不能作为唯一 feature trigger。 |
| CLI verifier scripts | deterministic reset、fixture setup、milestone reports。 |
| Filesystem | export/output file 和 fixture import 检查。 |

## 3. 全局测试规则

| Rule | Requirement |
|---|---|
| Reset | 每个 verifier 从 deterministic DB reset 开始，或声明自己需要的 state。 |
| User path | 每个 feature test 至少包含一个 browser 或 public API trigger。 |
| Persistence | Write-path tests 包含 reload 或 route re-entry。 |
| Negative path | 每个 milestone 包含 cancel、invalid input 或 missing input。 |
| JSON/FK audit | 写 DB JSON 或 FK rows 的 milestone 运行 JSON parse checks 和 `PRAGMA foreign_key_check`。 |
| Claim layer | fixture、plan-level、mock、real output 必须被区分测试。 |
| Cross-project isolation | job/regeneration test 必须证明其他 project 没被改。 |

## 4. TDD Sequencing

| Slice | First tracer bullet | Then add |
|---|---|---|
| Home/project creation | 通过 New Video modal 创建 project，并按 id reload Editor。 | Cancel、missing filename、unavailable style、DB row completeness。 |
| Style manager | 通过 modal rename style，并在 Home 看到更新。 | Rule toggle、delete cancel、delete confirm、style delete。 |
| Timeline manual editing | 添加 text item，并 reload 后仍可见。 | Video、subtitle、catalogs、delete、invalid time/source。 |
| Auto-edit dry run | 运行 auto-edit，看到 generated timeline items 和 job row。 | Disabled steps、style rule provenance、regeneration replacement、manual override preservation。 |
| Auto Edit Review | 把一个 generated item 标记 accepted，并 reload review panel。 | Reject、needs_change、invalid transitions、stale job、manual item rejection。 |
| Fixture subtitle/audio | 运行 fixture pipeline，看到三条字幕和两个 pause markers。 | Edit text、delete item、replacement policy、disabled steps、orphan audit。 |
| Export | Export fixture timeline，并验证 ready file exists。 | Failure、mock label、stale timeline protection。 |
| Publishing | Select title candidate，并 reload 后保持选择。 | Cover crop、platform drafts、schedule、external publish block。 |

## 5. Validation Matrix

### M0 App Shell And Routing

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M0-01 | Home route 干净启动 | 打开 `#/home` | Home 可见，sidebar absent，editor-only actions absent。 |
| M0-02 | Recent project 进入 Editor | 点击 recent card | Editor 可见，sidebar present，route 包含 project id。 |
| M0-03 | Home 退出 editor context | 点击 sidebar Home | Home 可见，sidebar absent，route 为 `#/home`。 |
| M0-04 | Publishing route 可达 | 点击 Publishing | Publishing page 可见，sidebar present。 |
| M0-05 | Unknown route 可恢复 | 导航到 bad hash | App 回到 Home 或 documented fallback。 |

### M1 Schema, Seed, Reset

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M1-01 | Reset deterministic | 连续运行 reset 两次 | table counts、seed ids、JSON validity、FK check 一致。 |
| M1-02 | MVP tables 存在 | 运行 DB verifier | PRD MVP tables、primary keys、FKs 符合合同。 |
| M1-03 | Seed projects 支持 Home | 调 `/api/bootstrap` | 返回 expected recent projects 和 active styles。 |
| M1-04 | Catalogs 支持 tool tabs | 查询 catalog tables | effect/audio/music/text/sticker/transition seeds 存在。 |
| M1-05 | Future boundary 明确 | 运行 verifier | Future tables absent 或按 future-only policy 标注，不被 MVP UI gate 要求。 |

### M2 Home Project Workflow

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M2-01 | Home 反映 DB project title | DB rename seed project 后 reload Home | Recent card 显示新 title。 |
| M2-02 | New Video confirm 创建 workspace | 填 filename/style，点击 confirm | Project count +1；source asset、project asset、layout、tracks、edit steps、style link 创建；Editor 打开新 id。 |
| M2-03 | New Video cancel 无副作用 | 打开 modal 后 cancel | project/source/project asset counts 不变。 |
| M2-04 | Missing filename 阻断 create | 空 filename 点击 confirm | visible error；无新 rows。 |
| M2-05 | Deleted/unavailable style 阻断 create | API create with deleted style id | HTTP 400；无 project rows。 |
| M2-06 | Resume 使用同一 project id | reload 后点击 created card | Editor 加载同一 project id 和 title。 |

### M3 Style Memory

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M3-01 | Active styles 驱动 Home 和 modal | UI/API rename style | Home chip 和 New Video option 更新。 |
| M3-02 | Soft-deleted style 被隐藏 | Confirm delete style | Home、modal、Style Manager 不显示；`confirmation_events` 有 confirmed row。 |
| M3-03 | Cancel style delete 保留状态 | Delete style 后 cancel | Style 仍 active；destructive state 不变。 |
| M3-04 | Rename style 持久化 | Style Manager rename | `style_profiles.name` 更新并 reload 后保留。 |
| M3-05 | Rule enablement 持久化 | Toggle rule checkbox | `style_rules.enabled` 改变，reopen detail 后一致。 |
| M3-06 | Rule delete confirm soft-deletes | Click rule delete and confirm | Rule 从 detail 隐藏；`deleted_at` set；confirmation event exists。 |
| M3-07 | Rule delete cancel 保留 rule | Click rule delete and cancel | Rule 仍 active；无 confirmed delete state。 |
| M3-08 | Jianying import 是 reviewable | Trigger v3 import | Style/rules 存在，rule JSON 标记 needs_review，import idempotent。 |

### M4 Editor Persistence

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M4-01 | Title save 持久化 | Edit title，click Save，reload route | Topbar 和 Home card 显示同一 title。 |
| M4-02 | Layout save 持久化 | Drag divider，click Save，reload route | Preview/timeline heights 从 DB 恢复。 |
| M4-03 | Edit steps save 持久化 | Toggle step，click Save，reload route | Checkbox state 从 `edit_steps` 恢复。 |
| M4-04 | Invalid layout 被拒绝 | API save too-small heights | HTTP 400；previous layout 保留。 |
| M4-05 | Invalid step key 被拒绝 | API save unknown step | HTTP 400；existing step rows unchanged。 |

### M5 Media Import

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M5-01 | Fixture import copies and attaches | 点击 import fixture | `source_assets` row exists，file copied to library，`project_assets` row created，asset appears in Add Video。 |
| M5-02 | Duplicate import 遵守 policy | 同一文件 import 两次 | 无 duplicate checksum row，或 documented duplicate relationship policy 成立。 |
| M5-03 | Unsupported import 被拒绝 | API import unsupported extension | HTTP 400；无 source/project asset row。 |
| M5-04 | Path escape 被阻断 | API import outside allowed boundary | HTTP 400；no file copy。 |

### M6 Manual Timeline Items

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M6-01 | Video item 可添加 | Add Video tab 点击 source asset | Active video item 出现在 Video track，reload 后保留。 |
| M6-02 | Text item 可添加 | 点击 text tool | Active text item 出现在 Effects track，reload 后保留。 |
| M6-03 | Manual subtitle 创建 segments | 点击 Add Subtitle | Subtitle item 出现；linked `subtitle_segments` rows 存在；reload 保留 item 和 textareas。 |
| M6-04 | Catalog items 可添加 | 点击 effect/audio/music/sticker/transition controls | Correct item type、track、catalog metadata 持久化。 |
| M6-05 | Timeline item edit 设置 manual override | Edit subtitle textarea 或 item property | `manual_override=1`；updated properties persist。 |
| M6-06 | Timeline item delete 隐藏 item | 点击 clip | `deleted_at` set；reload 后 clip absent。 |
| M6-07 | Invalid time range 被拒绝 | API create negative/reversed range | HTTP 400；无 item row。 |
| M6-08 | Video item 需要 source asset | API create video without source | HTTP 400；无 item row。 |

### M7 Auto-Edit Dry Run

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M7-01 | Auto-edit 创建 generated preview items | 点击 Start Auto Edit | HTTP 201；`auto_edit` job succeeded；generated items visible；job output lists actions。 |
| M7-02 | Generated items 带 provenance | Dry-run 后查 DB | 每个 generated item 有 label/text/action kind/reason/claim layer 和 `generated_by_job_id`。 |
| M7-03 | Disabled subtitle step 抑制字幕 output | Disable `subtitles_bilingual`，save，run dry-run | 无 subtitle action/item from that step。 |
| M7-04 | Disabled style step 抑制 style outputs | Disable `apply_style_profile`，save，run dry-run | 无 rule-generated effect/text/sticker items。 |
| M7-05 | No enabled style rules 阻断 run | 关闭 selected style 的所有 rules，run dry-run | HTTP 409；visible message；无 new job。 |
| M7-06 | Regeneration 替换 non-overridden generated items | 连续 run dry-run 两次 | Old generated non-overridden items soft-deleted；latest items active。 |
| M7-07 | Manual override survives regeneration | Edit generated item 后 rerun | Edited generated item 仍 active，`manual_override=1`。 |
| M7-08 | Cross-project isolation holds | 在一个 project run dry-run | 其他 project jobs/items unchanged。 |

### M7b Auto Edit Review

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M7R-01 | Empty review state 清晰 | Auto-edit 前打开 Review | Empty text visible；无 review buttons。 |
| M7R-02 | Latest actions 渲染为 cards | Run deterministic auto-edit，open Review | Card count、labels、reasons、status `pending`、style rule ids 符合合同。 |
| M7R-03 | Accept 保持 item active | 点击 `接受` | Review status `accepted`；timeline item active；provenance metadata preserved。 |
| M7R-04 | Reject 隐藏 timeline item 但保留 card | 点击 `删除` | Card status `rejected`；active state deleted；timeline clip absent；reload 后 card 仍可检查。 |
| M7R-05 | Needs-change 标记 manual override | 点击 `需修改` | Status `needs_change`；item active；`manual_override=1`；metadata preserved。 |
| M7R-06 | Rejected item terminal | API attempts rejected to accepted | HTTP 409；DB unchanged。 |
| M7R-07 | Manual item cannot be reviewed | API review manual timeline item | HTTP 400；item unchanged。 |
| M7R-08 | Superseded generated item cannot be reviewed | 新 dry-run 后 review old job item | HTTP 400；old item unchanged。 |
| M7R-09 | Missing/invalid status rejected | API body `{}` or invalid value | HTTP 400；DB unchanged。 |
| M7R-10 | Review route 不与 generic update 冲突 | PATCH `/api/timeline-items/:id/review` | 命中 review behavior，而不是 generic update。 |

### M8 Fixture Subtitle And Audio Pipeline

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M8-01 | Fixture pipeline 创建 expected outputs | 点击 `生成字幕和停顿标记` | One `transcribe` job；3 subtitle items/segments；2 pause markers；UI toast 和 timeline match fixture contract。 |
| M8-02 | Generated subtitles reload | M8 run 后 route re-entry | Generated subtitle textareas 和 timeline clips 仍可见。 |
| M8-03 | Subtitle edit syncs segment | Edit generated subtitle textarea | Timeline item text 和 linked segment text 更新；timing/provenance preserved；`manual_override=1`。 |
| M8-04 | Subtitle delete soft-deletes linked segment | Delete generated subtitle clip | Item absent；linked segment soft-deleted；active orphan segment count zero。 |
| M8-05 | Rerun preserves manual override | Edit generated subtitle 后 rerun pipeline | Edited overridden subtitle remains；non-overridden prior outputs replaced by latest job。 |
| M8-06 | Disabled subtitle step blocks run | Disable `subtitles_bilingual`，call endpoint | HTTP 409；无 new transcribe job 或 generated rows。 |
| M8-07 | Disabled clean speech omits markers | Disable `clean_speech`，run endpoint | Subtitles generated；latest marker count zero；output JSON 记录 skipped reason。 |
| M8-08 | Missing source asset blocks run | Run on project with no source asset | HTTP 409；无 job 或 generated rows。 |
| M8-09 | Fixture claim boundary holds | Inspect job and item JSON | 不包含 real_transcription、Whisper、rendered、exported、published claims。 |

### M9 Export

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M9-01 | Real export creates file | Fixture timeline 点击 Export | `exports` 和 job rows exist；status `ready`；output file exists and nonzero。 |
| M9-02 | Export failure visible | Force invalid export condition | Status `failed`；visible error；无 ready claim。 |
| M9-03 | Export reads latest timeline | 改 timeline 后 export | Output job input 引用 latest active timeline state/version。 |
| M9-04 | Mock export labeled | No-FFmpeg dev mode 如允许 | Status `mock_rendered`；UI says mock export；never says ready。 |

### M10 Publishing Preparation

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M10-01 | Title candidates persist | Generate/select title | Multiple rows exist；selected policy holds；reload preserves selection。 |
| M10-02 | Cover crops persist | Adjust platform crop controls | `publish_assets.crop_json` 和 `cover_text_json` 持久化。 |
| M10-03 | Platform selection creates drafts | Select Xiaohongshu and Bilibili | Exactly two active `platform_posts` under defined policy。 |
| M10-04 | Unselect platform follows policy | Unselect platform | Draft removed 或 marked inactive；reload matches UI。 |
| M10-05 | Schedule persists | Set scheduled time | `scheduled_at` 和 status reload 后保留。 |
| M10-06 | External publish blocked | Attempt publish without future integration | Visible blocked state；no external API call；confirmation policy preserved。 |

### M11 Safety Audit

| ID | Behavior | Trigger | Expected result |
|---|---|---|---|
| M11-01 | Confirmation audit covers deletes | Delete style/rule confirm and cancel | `confirmation_events` 准确记录 decisions；canceled action 无 destructive state。 |
| M11-02 | Recut confirmation cannot be bypassed | Disable edit step and recut | 破坏性 regeneration policy 修改 persisted output 前必须 confirmation。 |
| M11-03 | External side effects remain gated | Attempt future publish/reply endpoint if present | 需要 confirmation；否则 blocked 且无 external side effect。 |
| M11-04 | Audit view/CLI reports policy | Run audit verifier | Required action types 以 pass/fail 展示。 |

## 6. Regression Suite Recommendations

| Command | Purpose |
|---|---|
| `npm run verify:m0` | App shell route/state regression。 |
| `npm run verify:m1` | Schema、seed、reset regression。 |
| `npm run verify:m2` | Home project workflow regression。 |
| `npm run verify:m3m6` | Style manager 和 manual timeline regression。 |
| `npm run verify:m7-style` | Style-driven auto-edit dry-run regression。 |
| `npm run verify:m7-review` | Auto Edit Review regression。 |
| `npm run verify:m8` | M8 implementation landing 后的 fixture subtitle/audio regression。 |

Future milestone 完成前，把新的 verifier command 补到这里，并在 milestone-specific validation doc 中记录最终证据。

## 7. Open Validation Decisions

| Decision | Recommended answer |
|---|---|
| DB-only checks 能否算 feature validation | 不能。DB checks 是 public UI/API trigger 之后的 audit evidence。 |
| 是否一次性写完所有测试 | 不。按 vertical tracer bullet 一条条推进。 |
| Verifiers 是否可以改变 shared demo DB | 只有 validation doc 明确声明 final canonical verifier state 时可以。 |
| LLM/style/title tests 能否用 final examples 调 prompt | 不能。Tuning 前先切 train/validation/test；deterministic fixture-only 标记 N/A。 |
