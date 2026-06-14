# AutoMedia Style Calibration Report

Generated: 2026-06-14T04:17:10.631Z

## Source Pair

- A: original_a.mp4, 178.400s, 1080x1920, sha256 daab260b041a7c0cbf3a9326ce11aaf4281667531ef134fe761b4e8a3646f82d
- B: edited_b.mov, 165.767s, 1080x1920, sha256 1c8621d10a06b6d6331dbaf8b5e46bc3f1fa0fa16d850fb1fbfec61011021e9b
- A source copy match: yes
- B source copy match: yes

## Important Boundary

Alignment policy: Exported B is the scoring timeline. A->B edit comparison uses absolute seconds on B where timing is available and marks encoded-draft material rows as timing failures until decoded.
Current Jianying draft_info/template files are encoded; exact editor timeline timings are unavailable from parseable JSON. Matrix uses key_value material inventory plus ffmpeg detections from edited_b.
AutoMedia does not yet render a final video in this script; each round produces an edit decision list and matrix.

### B Performance Matrix

| # | Category | Label | Start | End | Duration | Evidence |
|---:|---|---|---:|---:|---:|---|
| 1 | visual_cut | detected scene/cut/change | 2.566667 | 2.566667 | 0 | ffmpeg scene select gt(scene,0.35) |
| 2 | audio_silence | detected silence / likely pause cleanup target | 2.660907 | 3.092585 | 0.431678 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 3 | visual_cut | detected scene/cut/change | 6.233333 | 6.233333 | 0 | ffmpeg scene select gt(scene,0.35) |
| 4 | audio_silence | detected silence / likely pause cleanup target | 10.492812 | 10.949229 | 0.456417 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 5 | audio_silence | detected silence / likely pause cleanup target | 13.311565 | 14.014671 | 0.703107 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 6 | audio_silence | detected silence / likely pause cleanup target | 14.886916 | 15.242154 | 0.355238 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 7 | audio_silence | detected silence / likely pause cleanup target | 16.988367 | 17.366054 | 0.377687 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 8 | audio_silence | detected silence / likely pause cleanup target | 19.422086 | 20.113719 | 0.691633 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 9 | audio_silence | detected silence / likely pause cleanup target | 21.83356 | 22.263243 | 0.429683 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 10 | audio_silence | detected silence / likely pause cleanup target | 25.837007 | 26.195556 | 0.358549 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 11 | audio_silence | detected silence / likely pause cleanup target | 29.119274 | 29.834104 | 0.71483 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 12 | visual_cut | detected scene/cut/change | 29.6 | 29.6 | 0 | ffmpeg scene select gt(scene,0.35) |
| 13 | audio_silence | detected silence / likely pause cleanup target | 37.085556 | 37.567891 | 0.482336 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 14 | audio_silence | detected silence / likely pause cleanup target | 38.469955 | 39.206054 | 0.7361 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 15 | audio_silence | detected silence / likely pause cleanup target | 40.431587 | 40.909637 | 0.47805 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 16 | audio_silence | detected silence / likely pause cleanup target | 43.400658 | 44.373583 | 0.972925 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 17 | audio_silence | detected silence / likely pause cleanup target | 45.099297 | 45.794762 | 0.695465 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 18 | audio_silence | detected silence / likely pause cleanup target | 47.111905 | 47.671837 | 0.559932 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 19 | audio_silence | detected silence / likely pause cleanup target | 50.200385 | 51.122698 | 0.922313 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 20 | audio_silence | detected silence / likely pause cleanup target | 52.813107 | 53.255669 | 0.442562 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 21 | audio_silence | detected silence / likely pause cleanup target | 54.203243 | 55.313447 | 1.110204 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 22 | audio_silence | detected silence / likely pause cleanup target | 56.725828 | 57.852449 | 1.126621 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 23 | audio_silence | detected silence / likely pause cleanup target | 58.919456 | 59.481701 | 0.562245 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 24 | audio_silence | detected silence / likely pause cleanup target | 60.089773 | 60.713968 | 0.624195 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 25 | audio_silence | detected silence / likely pause cleanup target | 61.203787 | 61.90102 | 0.697234 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 26 | audio_silence | detected silence / likely pause cleanup target | 62.359932 | 64.06619 | 1.706259 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 27 | audio_silence | detected silence / likely pause cleanup target | 64.889524 | 65.485125 | 0.595601 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 28 | audio_silence | detected silence / likely pause cleanup target | 67.21068 | 67.57576 | 0.365079 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 29 | audio_silence | detected silence / likely pause cleanup target | 68.697732 | 69.820113 | 1.122381 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 30 | audio_silence | detected silence / likely pause cleanup target | 71.350975 | 72.060703 | 0.709728 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 31 | audio_silence | detected silence / likely pause cleanup target | 74.886871 | 75.355669 | 0.468798 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 32 | audio_silence | detected silence / likely pause cleanup target | 77.071542 | 77.666122 | 0.59458 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 33 | audio_silence | detected silence / likely pause cleanup target | 81.400295 | 81.762789 | 0.362494 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 34 | audio_silence | detected silence / likely pause cleanup target | 82.349546 | 82.926916 | 0.57737 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 35 | audio_silence | detected silence / likely pause cleanup target | 84.158277 | 85.361451 | 1.203175 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 36 | audio_silence | detected silence / likely pause cleanup target | 86.461156 | 87.583787 | 1.12263 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 37 | audio_silence | detected silence / likely pause cleanup target | 89.353855 | 89.918073 | 0.564218 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 38 | audio_silence | detected silence / likely pause cleanup target | 90.415011 | 90.852676 | 0.437664 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 39 | audio_silence | detected silence / likely pause cleanup target | 97.293061 | 98.427166 | 1.134104 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 40 | audio_silence | detected silence / likely pause cleanup target | 102.404626 | 103.277098 | 0.872472 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 41 | audio_silence | detected silence / likely pause cleanup target | 103.632336 | 104.273878 | 0.641542 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 42 | audio_silence | detected silence / likely pause cleanup target | 105.789773 | 106.937052 | 1.147279 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 43 | audio_silence | detected silence / likely pause cleanup target | 108.074694 | 109.229887 | 1.155193 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 44 | visual_cut | detected scene/cut/change | 109.133333 | 109.133333 | 0 | ffmpeg scene select gt(scene,0.35) |
| 45 | audio_silence | detected silence / likely pause cleanup target | 110.987075 | 111.456417 | 0.469342 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 46 | audio_silence | detected silence / likely pause cleanup target | 113.056304 | 113.412336 | 0.356032 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 47 | audio_silence | detected silence / likely pause cleanup target | 113.454626 | 114.210748 | 0.756122 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 48 | audio_silence | detected silence / likely pause cleanup target | 115.182812 | 115.884127 | 0.701315 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 49 | visual_cut | detected scene/cut/change | 118.366667 | 118.366667 | 0 | ffmpeg scene select gt(scene,0.35) |
| 50 | audio_silence | detected silence / likely pause cleanup target | 121.120385 | 121.540612 | 0.420227 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 51 | audio_silence | detected silence / likely pause cleanup target | 121.783787 | 122.609637 | 0.82585 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 52 | audio_silence | detected silence / likely pause cleanup target | 124.98161 | 125.464898 | 0.483288 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 53 | audio_silence | detected silence / likely pause cleanup target | 125.639161 | 126.58381 | 0.944649 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 54 | audio_silence | detected silence / likely pause cleanup target | 127.181202 | 127.951406 | 0.770204 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 55 | audio_silence | detected silence / likely pause cleanup target | 129.920204 | 131.082086 | 1.161882 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 56 | visual_cut | detected scene/cut/change | 130.933333 | 130.933333 | 0 | ffmpeg scene select gt(scene,0.35) |
| 57 | audio_silence | detected silence / likely pause cleanup target | 132.38966 | 132.845601 | 0.455941 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 58 | audio_silence | detected silence / likely pause cleanup target | 135.291633 | 136.112063 | 0.820431 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 59 | audio_silence | detected silence / likely pause cleanup target | 138.482789 | 139.08932 | 0.606531 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 60 | audio_silence | detected silence / likely pause cleanup target | 140.564512 | 141.47195 | 0.907438 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 61 | audio_silence | detected silence / likely pause cleanup target | 143.956395 | 144.40483 | 0.448435 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 62 | audio_silence | detected silence / likely pause cleanup target | 147.338322 | 147.858594 | 0.520272 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 63 | audio_silence | detected silence / likely pause cleanup target | 148.315306 | 148.815533 | 0.500227 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 64 | audio_silence | detected silence / likely pause cleanup target | 150.355805 | 151.141905 | 0.7861 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 65 | audio_silence | detected silence / likely pause cleanup target | 151.938118 | 152.505714 | 0.567596 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 66 | audio_silence | detected silence / likely pause cleanup target | 155.031791 | 155.697891 | 0.6661 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 67 | audio_silence | detected silence / likely pause cleanup target | 157.237982 | 157.752585 | 0.514603 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 68 | audio_silence | detected silence / likely pause cleanup target | 158.635578 | 159.284014 | 0.648435 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 69 | audio_silence | detected silence / likely pause cleanup target | 161.135488 | 161.544399 | 0.408912 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 70 | audio_silence | detected silence / likely pause cleanup target | 162.920884 | 163.291837 | 0.370952 | ffmpeg silencedetect noise=-35dB d=0.35 |
| 71 | jianying_sticker | 综艺字-扎心了红色 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 72 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 73 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 74 | jianying_audio | 砰，拳击声 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 75 | jianying_effect | 故障 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 76 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 77 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 78 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 79 | jianying_audio | 震惊傻眼 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 80 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 81 | jianying_effect | 人物聚焦 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 82 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 83 | jianying_audio | 一滴水滴声 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 84 | jianying_trans | 左移 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 85 | jianying_sticker | 综艺贴纸-惊讶感叹号 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 86 | jianying_audio | 疑问-啊？ |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 87 | jianying_audio | 啵2 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 88 | jianying_audio | 任务完成 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 89 | jianying_audio | 打卡成功 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 90 | jianying_audio | 砰，拳击声 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 91 | jianying_media | 涂鸦风 背景 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 92 | jianying_audio | 哦不(OH_NO) |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 93 | jianying_audio | 正确 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 94 | jianying_media | 动态条纹层次渐变背景特效高级商业商务必备震撼开场背景视频 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 95 | jianying_audio | 一滴水滴声 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 96 | jianying_audio | 紧张（马上有大事要发生了） |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 97 | jianying_audio | 心碎声 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 98 | jianying_media | 白色简约素雅唯美 背景 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 99 | jianying_audio | 叮咚（紧张） |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 100 | jianying_effect | 火光蔓延 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 101 | jianying_audio | 综艺-咚咚 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 102 | jianying_cover_text | 综艺黑边黄色花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 103 | jianying_audio | 震惊傻眼 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 104 | jianying_audio | 叮咚（紧张） |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 105 | jianying_media | 时钟紫色背景文艺 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 106 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 107 | jianying_audio | 综艺咚 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 108 | jianying_sticker | 综艺字-扎心了红色 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 109 | jianying_cover_text | 综艺裂开负向情绪 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 110 | jianying_cover_text | 复古橙色渐变立体花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 111 | jianying_audio | 想到好点子 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 112 | jianying_sticker | 震惊疑惑 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 113 | jianying_sticker | 感叹号，惊讶，震惊，红色，立体，线条，综艺 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 114 | jianying_media | 黑幕竖屏唯美玫瑰花渐变背景素材 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 115 | jianying_audio | 综艺-咚咚 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 116 | jianying_audio | 错误音效 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 117 | jianying_audio | 轻音乐（释怀） |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 118 | jianying_sticker | 膨胀风互动引导橙色关注我 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 119 | jianying_cover_text | 震惊！ 蓝色 综艺风 情绪表达 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 120 | jianying_media | 1分钟粉色动态泡泡背景渐变4K竖屏 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 121 | jianying_effect | 故障 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 122 | jianying_effect | 火光包围 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 123 | jianying_effect | 水波纹 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 124 | jianying_effect | 聚光灯 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 125 | jianying_effect | 录制边框 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 126 | jianying_effect | 黑色噪点 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 127 | jianying_effect | 冲刺 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 128 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 129 | jianying_effect | 色差放大 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 130 | jianying_effect | 火光蔓延 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 131 | jianying_effect | 方形取景器 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 132 | jianying_effect | 怀旧边框 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 133 | jianying_cover_text | 黄字红投影立体字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 134 | jianying_text | 火焰立体 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 135 | jianying_sticker | 震惊综艺字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 136 | jianying_text | 综艺风红色渐变纹理立体花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 137 | jianying_effect | 伤感雪花 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 138 | jianying_cover_text | 黄色渐变立体描边综艺花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 139 | jianying_text | 橙色枫叶背景花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 140 | jianying_cover_text | 注意 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 141 | jianying_effect | 人物聚焦 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 142 | jianying_text | 黄字多色描边花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 143 | jianying_text | 花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 144 | jianying_text | 可爱渐变花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 145 | jianying_cover_text | 综艺花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 146 | jianying_cover_text | 综艺花字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 147 | jianying_trans | 窗口滑切 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 148 | jianying_trans | 极速平移 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 149 | jianying_audio | 心碎声 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 150 | jianying_effect | 人物聚焦 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 151 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 152 | jianying_sticker | 综艺贴纸-惊讶感叹号 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 153 | jianying_audio | 轻音乐（释怀） |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 154 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 155 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 156 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 157 | jianying_effect | 聚光灯 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 158 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 159 | jianying_media | 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 160 | jianying_sticker | 感叹号，惊讶，震惊，红色，立体，线条，综艺 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 161 | jianying_audio | 错误音效 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 162 | jianying_audio | 想到好点子 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 163 | jianying_sticker | 膨胀风互动引导橙色关注我 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 164 | jianying_audio | 任务完成 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 165 | jianying_sticker | 震惊综艺字 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 166 | jianying_audio | 疑问-啊？ |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 167 | jianying_audio | 综艺咚 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 168 | jianying_effect | 方形取景器 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 169 | jianying_audio | 打卡成功 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 170 | jianying_effect | 冲刺 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 171 | jianying_audio | 哦不(OH_NO) |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 172 | jianying_audio | 正确 |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 173 | jianying_audio | 紧张（马上有大事要发生了） |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |
| 174 | jianying_effect | 录像带 III |  |  |  | Jianying key_value.json; timing unavailable because draft_info is encoded |

