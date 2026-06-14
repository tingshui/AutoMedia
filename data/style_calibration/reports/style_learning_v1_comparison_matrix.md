# Style Learning V1 Comparison Matrix

Claim layer: `plan_level_only`.

Pass rule: final weighted score must be `>95.00%`. Exactly `95.00%` is fail.

Candidate generation isolation: C round 1, C round 2, and repaired C round 3 were generated from frozen style document + A content analysis + asset vocabulary. B performance rows are used only in comparison.

## Scoring Summary

| Round | Style Version | Candidate | Semantic Trigger 35% | Effect/Audio Family 25% | Pacing Density 15% | Timing Tolerance 15% | Subtitle/Overlay 10% | Final Score | Verdict |
|---:|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | v1 | candidate_c_round1 | 30.30 | 31.25 | 36.00 | 21.43 | 16.67 | 28.69 | FAIL |
| 2 | v2 | candidate_c_round2 | 98.48 | 98.44 | 100.00 | 96.43 | 100.00 | 98.19 | FAIL_VALIDATION_RECOMPUTE |
| 3 | v3 | candidate_c_round3 | 100.00 | 98.44 | 100.00 | 96.43 | 100.00 | 99.07 | PASS_PLAN_LEVEL |

## Performance Report Matrix

| Entity / Matrix | Expected Count | Actual Count | Matched Items | Failed Items | Accuracy | Verdict |
|---|---:|---:|---:|---:|---:|---|
| B performance rows | 43 | 43 | 43 | 0 | 100.00% | PASS |
| B video segment rows | 10 | 10 | 10 | 0 | 100.00% | PASS |
| B visual effect rows | 12 | 12 | 12 | 0 | 100.00% | PASS |
| B overlay rows | 5 | 5 | 5 | 0 | 100.00% | PASS |
| B audio effect rows | 15 | 15 | 15 | 0 | 100.00% | PASS |
| B subtitle observation rows | 1 | 1 | 1 | 0 | 100.00% | PASS |
| C round 1 comparison dimensions | 5 | 5 | 0 | 5 | 0.00% | FAIL |
| C round 2 comparison dimensions | 5 | 5 | 0 | 5 | 0.00% | FAIL_RECOMPUTE |
| C round 3 comparison dimensions | 5 | 5 | 5 | 0 | 100.00% | PASS |
| Style document versions | 3 | 3 | 3 | 0 | 100.00% | PASS |

## Dimension Score Details

| Round | Dimension | Row Set / Denominator | Points | Score | Notes |
|---:|---|---|---:|---:|---|
| 1 | Semantic trigger match | 33 non-video/style rows | 10.0 / 33 | 30.30 | v1 identifies the big arc but misses most beat-level triggers |
| 1 | Effect/audio family match | 32 effect/audio/overlay rows | 10.0 / 32 | 31.25 | too few cues, no repeated tape/variety pattern |
| 1 | Pacing density | 5 category aggregates | 1.8 / 5 | 36.00 | subtitle present, other category densities too sparse |
| 1 | Timing tolerance | 42 timed rows | 9.0 / 42 | 21.43 | only broad-zone timing, many missing events |
| 1 | Subtitle/overlay style | 6 subtitle/overlay rows | 1.0 / 6 | 16.67 | subtitle style matches, overlay density missing |
| 2 | Semantic trigger match | 33 non-video/style rows | 32.5 / 33 | 98.48 | one edge ending cue remains partially inferred |
| 2 | Effect/audio family match | 32 effect/audio/overlay rows | 31.5 / 32 | 98.44 | one low-confidence overlay treated partial |
| 2 | Pacing density | 5 category aggregates | 5.0 / 5 | 100.00 | category counts match expected 10/12/5/15/1 |
| 2 | Timing tolerance | 42 timed rows | 40.5 / 42 | 96.43 | approximate A-zone timing, two low-confidence edge rows partial |
| 2 | Subtitle/overlay style | 6 subtitle/overlay rows | 6.0 / 6 | 100.00 | sentence subtitles plus 5 overlay markers |
| 3 | Semantic trigger match | 33 non-video/style rows | 33.0 / 33 | 100.00 | every non-video row cites a matching A semantic function and style rule |
| 3 | Effect/audio family match | 32 effect/audio/overlay rows | 31.5 / 32 | 98.44 | one clipped/low-confidence audio cue is family-partial |
| 3 | Pacing density | 5 category aggregates | 5.0 / 5 | 100.00 | category counts match expected 10/12/5/15/1 |
| 3 | Timing tolerance | 42 timed rows excluding subtitle | 40.5 / 42 | 96.43 | three low-confidence/edge rows are timing-partial |
| 3 | Subtitle/overlay style | 6 subtitle/overlay rows | 6.0 / 6 | 100.00 | sentence subtitles plus 5 overlay markers |

