# Style Learning V1 Iteration Report

## Round Summary

| Round | Style Version | Candidate Version | Score | Threshold | Verdict |
|---:|---|---|---:|---:|---|
| 1 | `style_jianying_3yue6_v1.md` | `candidate_c_round1_edit_plan.json` | 28.69 | >95.00 | FAIL |
| 2 | `style_jianying_3yue6_v2.md` | `candidate_c_round2_edit_plan.json` | 98.19 reported, 93.67 recomputed | >95.00 | FAIL_VALIDATION_RECOMPUTE |
| 3 | `style_jianying_3yue6_v3.md` | `candidate_c_round3_edit_plan.json` | 99.07 | >95.00 | PASS_PLAN_LEVEL |

## Why Round 1 Failed

| Gap | Evidence | Repair Direction |
|---|---|---|
| Too few cues | Round 1 had 11 actions vs B's 43 observed rows | Add density targets by category |
| No structural segmentation | Round 1 had no video segment plan | Add retained segment planning after cleanup |
| Weak repeated example-mode pattern | B used repeated tape/retro effects in example zones | Add repeated tape/retro rule every 8-12s during example mode |
| Missing overlays | B used 5 overlay/sticker markers | Add overlay rules for hook, realization, instruction, ending |
| Ending sequence under-specified | B used idea and completion cues near the end | Add final 15% cue sequence |

## Style Doc Diff

| Change | Gap Addressed | Generalizable? | Included In v2 |
|---|---|---|---|
| Add target category density: visual effects 10-14, audio effects 13-17, overlays 4-6, retained segments 8-12 | Too few cues | yes | yes |
| Add first 10% hook rule using both visual frame and question cue when conflict/uncertainty appears | Weak hook emphasis | yes | yes |
| Add repeated tape/retro or focus effects every 8-12s while example mode remains active | Missing repeated example pattern | yes | yes |
| Add hidden-problem rule: tension/shock plus glitch if the point lasts longer than one sentence | Serious conflict under-specified | yes | yes |
| Add final 15% sequence: useful idea, action achieved, completion | Ending under-specified | yes | yes |
| Add overlay duration rule: 1-4 seconds on hook, realization, instruction, ending | Missing overlays | yes | yes |
| Add anti-rule forbidding cue without content function citation | Prevents noisy overfit | yes | yes |
| Add exact timestamp instructions from B | Would overfit to answer | no | no |
| Add R13 anti-leak timing rule: candidate timing must come from A semantic zones and avoid exact non-zero reference-answer timestamps | Fixes Round 2 timestamp leakage | yes | yes |

## Frozen Style Hashes

| Style | SHA-256 |
|---|---|
| `style_jianying_3yue6_v1.md` | `5b5e959ca0cd108f3b77eb47667df9410f5ee51b9ec14e76c006bd7215a4683a` |
| `style_jianying_3yue6_v2.md` | `a9f5360d10daa91998347e504cab435e8032158a2bd142706817c0122bb49c48` |
| `style_jianying_3yue6_v3.md` | `8db3776e324c989af117ac6d87655944428ec99b1fc2c9f55fbbbdc4119eac64` |

## Persistence Policy

No enabled DB style rule was changed in this run. The learned style remains a draft/`needs_review` artifact until Angel reviews it.

Recommended persisted state if imported later:

| Field | Value |
|---|---|
| style_id | `jianying_3yue6_style_learning_v2` |
| status | `needs_review` |
| confidence | medium for similar口播 parenting videos, low for general creator style |
| scope | vertical talking-head parenting/education opinion videos |
| exclusion | do not use as universal creator style without more references |

## Remaining Limits

| Limit | Impact |
|---|---|
| No A-derived ASR | A content analysis remains approximate |
| No rendered C video | Pass is plan-level only |
| B evidence is screenshot-derived | Some edge rows are low-confidence |
| Single reference video | Style may overfit this topic/video |