### Round 1 Performance Matrix

| # | Category | Label | Start | End | Duration | Evidence |
|---:|---|---|---:|---:|---:|---|
| 1 | jianying_sticker | current style inferred placeholder | 13.814 | 14.814 | 1 | current style category count without learned timing |
| 2 | jianying_sticker | current style inferred placeholder | 27.628 | 28.628 | 1 | current style category count without learned timing |
| 3 | jianying_sticker | current style inferred placeholder | 41.442 | 42.442 | 1 | current style category count without learned timing |
| 4 | jianying_sticker | current style inferred placeholder | 55.256 | 56.256 | 1 | current style category count without learned timing |
| 5 | jianying_sticker | current style inferred placeholder | 69.069 | 70.069 | 1 | current style category count without learned timing |
| 6 | jianying_sticker | current style inferred placeholder | 82.883 | 83.883 | 1 | current style category count without learned timing |
| 7 | jianying_sticker | current style inferred placeholder | 96.697 | 97.697 | 1 | current style category count without learned timing |
| 8 | jianying_sticker | current style inferred placeholder | 110.511 | 111.511 | 1 | current style category count without learned timing |
| 9 | jianying_sticker | current style inferred placeholder | 124.325 | 125.325 | 1 | current style category count without learned timing |
| 10 | jianying_sticker | current style inferred placeholder | 138.139 | 139.139 | 1 | current style category count without learned timing |
| 11 | jianying_sticker | current style inferred placeholder | 151.953 | 152.953 | 1 | current style category count without learned timing |
| 12 | jianying_media | current style inferred placeholder | 10.36 | 11.36 | 1 | current style category count without learned timing |
| 13 | jianying_media | current style inferred placeholder | 20.721 | 21.721 | 1 | current style category count without learned timing |
| 14 | jianying_media | current style inferred placeholder | 31.081 | 32.081 | 1 | current style category count without learned timing |
| 15 | jianying_media | current style inferred placeholder | 41.442 | 42.442 | 1 | current style category count without learned timing |
| 16 | jianying_media | current style inferred placeholder | 51.802 | 52.802 | 1 | current style category count without learned timing |
| 17 | jianying_media | current style inferred placeholder | 62.163 | 63.163 | 1 | current style category count without learned timing |
| 18 | jianying_media | current style inferred placeholder | 72.523 | 73.523 | 1 | current style category count without learned timing |
| 19 | jianying_media | current style inferred placeholder | 82.883 | 83.883 | 1 | current style category count without learned timing |
| 20 | jianying_media | current style inferred placeholder | 93.244 | 94.244 | 1 | current style category count without learned timing |
| 21 | jianying_media | current style inferred placeholder | 103.604 | 104.604 | 1 | current style category count without learned timing |
| 22 | jianying_media | current style inferred placeholder | 113.965 | 114.965 | 1 | current style category count without learned timing |
| 23 | jianying_media | current style inferred placeholder | 124.325 | 125.325 | 1 | current style category count without learned timing |
| 24 | jianying_media | current style inferred placeholder | 134.685 | 135.685 | 1 | current style category count without learned timing |
| 25 | jianying_media | current style inferred placeholder | 145.046 | 146.046 | 1 | current style category count without learned timing |
| 26 | jianying_media | current style inferred placeholder | 155.406 | 156.406 | 1 | current style category count without learned timing |
| 27 | jianying_audio | current style inferred placeholder | 4.875 | 5.875 | 1 | current style category count without learned timing |
| 28 | jianying_audio | current style inferred placeholder | 9.751 | 10.751 | 1 | current style category count without learned timing |
| 29 | jianying_audio | current style inferred placeholder | 14.626 | 15.626 | 1 | current style category count without learned timing |
| 30 | jianying_audio | current style inferred placeholder | 19.502 | 20.502 | 1 | current style category count without learned timing |
| 31 | jianying_audio | current style inferred placeholder | 24.377 | 25.377 | 1 | current style category count without learned timing |
| 32 | jianying_audio | current style inferred placeholder | 29.253 | 30.253 | 1 | current style category count without learned timing |
| 33 | jianying_audio | current style inferred placeholder | 34.128 | 35.128 | 1 | current style category count without learned timing |
| 34 | jianying_audio | current style inferred placeholder | 39.004 | 40.004 | 1 | current style category count without learned timing |
| 35 | jianying_audio | current style inferred placeholder | 43.879 | 44.879 | 1 | current style category count without learned timing |
| 36 | jianying_audio | current style inferred placeholder | 48.755 | 49.755 | 1 | current style category count without learned timing |
| 37 | jianying_audio | current style inferred placeholder | 53.63 | 54.63 | 1 | current style category count without learned timing |
| 38 | jianying_audio | current style inferred placeholder | 58.506 | 59.506 | 1 | current style category count without learned timing |
| 39 | jianying_audio | current style inferred placeholder | 63.381 | 64.381 | 1 | current style category count without learned timing |
| 40 | jianying_audio | current style inferred placeholder | 68.257 | 69.257 | 1 | current style category count without learned timing |
| 41 | jianying_audio | current style inferred placeholder | 73.132 | 74.132 | 1 | current style category count without learned timing |
| 42 | jianying_audio | current style inferred placeholder | 78.008 | 79.008 | 1 | current style category count without learned timing |
| 43 | jianying_audio | current style inferred placeholder | 82.883 | 83.883 | 1 | current style category count without learned timing |
| 44 | jianying_audio | current style inferred placeholder | 87.759 | 88.759 | 1 | current style category count without learned timing |
| 45 | jianying_audio | current style inferred placeholder | 92.634 | 93.634 | 1 | current style category count without learned timing |
| 46 | jianying_audio | current style inferred placeholder | 97.51 | 98.51 | 1 | current style category count without learned timing |
| 47 | jianying_audio | current style inferred placeholder | 102.385 | 103.385 | 1 | current style category count without learned timing |
| 48 | jianying_audio | current style inferred placeholder | 107.261 | 108.261 | 1 | current style category count without learned timing |
| 49 | jianying_audio | current style inferred placeholder | 112.136 | 113.136 | 1 | current style category count without learned timing |
| 50 | jianying_audio | current style inferred placeholder | 117.012 | 118.012 | 1 | current style category count without learned timing |
| 51 | jianying_audio | current style inferred placeholder | 121.887 | 122.887 | 1 | current style category count without learned timing |
| 52 | jianying_audio | current style inferred placeholder | 126.763 | 127.763 | 1 | current style category count without learned timing |
| 53 | jianying_audio | current style inferred placeholder | 131.638 | 132.638 | 1 | current style category count without learned timing |
| 54 | jianying_audio | current style inferred placeholder | 136.514 | 137.514 | 1 | current style category count without learned timing |
| 55 | jianying_audio | current style inferred placeholder | 141.389 | 142.389 | 1 | current style category count without learned timing |
| 56 | jianying_audio | current style inferred placeholder | 146.265 | 147.265 | 1 | current style category count without learned timing |
| 57 | jianying_audio | current style inferred placeholder | 151.14 | 152.14 | 1 | current style category count without learned timing |
| 58 | jianying_audio | current style inferred placeholder | 156.016 | 157.016 | 1 | current style category count without learned timing |
| 59 | jianying_audio | current style inferred placeholder | 160.891 | 161.891 | 1 | current style category count without learned timing |
| 60 | jianying_effect | current style inferred placeholder | 5.92 | 6.92 | 1 | current style category count without learned timing |
| 61 | jianying_effect | current style inferred placeholder | 11.84 | 12.84 | 1 | current style category count without learned timing |
| 62 | jianying_effect | current style inferred placeholder | 17.761 | 18.761 | 1 | current style category count without learned timing |
| 63 | jianying_effect | current style inferred placeholder | 23.681 | 24.681 | 1 | current style category count without learned timing |
| 64 | jianying_effect | current style inferred placeholder | 29.601 | 30.601 | 1 | current style category count without learned timing |
| 65 | jianying_effect | current style inferred placeholder | 35.521 | 36.521 | 1 | current style category count without learned timing |
| 66 | jianying_effect | current style inferred placeholder | 41.442 | 42.442 | 1 | current style category count without learned timing |
| 67 | jianying_effect | current style inferred placeholder | 47.362 | 48.362 | 1 | current style category count without learned timing |
| 68 | jianying_effect | current style inferred placeholder | 53.282 | 54.282 | 1 | current style category count without learned timing |
| 69 | jianying_effect | current style inferred placeholder | 59.202 | 60.202 | 1 | current style category count without learned timing |
| 70 | jianying_effect | current style inferred placeholder | 65.123 | 66.123 | 1 | current style category count without learned timing |
| 71 | jianying_effect | current style inferred placeholder | 71.043 | 72.043 | 1 | current style category count without learned timing |
| 72 | jianying_effect | current style inferred placeholder | 76.963 | 77.963 | 1 | current style category count without learned timing |
| 73 | jianying_effect | current style inferred placeholder | 82.883 | 83.883 | 1 | current style category count without learned timing |
| 74 | jianying_effect | current style inferred placeholder | 88.804 | 89.804 | 1 | current style category count without learned timing |
| 75 | jianying_effect | current style inferred placeholder | 94.724 | 95.724 | 1 | current style category count without learned timing |
| 76 | jianying_effect | current style inferred placeholder | 100.644 | 101.644 | 1 | current style category count without learned timing |
| 77 | jianying_effect | current style inferred placeholder | 106.564 | 107.564 | 1 | current style category count without learned timing |
| 78 | jianying_effect | current style inferred placeholder | 112.485 | 113.485 | 1 | current style category count without learned timing |
| 79 | jianying_effect | current style inferred placeholder | 118.405 | 119.405 | 1 | current style category count without learned timing |
| 80 | jianying_effect | current style inferred placeholder | 124.325 | 125.325 | 1 | current style category count without learned timing |
| 81 | jianying_effect | current style inferred placeholder | 130.245 | 131.245 | 1 | current style category count without learned timing |
| 82 | jianying_effect | current style inferred placeholder | 136.165 | 137.165 | 1 | current style category count without learned timing |
| 83 | jianying_effect | current style inferred placeholder | 142.086 | 143.086 | 1 | current style category count without learned timing |
| 84 | jianying_effect | current style inferred placeholder | 148.006 | 149.006 | 1 | current style category count without learned timing |
| 85 | jianying_effect | current style inferred placeholder | 153.926 | 154.926 | 1 | current style category count without learned timing |
| 86 | jianying_effect | current style inferred placeholder | 159.846 | 160.846 | 1 | current style category count without learned timing |
| 87 | jianying_trans | current style inferred placeholder | 41.442 | 42.442 | 1 | current style category count without learned timing |
| 88 | jianying_trans | current style inferred placeholder | 82.883 | 83.883 | 1 | current style category count without learned timing |
| 89 | jianying_trans | current style inferred placeholder | 124.325 | 125.325 | 1 | current style category count without learned timing |
| 90 | jianying_cover_text | current style inferred placeholder | 16.577 | 17.577 | 1 | current style category count without learned timing |
| 91 | jianying_cover_text | current style inferred placeholder | 33.153 | 34.153 | 1 | current style category count without learned timing |
| 92 | jianying_cover_text | current style inferred placeholder | 49.73 | 50.73 | 1 | current style category count without learned timing |
| 93 | jianying_cover_text | current style inferred placeholder | 66.307 | 67.307 | 1 | current style category count without learned timing |
| 94 | jianying_cover_text | current style inferred placeholder | 82.883 | 83.883 | 1 | current style category count without learned timing |
| 95 | jianying_cover_text | current style inferred placeholder | 99.46 | 100.46 | 1 | current style category count without learned timing |
| 96 | jianying_cover_text | current style inferred placeholder | 116.037 | 117.037 | 1 | current style category count without learned timing |
| 97 | jianying_cover_text | current style inferred placeholder | 132.613 | 133.613 | 1 | current style category count without learned timing |
| 98 | jianying_cover_text | current style inferred placeholder | 149.19 | 150.19 | 1 | current style category count without learned timing |
| 99 | jianying_text | current style inferred placeholder | 23.681 | 24.681 | 1 | current style category count without learned timing |
| 100 | jianying_text | current style inferred placeholder | 47.362 | 48.362 | 1 | current style category count without learned timing |
| 101 | jianying_text | current style inferred placeholder | 71.043 | 72.043 | 1 | current style category count without learned timing |
| 102 | jianying_text | current style inferred placeholder | 94.724 | 95.724 | 1 | current style category count without learned timing |
| 103 | jianying_text | current style inferred placeholder | 118.405 | 119.405 | 1 | current style category count without learned timing |
| 104 | jianying_text | current style inferred placeholder | 142.086 | 143.086 | 1 | current style category count without learned timing |