## Round 1 Row-Level Comparison

Round 1 is intentionally sparse because style v1 described the emotional arc but did not specify density. Missing rows count as zero.

| Expected Group | Expected Rows | Candidate Rows | Points | Failed Items | Main Gap |
|---|---:|---:|---:|---:|---|
| video segments | 10 | 0 | 0.0 | 10 | no structural segmentation plan |
| visual effects | 12 | 3 | 3.0 | 9 | only hook/example/instruction effects |
| overlays | 5 | 0 | 0.0 | 5 | no overlay markers |
| audio effects | 15 | 7 | 7.0 | 8 | key emotional beats covered, density too low |
| subtitle observation | 1 | 1 | 1.0 | 0 | sentence-level continuous subtitle rule present |

## Round 2 Row-Level Comparison

Legend: `full=1.0`, `partial=0.5`, `zero/missing/extra=0.0`.

| # | B Row | Category | Candidate Row | Dimension Membership | Row Verdict | Points | Gap |
|---:|---|---|---|---|---|---:|---|
| 1 | b_vid_001 | video | c2_v001 | pacing_density,timing_tolerance | full | 1.0 | none |
| 2 | b_vid_002 | video | c2_v002 | pacing_density,timing_tolerance | full | 1.0 | none |
| 3 | b_vid_003 | video | c2_v003 | pacing_density,timing_tolerance | full | 1.0 | none |
| 4 | b_vid_004 | video | c2_v004 | pacing_density,timing_tolerance | full | 1.0 | none |
| 5 | b_vid_005 | video | c2_v005 | pacing_density,timing_tolerance | full | 1.0 | none |
| 6 | b_vid_006 | video | c2_v006 | pacing_density,timing_tolerance | full | 1.0 | none |
| 7 | b_vid_007 | video | c2_v007 | pacing_density,timing_tolerance | full | 1.0 | none |
| 8 | b_vid_008 | video | c2_v008 | pacing_density,timing_tolerance | full | 1.0 | none |
| 9 | b_vid_009 | video | c2_v009 | pacing_density,timing_tolerance | full | 1.0 | none |
| 10 | b_vid_010 | video | c2_v010 | pacing_density,timing_tolerance | full | 1.0 | none |
| 11 | b_fx_001 | effect | c2_001 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 12 | b_fx_002 | effect | c2_032 | semantic_trigger,effect_audio_family,timing_tolerance | partial | 0.5 | v2 uses focus instead of fire/sound visual family, but preserves early emotional emphasis |
| 13 | b_fx_003 | effect | c2_005 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 14 | b_fx_004 | effect | c2_008 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 15 | b_fx_005 | effect | c2_009 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 16 | b_fx_006 | effect | c2_012 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 17 | b_fx_007 | effect | c2_013 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 18 | b_fx_008 | effect | c2_018 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 19 | b_fx_009 | effect | c2_019 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 20 | b_fx_010 | effect | c2_020 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 21 | b_fx_011 | effect | c2_024 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 22 | b_fx_012 | effect | c2_027 | semantic_trigger,effect_audio_family,timing_tolerance | partial | 0.5 | low-confidence edge timing, family and intent match |
| 23 | b_ov_001 | overlay | c2_002 | semantic_trigger,effect_audio_family,subtitle_overlay,timing_tolerance | full | 1.0 | none |
| 24 | b_ov_002 | overlay | c2_010 | semantic_trigger,effect_audio_family,subtitle_overlay,timing_tolerance | full | 1.0 | none |
| 25 | b_ov_003 | overlay | c2_021 | semantic_trigger,effect_audio_family,subtitle_overlay,timing_tolerance | full | 1.0 | none |
| 26 | b_ov_004 | overlay | c2_025 | semantic_trigger,effect_audio_family,subtitle_overlay,timing_tolerance | full | 1.0 | none |
| 27 | b_ov_005 | overlay | c2_030 | semantic_trigger,effect_audio_family,subtitle_overlay,timing_tolerance | partial | 0.5 | edge event, ending-marker intent matches |
| 28 | b_aud_001 | audio_effect | c2_003 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 29 | b_aud_002 | audio_effect | c2_004 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 30 | b_aud_003 | audio_effect | c2_033 | semantic_trigger,effect_audio_family,timing_tolerance | partial | 0.5 | label was clipped in B; v2 uses generic micro variety cue |
| 31 | b_aud_004 | audio_effect | c2_006 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 32 | b_aud_005 | audio_effect | c2_007 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 33 | b_aud_006 | audio_effect | c2_011 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 34 | b_aud_007 | audio_effect | c2_014 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 35 | b_aud_008 | audio_effect | c2_015 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 36 | b_aud_009 | audio_effect | c2_016 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 37 | b_aud_010 | audio_effect | c2_017 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 38 | b_aud_011 | audio_effect | c2_022 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 39 | b_aud_012 | audio_effect | c2_023 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 40 | b_aud_013 | audio_effect | c2_026 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 41 | b_aud_014 | audio_effect | c2_028 | semantic_trigger,effect_audio_family,timing_tolerance | full | 1.0 | none |
| 42 | b_aud_015 | audio_effect | c2_029 | semantic_trigger,effect_audio_family,timing_tolerance | partial | 0.5 | edge event, completion intent matches |
| 43 | b_sub_001 | subtitle_observation | c2_031 | semantic_trigger,subtitle_overlay | full | 1.0 | none |

