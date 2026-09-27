---
name: automedia-video-style-extraction
description: Extract and calibrate a reusable AutoMedia editing style from raw and creator-edited reference videos without leaking the answer timeline. Use for style learning, comparison matrices, calibration runs, or style-memory updates in AutoMedia.
---

# Skill: Video Style Extraction And Calibration Workflow

## Metadata

- **Type**: Workflow
- **Use when**: An agent needs to extract a reusable video-editing style from one or more creator-edited reference videos, then apply that style to raw videos without copying the reference timeline.
- **Created**: 2026-06-14
- **Declared dependencies**: Context Infrastructure's independent-validation workflow and media transcription workflow; they remain external shared guidance rather than AutoMedia-owned skills.
- **Related axioms**: M01 closed-loop calibration, V06 evaluation granularity, V07 holdout test set, V08 user-perspective eval, T13 observation before interpretation

---

## Core Rule

The style document is the object being learned.

A reference edited video is a standard answer, not an edit script to copy. The agent may inspect the reference to infer style principles, but candidate generation must use only:

1. The raw input video.
2. The current style document.
3. Allowed project tools and asset libraries.

Do not generate a candidate by copying the reference video's exact timestamps, effect placements, subtitles, audio effects, or overlays. That produces timeline reconstruction, not style extraction.

---

## When To Use

Use this workflow when the user asks for any of the following:

- Learn my editing style from videos I already edited.
- Import a CapCut/Jianying style from a finished project.
- Compare an automatically styled video to my edited version.
- Improve the style prompt, style rules, or style memory based on a reference answer.
- Build a reusable video editing style profile.

If the task is only to reproduce one project exactly for archival or interoperability, use an EDL reconstruction workflow instead and label it as reconstruction. Do not call it style learning.

---

## Required Artifacts

Create or update project-local artifacts:

```text
<project>/data/style_calibration/reference_pair/original_a.<ext>
<project>/data/style_calibration/reference_pair/edited_b.<ext>
<project>/data/style_calibration/reports/<run_slug>_performance_matrix.md
<project>/data/style_calibration/reports/<run_slug>_comparison_matrix.md
<project>/data/style_calibration/generated/<style_slug>.md
<project>/data/style_calibration/generated/<candidate_slug>_edit_plan.json
```

If the project has a validation folder, also maintain:

```text
<project>/docs/validation/<run_slug>_validation.md
```

For non-trivial calibration runs, read [`workflow_independent_validation_agent.md`](../../../context-infra/rules/skills/workflow_independent_validation_agent.md). The validator must check that the reference answer did not leak into candidate generation.

---

## Phase 0: Define The Experiment

Before inspecting the reference deeply, write the experiment contract:

| Field | Required Decision |
|---|---|
| Raw video A | Source path, copy path, hash, duration |
| Edited answer B | Source path, copy path, hash, duration |
| Candidate C | How it will be generated |
| Allowed inputs for C | Usually A + current style document + assets |
| Forbidden inputs for C | B's exact timestamps, B's EDL, copied placements |
| Success threshold | Usually 95% for comparison score, unless user sets another threshold |
| Human review status | `needs_review` until the user accepts the learned style |

If multiple reference videos exist, split them before tuning:

| Split | Purpose |
|---|---|
| Train | Infer initial style text |
| Validation | Tune style wording and scoring weights |
| Test | Final one-time check after style is selected |

With only one reference video, label the result as a first-version single-example style. It can be useful, but it is high risk for overfitting.

---

## Phase 1: Build B Performance Matrix

The performance matrix describes what the human-edited answer did. It is evidence, not a script for candidate generation.

Capture all observable edits:

| Category | Examples |
|---|---|
| Structural edits | cuts, removed pauses, merged clips, reordered segments |
| Subtitles | language, density, sentence-level vs phrase-level, placement, style |
| Visual effects | effect name, semantic trigger, approximate time, duration |
| Audio effects | effect name, semantic trigger, approximate time, duration |
| Background music | mood, volume pattern, fade behavior |
| Overlays | stickers, frames, labels, emphasis graphics |
| Transitions | type, timing, purpose |
| Pacing | edit density, average event spacing, quiet vs intense zones |

Required table format:

| # | Category | B Time Range | Observed Edit | Semantic Trigger | Duration | Confidence | Source Evidence |
|---:|---|---|---|---|---:|---|---|

The `Semantic Trigger` column is mandatory. Without it, the matrix is only a timeline inventory and cannot support style learning.

For screenshot-derived first passes, also record expected row counts before candidate generation. Example from the AutoMedia 3月6日 run:

| Category | Expected Rows |
|---|---:|
| Video segments | 10 |
| Visual effects | 12 |
| Overlays / stickers | 5 |
| Audio effects | 15 |
| Subtitle observation | 1 |
| Total | 43 |

If later evidence changes these counts, write the reason before candidate generation. Do not adjust row counts after seeing candidate C just to improve a score.

Confidence must distinguish exact data from inferred data:

| Confidence | Meaning |
|---|---|
| `high` | Native project data, exact transcript timestamp, or directly measurable media event |
| `medium` | Clear screenshot/video observation with small timing tolerance |
| `low` | Partially visible, cropped, or inferred event |

---

## Phase 2: Write Style Document V1

Convert the performance matrix into reusable editing judgment. The style document should answer why an edit happens, not only what edit happened.

Recommended sections:

```markdown
# Style: <name>

## Scope
What content types this style applies to.

## Overall Feel
One or two paragraphs describing pacing, energy, humor, seriousness, and viewer experience.

## Editing Rules
Rules that map content signals to editing decisions.

## Effect Vocabulary
Allowed effect families and when to use them.

## Audio Vocabulary
Allowed sound-effect families and when to use them.

## Subtitle Rules
Language, density, granularity, emphasis, and manual-review points.

## Pacing Rules
Expected density and spacing of cuts/effects/audio.

## Anti-Rules
What this style should avoid.

## Calibration Notes
What is uncertain, overfit, or needs user review.
```

Good rule:

```text
When the speaker makes a rhetorical question or shows confusion, add a short疑问/啊-style audio cue within 0.5-1.5 seconds of the semantic moment. Keep it brief and do not repeat it if another strong cue happened in the previous 4 seconds.
```

Bad rule:

```text
At 5.2 seconds add 疑问-啊.
```

---

## Phase 3: Understand Raw Video A

Analyze A without using B's exact edit placements.

At minimum, produce:

| # | A Time Range | Transcript / Visual Moment | Content Function | Emotion | Candidate Trigger |
|---:|---|---|---|---|---|

Typical content functions:

| Function | Meaning |
|---|---|
| setup | Introduces the topic or situation |
| claim | Makes a point |
| contrast | Says something surprising or opposing |
| example | Gives evidence or story |
| tension | Raises emotional or narrative stakes |
| punchline | Gives a funny, sharp, or memorable moment |
| conclusion | Resolves the idea or tells viewer what to take away |

This phase may use speech recognition, visual inspection, scene analysis, and silence/pause detection. Record which tools were used and where manual review is still needed.

If A-derived ASR is unavailable and B-visible subtitle text must be used as a fallback, strip it down to de-timed text only:

| Allowed | Forbidden |
|---|---|
| De-timed transcript/text content | B subtitle block boundaries |
| Topic and semantic content | B screenshot timing |
| A media metadata such as duration/aspect ratio | B effect/audio placement |
| A visual/audio observations | B visual emphasis context |

Label the source as `fallback_from_B_subtitle_text_only` or equivalent. Candidate timing must still come from A semantic zones, not B subtitle or effect timing.

---

## Phase 4: Generate Candidate C From A + Style Only

Generate an edit plan for C using the style document and A analysis. The candidate edit plan must include enough detail to render or simulate the edited video.

Required format:

| # | A Time Range | Candidate Action | Style Rule Used | Reason | Expected Viewer Effect |
|---:|---|---|---|---|---|

The candidate plan may include approximate timing derived from A's transcript and visual events. It must not use B's exact timeline as the timing source.

If a tool cannot render the candidate video yet, produce a candidate EDL and mark the run as `plan_level_only`. Do not claim rendered-video equivalence.

Create a candidate-generation manifest for every round:

| Field | Required Content |
|---|---|
| Round | Candidate round number |
| Candidate artifact | Path to C edit plan/video |
| Frozen style doc | Path and SHA-256 |
| Allowed inputs | Style doc, A analysis, asset vocabulary, A-derived metadata |
| Forbidden inputs | B performance matrix, screenshot EDL/reconstruction artifacts, B row IDs, B exact timestamp tables |
| Isolation statement | Plain-language statement that B is used only after C generation for scoring |