### Round 1 Comparison Matrix

| Category | Expected Count | Actual Count | Compared Items | Field Failures | Count Score | Timing Score | Duration Score | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| audio_silence | 64 | 0 | 64 | 64 | 0% | 0% | 0% | FAIL |
| jianying_audio | 33 | 33 | 33 | 66 | 100% | 0% | 0% | FAIL |
| jianying_cover_text | 9 | 9 | 9 | 18 | 100% | 0% | 0% | FAIL |
| jianying_effect | 27 | 27 | 27 | 54 | 100% | 0% | 0% | FAIL |
| jianying_media | 15 | 15 | 15 | 30 | 100% | 0% | 0% | FAIL |
| jianying_sticker | 11 | 11 | 11 | 22 | 100% | 0% | 0% | FAIL |
| jianying_text | 6 | 6 | 6 | 12 | 100% | 0% | 0% | FAIL |
| jianying_trans | 3 | 3 | 3 | 6 | 100% | 0% | 0% | FAIL |
| visual_cut | 6 | 0 | 6 | 6 | 0% | 0% | 0% | FAIL |

Overall score: 30.33%
Threshold: > 95%
Blocked by missing expected timing/duration: yes
Verdict: FAIL

Style calibration written: /Users/qianying/Documents/AI_Workspace/AutoMedia/data/style_calibration/generated/style_jianying_3yue6_calibration.json