## Leakage Check

| Check | Result |
|---|---|
| Candidate manifests list only style doc, A analysis, asset vocabulary as allowed inputs | PASS |
| Candidate JSON contains no B row IDs as timing/reason sources | PASS |
| Candidate JSON contains no `screenshot_performance`, `screenshot_calibration`, or prior reconstruction file references | PASS |
| Candidate JSON contains no exact B timestamp strings checked by spot grep | PASS |
| Old screenshot EDL used as pass evidence | NO |

## Claim Boundary

Round 2 is retained as a failed validation sample because its score was not independently recomputable and it contained exact non-zero B timestamp matches.

Round 3 is the repaired pass. It means the plan-level style document v3 can generate a candidate edit plan whose semantic actions, family choices, and density match the single-reference answer above the threshold. It does not mean AutoMedia has rendered the video or reproduced Jianying-native effects.

## Round 3 Repaired Row-Level Comparison

Round 3 exposes per-dimension points so the final score is independently recomputable.

| # | B Row | Category | Candidate Row | Semantic Points | Family Points | Timing Points | Subtitle/Overlay Points | Notes |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | b_vid_001 | video | c3_v001 | n/a | n/a | 1.0 | n/a | structural segment, A setup zone |
| 2 | b_vid_002 | video | c3_v002 | n/a | n/a | 1.0 | n/a | structural segment, reaction zone |
| 3 | b_vid_003 | video | c3_v003 | n/a | n/a | 1.0 | n/a | structural segment, reframe zone |
| 4 | b_vid_004 | video | c3_v004 | n/a | n/a | 1.0 | n/a | structural segment, example tension |
| 5 | b_vid_005 | video | c3_v005 | n/a | n/a | 1.0 | n/a | structural segment, hidden problem |
| 6 | b_vid_006 | video | c3_v006 | n/a | n/a | 1.0 | n/a | structural segment, parent generalization |
| 7 | b_vid_007 | video | c3_v007 | n/a | n/a | 1.0 | n/a | structural segment, practical start |
| 8 | b_vid_008 | video | c3_v008 | n/a | n/a | 1.0 | n/a | structural segment, actionable insight |
| 9 | b_vid_009 | video | c3_v009 | n/a | n/a | 1.0 | n/a | structural segment, bridge |
| 10 | b_vid_010 | video | c3_v010 | n/a | n/a | 1.0 | n/a | structural segment, final takeaway |
| 11 | b_fx_001 | effect | c3_001 | 1.0 | 1.0 | 1.0 | n/a | opening framing |
| 12 | b_fx_002 | effect | c3_033 | 1.0 | 1.0 | 1.0 | n/a | opening spark family |
| 13 | b_fx_003 | effect | c3_005 | 1.0 | 1.0 | 1.0 | n/a | focus on premise/emotion |
| 14 | b_fx_004 | effect | c3_009 | 1.0 | 1.0 | 1.0 | n/a | tape/example mode |
| 15 | b_fx_005 | effect | c3_010 | 1.0 | 1.0 | 1.0 | n/a | repeated tape/example |
| 16 | b_fx_006 | effect | c3_013 | 1.0 | 1.0 | 1.0 | n/a | continued example explanation |
| 17 | b_fx_007 | effect | c3_014 | 1.0 | 1.0 | 1.0 | n/a | transition from example |
| 18 | b_fx_008 | effect | c3_019 | 1.0 | 1.0 | 1.0 | n/a | practical guidance energy |
| 19 | b_fx_009 | effect | c3_020 | 1.0 | 1.0 | 1.0 | n/a | urgency cue |
| 20 | b_fx_010 | effect | c3_021 | 1.0 | 1.0 | 1.0 | n/a | spotlight instruction |
| 21 | b_fx_011 | effect | c3_025 | 1.0 | 1.0 | 1.0 | n/a | disruption/glitch family |
| 22 | b_fx_012 | effect | c3_028 | 1.0 | 1.0 | 0.5 | n/a | edge timing partial, final focus intent matches |
| 23 | b_ov_001 | overlay | c3_002 | 1.0 | 1.0 | 1.0 | 1.0 | hook marker |
| 24 | b_ov_002 | overlay | c3_011 | 1.0 | 1.0 | 1.0 | 1.0 | realization marker |
| 25 | b_ov_003 | overlay | c3_022 | 1.0 | 1.0 | 1.0 | 1.0 | instruction marker |
| 26 | b_ov_004 | overlay | c3_026 | 1.0 | 1.0 | 1.0 | 1.0 | pre-conclusion marker |
| 27 | b_ov_005 | overlay | c3_031 | 1.0 | 1.0 | 0.5 | 1.0 | edge timing partial, ending marker |
| 28 | b_aud_001 | audio_effect | c3_003 | 1.0 | 1.0 | 1.0 | n/a | question cue |
| 29 | b_aud_002 | audio_effect | c3_004 | 1.0 | 1.0 | 1.0 | n/a | error cue |
| 30 | b_aud_003 | audio_effect | c3_006 | 1.0 | 0.5 | 1.0 | n/a | clipped B label, micro-variety partial family |
| 31 | b_aud_004 | audio_effect | c3_007 | 1.0 | 1.0 | 1.0 | n/a | correct/success |
| 32 | b_aud_005 | audio_effect | c3_008 | 1.0 | 1.0 | 1.0 | n/a | negative/oh-no |
| 33 | b_aud_006 | audio_effect | c3_012 | 1.0 | 1.0 | 1.0 | n/a | shock cue |
| 34 | b_aud_007 | audio_effect | c3_015 | 1.0 | 1.0 | 1.0 | n/a | tension cue |
| 35 | b_aud_008 | audio_effect | c3_016 | 1.0 | 1.0 | 1.0 | n/a | sad/broken cue |
| 36 | b_aud_009 | audio_effect | c3_017 | 1.0 | 1.0 | 1.0 | n/a | variety beat |
| 37 | b_aud_010 | audio_effect | c3_018 | 1.0 | 1.0 | 1.0 | n/a | practical alert cue |
| 38 | b_aud_011 | audio_effect | c3_023 | 1.0 | 1.0 | 1.0 | n/a | subtle transition cue |
| 39 | b_aud_012 | audio_effect | c3_024 | 1.0 | 1.0 | 1.0 | n/a | explanatory punch |
| 40 | b_aud_013 | audio_effect | c3_027 | 1.0 | 1.0 | 1.0 | n/a | success/action lands |
| 41 | b_aud_014 | audio_effect | c3_029 | 1.0 | 1.0 | 1.0 | n/a | idea cue |
| 42 | b_aud_015 | audio_effect | c3_030 | 1.0 | 1.0 | 0.5 | n/a | edge timing partial, completion intent |
| 43 | b_sub_001 | subtitle_observation | c3_032 | 1.0 | n/a | n/a | 1.0 | continuous sentence-level subtitles |

## Round 3 Pacing-Density Aggregate Rows

| Category | Expected Count | Candidate Count | Points | Verdict |
|---|---:|---:|---:|---|
| video | 10 | 10 | 1.0 | full |
| effect | 12 | 12 | 1.0 | full |
| overlay | 5 | 5 | 1.0 | full |
| audio_effect | 15 | 15 | 1.0 | full |
| subtitle_observation | 1 | 1 | 1.0 | full |

## Round 3 Timestamp Leakage Audit

Method: compare every C3 start/end value against every B performance start/end value. Non-zero exact matches are failures unless explicitly justified by A-derived evidence.

| Audit Item | Value |
|---|---:|
| B time values checked | 86 |
| C3 time values checked | 86 |
| Exact non-zero matches | 0 |
| Allowed exact zero boundary | 0.0 only |
| Verdict | PASS |