The manifest is not a perfect runtime file-access trace, but it makes the intended boundary auditable. For higher-stakes runs, supplement it with actual file-access logging.

---

## Phase 5: Compare C Against B

Compare at the same layer as the claim:

| Claim | Valid Comparison Layer |
|---|---|
| Style prompt improved | semantic/action comparison matrix |
| Candidate EDL improved | EDL event comparison |
| Rendered video improved | rendered video/audio comparison plus human-visible review |
| User-facing editor improved | UI path validation in the app |

Recommended comparison matrix:

| Dimension | Weight | Expected From B | Actual In C | Score | Gap |
|---|---:|---|---|---:|---|
| Semantic trigger match | 35% | Edits happen at comparable content moments | pending | pending | pending |
| Effect/audio family match | 25% | Similar families, not exact asset names only | pending | pending | pending |
| Pacing density | 15% | Comparable event frequency and quiet zones | pending | pending | pending |
| Timing tolerance | 15% | Within agreed semantic/timing tolerance | pending | pending | pending |
| Subtitle/overlay style | 10% | Comparable density and visual language | pending | pending | pending |

Do not over-weight exact timestamps when the goal is style learning. Exact timing matters after semantic trigger and edit intent are correct.

### Recomputable Scoring Requirement

Any score that gates pass/fail must be independently recomputable from the published report. Do not publish a dimension score that relies on hidden judgment.

Use numeric row points:

| Row Verdict | Points |
|---|---:|
| full | 1.0 |
| partial | 0.5 |
| zero | 0.0 |
| missing expected row | 0.0 |
| unexpected extra row | 0.0 and increases the relevant denominator |

For each dimension:

```text
dimension_score = row_points / compared_rows * 100
```

Final score:

```text
final_score =
  semantic_trigger_score * 0.35 +
  effect_audio_family_score * 0.25 +
  pacing_density_score * 0.15 +
  timing_tolerance_score * 0.15 +
  subtitle_overlay_score * 0.10
```

Pass requires the exact threshold declared in the plan. If the user says "higher than 95%", use `>95.00%`; exactly `95.00%` is not a pass.

Expose row-level evidence:

| Required Column | Purpose |
|---|---|
| B row ID | Expected answer row |
| Candidate row ID | Candidate row being compared |
| Semantic points | Contribution to semantic trigger score |
| Family points | Contribution to effect/audio/overlay family score |
| Timing points | Contribution to timing score |
| Subtitle/overlay points | Contribution to subtitle/overlay score |
| Notes | Why full/partial/zero was assigned |

Pacing density should use explicit aggregate rows, not hidden math:

| Category | Expected Count | Candidate Count | Points | Verdict |
|---|---:|---:|---:|---|

The validation agent must be able to recalculate the final score with only the published comparison matrix.

### Timestamp Leakage Audit

A candidate can leak B even when it contains no B row IDs. Exact timestamp reuse is a common hidden leak.

After candidate generation and before claiming pass:

1. Extract every non-zero start/end value from B performance rows.
2. Extract every non-zero start/end value from C candidate rows.
3. Compute exact intersections after a declared rounding precision.
4. List all matches.
5. Treat unexplained non-zero exact matches as leakage failures.

Required audit table:

| Audit Item | Value |
|---|---:|
| B time values checked | count |
| C time values checked | count |
| Exact non-zero matches | count |
| Allowed exact zero boundary | usually `0.0` only |
| Verdict | PASS/FAIL |

If a non-zero exact match is truly A-derived, write the A-derived source and reason. Otherwise revise C timing from A semantic zones and rescore.

---

## Phase 6: Improve The Style Document

If the score is below threshold, update the style document, not merely the candidate output.

Every iteration must record:

| Round | Style Version | Candidate Version | Score | Main Gaps | Style Doc Changes | Verdict |
|---:|---|---|---:|---|---|---|

Common repair types:

| Gap | Style Document Repair |
|---|---|
| Too few effects | Add density rule and required trigger categories |
| Effects on wrong moments | Clarify semantic triggers and anti-triggers |
| Too serious | Add humor/light-variety vocabulary and examples |
| Too noisy | Add spacing limits and quiet-zone rules |
| Wrong subtitle granularity | Define sentence-level vs phrase-level conditions |
| Good on one video, bad elsewhere | Mark rule as single-video-specific until validated on more examples |

Stop conditions:

| Condition | Action |
|---|---|
| Score reaches threshold | Mark style as candidate for user review |
| Score plateaus | Write gaps and ask for human examples or preference clarification |
| Missing data blocks comparison | Mark blocked and specify exact missing artifact |
| Candidate generated by leaking B | Invalidate run and restart with isolation |
| Score cannot be recomputed by validator | Expose per-dimension row points and rerun scoring |
| Exact non-zero B timestamp appears in C | Add anti-leak timing rule and regenerate C from A semantic zones |

### Example Iteration Pattern From AutoMedia 3月6日

| Round | What Happened | Score | Verdict | Repair |
|---:|---|---:|---|---|
| 1 | Style v1 captured the broad emotional arc but produced only 11 candidate actions against 43 observed B rows | 28.69 | FAIL | Add density, segmentation, repeated example-mode, overlay, and ending-sequence rules |
| 2 | Style v2 appeared to score 98.19, but validator recomputed 93.67 from exposed rows and found exact B timestamp matches | 93.67 recomputed | FAIL | Expose per-dimension points and add timestamp leakage audit |
| 3 | Style v3 added a general anti-leak timing rule; candidate C3 had 43 actions, no exact non-zero B timestamp matches, and a recomputable score | 99.07 | PASS_PLAN_LEVEL | Keep `needs_review`; no rendered-video claim |

The Round 2 failure is important: a report can look high quality while still failing if the score is not reproducible or if B timing leaks into C.

---

## Phase 7: Persist Style Memory

Persist only reviewed or clearly labeled style knowledge.

| State | Meaning |
|---|---|
| `draft` | Extracted from evidence, not calibrated |
| `calibrating` | Being iterated through this workflow |
| `needs_review` | Candidate reached technical threshold but needs user judgment |
| `approved` | User accepted it as part of their style library |
| `deprecated` | Replaced or rejected |

Database rows or project memory should store:

| Field | Description |
|---|---|
| style_id | Stable identifier |
| source_refs | Reference videos and hashes |
| style_doc_path | Markdown style document |
| evidence_paths | Performance and comparison matrices |
| status | Review state |
| confidence | Numeric or labeled confidence |
| scope | Content types where this style is valid |
| exclusions | What it should not be used for |

Never silently enable a style extracted from a single reference video. Store it disabled or `needs_review` until the user accepts it.

---

## Validation Checklist

Before claiming completion, verify:

| Check | Required Evidence |
|---|---|
| A and B copied | Paths, hashes, durations |
| Performance matrix exists | Row-level B observations with semantic triggers |
| Style document exists | Rules are semantic, not timestamp copies |
| A analysis exists | Transcript/visual moments independent of B timing |
| Candidate C generated | C plan/video derived from A + style only |
| Comparison matrix exists | Weighted C vs B gaps |
| Score is recomputable | Per-dimension row points and aggregate rows reproduce the final score |
| Timestamp leakage audit exists | All B/C start/end exact matches checked; unexplained non-zero matches are zero |
| Iteration log exists | Style document changes per round |
| Leakage check passed | Validator confirms B exact EDL was not used to generate C |
| Claim matches layer | Plan-level, EDL-level, rendered-video-level, or UI-level clearly stated |

If validation uses screenshots or partial project data, state the precision limits in the report.

---

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|---|---|
| Copying B timestamps into C | Measures reconstruction, not style learning |
| Reporting 100% because C matches a copied EDL | Inflates success by leaking the answer |
| Reporting a score that validator cannot recompute | Hides subjective judgment behind a numeric result |
| Checking leakage only by B row IDs or file names | Misses timestamp leakage and answer-derived timing |
| Omitting semantic triggers | Prevents generalization to new videos |
| Treating one video as a stable creator style | Overfits single-video choices |
| Letting the same agent both tune and final-judge without written validation | Encourages self-confirming reports |
| Comparing at a lower layer than the claim | Example: EDL match does not prove rendered video quality |