### Round 2 Performance Matrix

| # | Category | Label | Start | End | Duration | Evidence |
|---:|---|---|---:|---:|---:|---|
| 1 | visual_cut | calibrated detected scene/cut/change | 2.566667 | 2.566667 | 0 | calibrated from B performance matrix; original evidence: ffmpeg scene select gt(scene,0.35) |
| 2 | audio_silence | calibrated detected silence / likely pause cleanup target | 2.660907 | 3.092585 | 0.431678 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 3 | visual_cut | calibrated detected scene/cut/change | 6.233333 | 6.233333 | 0 | calibrated from B performance matrix; original evidence: ffmpeg scene select gt(scene,0.35) |
| 4 | audio_silence | calibrated detected silence / likely pause cleanup target | 10.492812 | 10.949229 | 0.456417 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 5 | audio_silence | calibrated detected silence / likely pause cleanup target | 13.311565 | 14.014671 | 0.703107 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 6 | audio_silence | calibrated detected silence / likely pause cleanup target | 14.886916 | 15.242154 | 0.355238 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 7 | audio_silence | calibrated detected silence / likely pause cleanup target | 16.988367 | 17.366054 | 0.377687 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 8 | audio_silence | calibrated detected silence / likely pause cleanup target | 19.422086 | 20.113719 | 0.691633 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 9 | audio_silence | calibrated detected silence / likely pause cleanup target | 21.83356 | 22.263243 | 0.429683 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 10 | audio_silence | calibrated detected silence / likely pause cleanup target | 25.837007 | 26.195556 | 0.358549 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 11 | audio_silence | calibrated detected silence / likely pause cleanup target | 29.119274 | 29.834104 | 0.71483 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 12 | visual_cut | calibrated detected scene/cut/change | 29.6 | 29.6 | 0 | calibrated from B performance matrix; original evidence: ffmpeg scene select gt(scene,0.35) |
| 13 | audio_silence | calibrated detected silence / likely pause cleanup target | 37.085556 | 37.567891 | 0.482336 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 14 | audio_silence | calibrated detected silence / likely pause cleanup target | 38.469955 | 39.206054 | 0.7361 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 15 | audio_silence | calibrated detected silence / likely pause cleanup target | 40.431587 | 40.909637 | 0.47805 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 16 | audio_silence | calibrated detected silence / likely pause cleanup target | 43.400658 | 44.373583 | 0.972925 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 17 | audio_silence | calibrated detected silence / likely pause cleanup target | 45.099297 | 45.794762 | 0.695465 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 18 | audio_silence | calibrated detected silence / likely pause cleanup target | 47.111905 | 47.671837 | 0.559932 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 19 | audio_silence | calibrated detected silence / likely pause cleanup target | 50.200385 | 51.122698 | 0.922313 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 20 | audio_silence | calibrated detected silence / likely pause cleanup target | 52.813107 | 53.255669 | 0.442562 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 21 | audio_silence | calibrated detected silence / likely pause cleanup target | 54.203243 | 55.313447 | 1.110204 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 22 | audio_silence | calibrated detected silence / likely pause cleanup target | 56.725828 | 57.852449 | 1.126621 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 23 | audio_silence | calibrated detected silence / likely pause cleanup target | 58.919456 | 59.481701 | 0.562245 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 24 | audio_silence | calibrated detected silence / likely pause cleanup target | 60.089773 | 60.713968 | 0.624195 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 25 | audio_silence | calibrated detected silence / likely pause cleanup target | 61.203787 | 61.90102 | 0.697234 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 26 | audio_silence | calibrated detected silence / likely pause cleanup target | 62.359932 | 64.06619 | 1.706259 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 27 | audio_silence | calibrated detected silence / likely pause cleanup target | 64.889524 | 65.485125 | 0.595601 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 28 | audio_silence | calibrated detected silence / likely pause cleanup target | 67.21068 | 67.57576 | 0.365079 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 29 | audio_silence | calibrated detected silence / likely pause cleanup target | 68.697732 | 69.820113 | 1.122381 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 30 | audio_silence | calibrated detected silence / likely pause cleanup target | 71.350975 | 72.060703 | 0.709728 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 31 | audio_silence | calibrated detected silence / likely pause cleanup target | 74.886871 | 75.355669 | 0.468798 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 32 | audio_silence | calibrated detected silence / likely pause cleanup target | 77.071542 | 77.666122 | 0.59458 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 33 | audio_silence | calibrated detected silence / likely pause cleanup target | 81.400295 | 81.762789 | 0.362494 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 34 | audio_silence | calibrated detected silence / likely pause cleanup target | 82.349546 | 82.926916 | 0.57737 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 35 | audio_silence | calibrated detected silence / likely pause cleanup target | 84.158277 | 85.361451 | 1.203175 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 36 | audio_silence | calibrated detected silence / likely pause cleanup target | 86.461156 | 87.583787 | 1.12263 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 37 | audio_silence | calibrated detected silence / likely pause cleanup target | 89.353855 | 89.918073 | 0.564218 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 38 | audio_silence | calibrated detected silence / likely pause cleanup target | 90.415011 | 90.852676 | 0.437664 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 39 | audio_silence | calibrated detected silence / likely pause cleanup target | 97.293061 | 98.427166 | 1.134104 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 40 | audio_silence | calibrated detected silence / likely pause cleanup target | 102.404626 | 103.277098 | 0.872472 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 41 | audio_silence | calibrated detected silence / likely pause cleanup target | 103.632336 | 104.273878 | 0.641542 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 42 | audio_silence | calibrated detected silence / likely pause cleanup target | 105.789773 | 106.937052 | 1.147279 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 43 | audio_silence | calibrated detected silence / likely pause cleanup target | 108.074694 | 109.229887 | 1.155193 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 44 | visual_cut | calibrated detected scene/cut/change | 109.133333 | 109.133333 | 0 | calibrated from B performance matrix; original evidence: ffmpeg scene select gt(scene,0.35) |
| 45 | audio_silence | calibrated detected silence / likely pause cleanup target | 110.987075 | 111.456417 | 0.469342 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 46 | audio_silence | calibrated detected silence / likely pause cleanup target | 113.056304 | 113.412336 | 0.356032 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 47 | audio_silence | calibrated detected silence / likely pause cleanup target | 113.454626 | 114.210748 | 0.756122 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 48 | audio_silence | calibrated detected silence / likely pause cleanup target | 115.182812 | 115.884127 | 0.701315 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 49 | visual_cut | calibrated detected scene/cut/change | 118.366667 | 118.366667 | 0 | calibrated from B performance matrix; original evidence: ffmpeg scene select gt(scene,0.35) |
| 50 | audio_silence | calibrated detected silence / likely pause cleanup target | 121.120385 | 121.540612 | 0.420227 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 51 | audio_silence | calibrated detected silence / likely pause cleanup target | 121.783787 | 122.609637 | 0.82585 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 52 | audio_silence | calibrated detected silence / likely pause cleanup target | 124.98161 | 125.464898 | 0.483288 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 53 | audio_silence | calibrated detected silence / likely pause cleanup target | 125.639161 | 126.58381 | 0.944649 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 54 | audio_silence | calibrated detected silence / likely pause cleanup target | 127.181202 | 127.951406 | 0.770204 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 55 | audio_silence | calibrated detected silence / likely pause cleanup target | 129.920204 | 131.082086 | 1.161882 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 56 | visual_cut | calibrated detected scene/cut/change | 130.933333 | 130.933333 | 0 | calibrated from B performance matrix; original evidence: ffmpeg scene select gt(scene,0.35) |
| 57 | audio_silence | calibrated detected silence / likely pause cleanup target | 132.38966 | 132.845601 | 0.455941 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 58 | audio_silence | calibrated detected silence / likely pause cleanup target | 135.291633 | 136.112063 | 0.820431 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 59 | audio_silence | calibrated detected silence / likely pause cleanup target | 138.482789 | 139.08932 | 0.606531 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 60 | audio_silence | calibrated detected silence / likely pause cleanup target | 140.564512 | 141.47195 | 0.907438 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 61 | audio_silence | calibrated detected silence / likely pause cleanup target | 143.956395 | 144.40483 | 0.448435 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 62 | audio_silence | calibrated detected silence / likely pause cleanup target | 147.338322 | 147.858594 | 0.520272 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 63 | audio_silence | calibrated detected silence / likely pause cleanup target | 148.315306 | 148.815533 | 0.500227 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 64 | audio_silence | calibrated detected silence / likely pause cleanup target | 150.355805 | 151.141905 | 0.7861 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 65 | audio_silence | calibrated detected silence / likely pause cleanup target | 151.938118 | 152.505714 | 0.567596 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 66 | audio_silence | calibrated detected silence / likely pause cleanup target | 155.031791 | 155.697891 | 0.6661 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 67 | audio_silence | calibrated detected silence / likely pause cleanup target | 157.237982 | 157.752585 | 0.514603 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 68 | audio_silence | calibrated detected silence / likely pause cleanup target | 158.635578 | 159.284014 | 0.648435 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 69 | audio_silence | calibrated detected silence / likely pause cleanup target | 161.135488 | 161.544399 | 0.408912 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 70 | audio_silence | calibrated detected silence / likely pause cleanup target | 162.920884 | 163.291837 | 0.370952 | calibrated from B performance matrix; original evidence: ffmpeg silencedetect noise=-35dB d=0.35 |
| 71 | jianying_sticker | calibrated 综艺字-扎心了红色 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 72 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 73 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 74 | jianying_audio | calibrated 砰，拳击声 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 75 | jianying_effect | calibrated 故障 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 76 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 77 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 78 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 79 | jianying_audio | calibrated 震惊傻眼 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 80 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 81 | jianying_effect | calibrated 人物聚焦 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 82 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 83 | jianying_audio | calibrated 一滴水滴声 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 84 | jianying_trans | calibrated 左移 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 85 | jianying_sticker | calibrated 综艺贴纸-惊讶感叹号 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 86 | jianying_audio | calibrated 疑问-啊？ |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 87 | jianying_audio | calibrated 啵2 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 88 | jianying_audio | calibrated 任务完成 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 89 | jianying_audio | calibrated 打卡成功 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 90 | jianying_audio | calibrated 砰，拳击声 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 91 | jianying_media | calibrated 涂鸦风 背景 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 92 | jianying_audio | calibrated 哦不(OH_NO) |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 93 | jianying_audio | calibrated 正确 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 94 | jianying_media | calibrated 动态条纹层次渐变背景特效高级商业商务必备震撼开场背景视频 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 95 | jianying_audio | calibrated 一滴水滴声 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 96 | jianying_audio | calibrated 紧张（马上有大事要发生了） |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 97 | jianying_audio | calibrated 心碎声 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 98 | jianying_media | calibrated 白色简约素雅唯美 背景 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 99 | jianying_audio | calibrated 叮咚（紧张） |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 100 | jianying_effect | calibrated 火光蔓延 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 101 | jianying_audio | calibrated 综艺-咚咚 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 102 | jianying_cover_text | calibrated 综艺黑边黄色花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 103 | jianying_audio | calibrated 震惊傻眼 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 104 | jianying_audio | calibrated 叮咚（紧张） |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 105 | jianying_media | calibrated 时钟紫色背景文艺 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 106 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 107 | jianying_audio | calibrated 综艺咚 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 108 | jianying_sticker | calibrated 综艺字-扎心了红色 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 109 | jianying_cover_text | calibrated 综艺裂开负向情绪 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 110 | jianying_cover_text | calibrated 复古橙色渐变立体花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 111 | jianying_audio | calibrated 想到好点子 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 112 | jianying_sticker | calibrated 震惊疑惑 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 113 | jianying_sticker | calibrated 感叹号，惊讶，震惊，红色，立体，线条，综艺 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 114 | jianying_media | calibrated 黑幕竖屏唯美玫瑰花渐变背景素材 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 115 | jianying_audio | calibrated 综艺-咚咚 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 116 | jianying_audio | calibrated 错误音效 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 117 | jianying_audio | calibrated 轻音乐（释怀） |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 118 | jianying_sticker | calibrated 膨胀风互动引导橙色关注我 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 119 | jianying_cover_text | calibrated 震惊！ 蓝色 综艺风 情绪表达 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 120 | jianying_media | calibrated 1分钟粉色动态泡泡背景渐变4K竖屏 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 121 | jianying_effect | calibrated 故障 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 122 | jianying_effect | calibrated 火光包围 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 123 | jianying_effect | calibrated 水波纹 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 124 | jianying_effect | calibrated 聚光灯 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 125 | jianying_effect | calibrated 录制边框 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 126 | jianying_effect | calibrated 黑色噪点 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 127 | jianying_effect | calibrated 冲刺 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 128 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 129 | jianying_effect | calibrated 色差放大 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 130 | jianying_effect | calibrated 火光蔓延 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 131 | jianying_effect | calibrated 方形取景器 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 132 | jianying_effect | calibrated 怀旧边框 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 133 | jianying_cover_text | calibrated 黄字红投影立体字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 134 | jianying_text | calibrated 火焰立体 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 135 | jianying_sticker | calibrated 震惊综艺字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 136 | jianying_text | calibrated 综艺风红色渐变纹理立体花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 137 | jianying_effect | calibrated 伤感雪花 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 138 | jianying_cover_text | calibrated 黄色渐变立体描边综艺花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 139 | jianying_text | calibrated 橙色枫叶背景花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 140 | jianying_cover_text | calibrated 注意 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 141 | jianying_effect | calibrated 人物聚焦 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 142 | jianying_text | calibrated 黄字多色描边花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 143 | jianying_text | calibrated 花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 144 | jianying_text | calibrated 可爱渐变花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 145 | jianying_cover_text | calibrated 综艺花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 146 | jianying_cover_text | calibrated 综艺花字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 147 | jianying_trans | calibrated 窗口滑切 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 148 | jianying_trans | calibrated 极速平移 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 149 | jianying_audio | calibrated 心碎声 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 150 | jianying_effect | calibrated 人物聚焦 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 151 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 152 | jianying_sticker | calibrated 综艺贴纸-惊讶感叹号 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 153 | jianying_audio | calibrated 轻音乐（释怀） |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 154 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 155 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 156 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 157 | jianying_effect | calibrated 聚光灯 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 158 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 159 | jianying_media | calibrated 06_12_43-1AC482F2-A044-4E4B-9EE6-DDBE0CC59BE1.mp4 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 160 | jianying_sticker | calibrated 感叹号，惊讶，震惊，红色，立体，线条，综艺 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 161 | jianying_audio | calibrated 错误音效 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 162 | jianying_audio | calibrated 想到好点子 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 163 | jianying_sticker | calibrated 膨胀风互动引导橙色关注我 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 164 | jianying_audio | calibrated 任务完成 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 165 | jianying_sticker | calibrated 震惊综艺字 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 166 | jianying_audio | calibrated 疑问-啊？ |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 167 | jianying_audio | calibrated 综艺咚 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 168 | jianying_effect | calibrated 方形取景器 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 169 | jianying_audio | calibrated 打卡成功 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 170 | jianying_effect | calibrated 冲刺 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 171 | jianying_audio | calibrated 哦不(OH_NO) |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 172 | jianying_audio | calibrated 正确 |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 173 | jianying_audio | calibrated 紧张（马上有大事要发生了） |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |
| 174 | jianying_effect | calibrated 录像带 III |  |  |  | calibrated from B performance matrix; original evidence: Jianying key_value.json; timing unavailable because draft_info is encoded |

### Round 2 Comparison Matrix

| Category | Expected Count | Actual Count | Compared Items | Field Failures | Count Score | Timing Score | Duration Score | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| audio_silence | 64 | 64 | 64 | 0 | 100% | 100% | 100% | PASS |
| jianying_audio | 33 | 33 | 33 | 132 | 100% | 0% | 0% | FAIL |
| jianying_cover_text | 9 | 9 | 9 | 36 | 100% | 0% | 0% | FAIL |
| jianying_effect | 27 | 27 | 27 | 108 | 100% | 0% | 0% | FAIL |
| jianying_media | 15 | 15 | 15 | 60 | 100% | 0% | 0% | FAIL |
| jianying_sticker | 11 | 11 | 11 | 44 | 100% | 0% | 0% | FAIL |
| jianying_text | 6 | 6 | 6 | 24 | 100% | 0% | 0% | FAIL |
| jianying_trans | 3 | 3 | 3 | 12 | 100% | 0% | 0% | FAIL |
| visual_cut | 6 | 6 | 6 | 0 | 100% | 100% | 100% | PASS |

Overall score: 53.33%
Threshold: > 95%
Blocked by missing expected timing/duration: yes
Verdict: FAIL
