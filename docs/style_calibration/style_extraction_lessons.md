# AutoMedia Style Extraction Lessons

## Purpose

This file records project-specific lessons from AutoMedia style calibration experiments. The reusable workflow lives in:

`/Users/qianying/Documents/AI_Workspace/context-infra/rules/skills/workflow_video_style_extraction.md`

This document is narrower: what we learned while trying to extract Angel's editing style from the 3月6日 Jianying reference.

---

## 2026-06-14: EDL Reconstruction Is Not Style Learning

### What Happened

The first calibration attempt copied observable events from the edited reference B into a screenshot-derived EDL. Round 2 reached 100% because the generated EDL matched the extracted screenshot performance matrix.

### Why That Was Insufficient

That run proved that AutoMedia could store a reference timeline and compare event rows. It did not prove that AutoMedia understood the editing style.

The missing skill was judgment:

| Wrong Target | Correct Target |
|---|---|
| Reproduce B's event timestamps | Learn why the editor added those events |
| Match effect rows exactly | Trigger comparable effects at comparable semantic moments |
| Treat 100% EDL match as success | Treat it as reconstruction success only |
| Use B as an edit script | Use B as the standard answer for evaluating C |

### New Rule

When extracting style, B is the answer key. Candidate C must be generated from A plus the current style document. B's exact timeline may be used only after C is generated, during comparison.

---

## 2026-06-14: The Style Document Must Encode Judgment

### Useful Style Rule Shape

A useful rule maps content signals to edit choices:

| Content Signal | Style Response |
|---|---|
| Rhetorical question, confusion, or "why" moment | Add short疑问/啊-style audio cue near the semantic moment |
| Emotional tension or social conflict | Add light-variety emphasis effect, such as focus, glitch, tape, or punchy cue |
| Clear conclusion or task completion | Add completion/success audio cue, but avoid repeating it too often |
| Explanation segment | Keep sentence-level subtitles continuous and readable |
| High-density emotional passage | Use effects sparingly enough that speech remains primary |

### Weak Style Rule Shape

Rules like `at 5.2s add 疑问音效` are not reusable. They should stay in a reconstruction EDL, not in the creator style memory.

---

## 2026-06-14: Single-Video Style Must Stay `needs_review`

The 3月6日 video can seed a first style, but it is not enough to define Angel's long-term style.

Current best label:

| Field | Value |
|---|---|
| style name | 剪映导入-3月6日 v1 |
| evidence | one edited reference video plus screenshots |
| status | `needs_review` |
| confidence | medium for this video, low for general creator style |
| safe use | generate candidate edit plans for similar口播/育儿观点 videos |
| unsafe use | silently apply as Angel's universal style |

---

## 2026-06-14: Comparison Needs Semantic Scoring

Exact timestamp matching is too brittle and too easy to game. The comparison should prioritize whether C edits the same kinds of moments for the same reasons.

Recommended weights for the next AutoMedia run:

| Dimension | Weight |
|---|---:|
| Semantic trigger match | 35% |
| Effect/audio family match | 25% |
| Pacing density | 15% |
| Timing tolerance | 15% |
| Subtitle/overlay style | 10% |

This gives timing real weight, but prevents the system from winning by copying the answer.

---

## Next Experiment Design

For the next run:

1. Keep the existing B performance matrix as the answer key.
2. Write `style_jianying_3yue6_v1.md` as semantic editing rules.
3. Analyze original video A independently: transcript, content function, emotion, candidate triggers.
4. Generate candidate C edit plan from A plus the style document only.
5. Compare C against B with a weighted comparison matrix.
6. Revise the style document, not just the candidate plan.
7. Repeat until the score reaches the threshold or the remaining gaps require human preference input.

Important isolation rule: the candidate generator cannot read the screenshot EDL or B timestamp table. The validator should explicitly check this.

---

## 2026-06-14: Style Learning V1 Run Results

### What Ran

We reran the 3月6日 style extraction as a real style-learning experiment:

`B answer -> semantic style text -> A content analysis -> candidate C -> C vs B comparison -> style text repair`

This replaced the earlier EDL reconstruction approach.

### Performance Matrix Summary

The B answer-key performance matrix had 43 observed rows:

| Category | Rows |
|---|---:|
| Video segments | 10 |
| Visual effects | 12 |
| Overlays / stickers | 5 |
| Audio effects | 15 |
| Subtitle observation | 1 |
| Total | 43 |

Files:

| Artifact | Path |
|---|---|
| B performance matrix | `data/style_calibration/reports/style_learning_v1_performance_matrix.md` |
| Comparison matrix | `data/style_calibration/reports/style_learning_v1_comparison_matrix.md` |
| Iteration report | `data/style_calibration/reports/style_learning_v1_iteration_report.md` |
| Final style | `data/style_calibration/generated/style_jianying_3yue6_v3.md` |

### Iteration Results

| Round | Style | Candidate | Score | Verdict | Lesson |
|---:|---|---|---:|---|---|
| 1 | v1 | round1 | 28.69 | FAIL | Broad style language is not enough. It missed cue density, segmentation, overlays, repeated example-mode effects, and ending sequence. |
| 2 | v2 | round2 | 98.19 reported, 93.67 validator-recomputed | FAIL | Numeric scores must be recomputable from exposed row-level points. Exact B timestamp reuse is leakage even if no B row IDs appear. |
| 3 | v3 | round3 | 99.07 | PASS_PLAN_LEVEL | Per-dimension points plus timestamp audit made the score auditable; v3 added an anti-leak timing rule. |

### New Project Rules

| Rule | Reason |
|---|---|
| Every comparison report must expose per-dimension row points. | A single aggregate row verdict can make the final score impossible to recompute. |
| Pacing density needs aggregate rows by category. | Counting row-level events alone does not match the declared pacing denominator. |
| Timestamp leakage audit must compare every B start/end against every C start/end. | Spot grep for B IDs or forbidden filenames misses answer-derived timing. |
| Candidate timing should be A semantic-zone-derived and avoid exact non-zero B timestamps. | Exact timestamp reuse turns style learning back into answer copying. |
| Round failures should remain in the report. | They document how the style text improved and prevent inflated success narratives. |

### Current Boundary

The accepted result is `PASS_PLAN_LEVEL`, not rendered-video success. AutoMedia still needs A-derived ASR, a render pipeline, and user review before this style becomes an approved reusable editing style.
