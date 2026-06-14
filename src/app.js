const appShell = document.querySelector(".app-shell");
const sidebarToggle = document.querySelector("#sidebarToggle");
const moduleButtons = document.querySelectorAll(".module-button[data-view]");
const editorNav = document.querySelector("#editorNav");
const editStepDropdown = document.querySelector("#editStepDropdown");
const editStepChecks = document.querySelectorAll(".edit-step-check");
const tabButtons = document.querySelectorAll(".tab");
const views = {
  home: document.querySelector("#homeView"),
  editor: document.querySelector("#editorView"),
  publishing: document.querySelector("#publishingView"),
  styleManager: document.querySelector("#styleManagerView"),
};
const pageTitleInput = document.querySelector("#pageTitleInput");
const currentSection = document.querySelector("#currentSection");
const toast = document.querySelector("#toast");
const canvasColumn = document.querySelector(".canvas-column");
const timelineDivider = document.querySelector("#timelineDivider");
const recentVideoGrid = document.querySelector("#recentVideoGrid");
const homeStyleList = document.querySelector("#homeStyleList");
const newVideoStylePicker = document.querySelector("#newVideoStylePicker");
const newVideoFilename = document.querySelector("#newVideoFilename");
const newVideoError = document.querySelector("#newVideoError");
const confirmNewVideo = document.querySelector("#confirmNewVideo");
const saveProjectButton = document.querySelector("#saveProject");
const styleCardGrid = document.querySelector("#styleCardGrid");
const styleNameInput = document.querySelector("#styleNameInput");
const styleRuleList = document.querySelector("#styleRuleList");
const saveStyleButton = document.querySelector("#saveStyleButton");
const deleteStyleButton = document.querySelector("#deleteStyleButton");
const confirmDeleteButton = document.querySelector("#confirmDelete");
const cancelDeleteButton = document.querySelector("#cancelDeleteConfirm");
const timeline = document.querySelector("#timeline");
const videoAssetList = document.querySelector("#videoAssetList");
const effectCatalog = document.querySelector("#effectCatalog");
const audioCatalog = document.querySelector("#audioCatalog");
const musicCatalog = document.querySelector("#musicCatalog");
const textToolList = document.querySelector("#textToolList");
const stickerCatalog = document.querySelector("#stickerCatalog");
const transitionCatalog = document.querySelector("#transitionCatalog");
const subtitleEditor = document.querySelector("#subtitleEditor");

const appState = {
  projects: [],
  styles: [],
  currentProjectId: null,
  currentProject: null,
  currentStyle: null,
  deleteTarget: null,
  createInFlight: false,
  dirty: false,
  bootstrapError: null,
};

window.__automediaState = appState;

const viewLabels = {
  home: ["Home", "AutoMedia 工作台"],
  editor: ["Video Editing", "未选择视频"],
  publishing: ["Video Publishing", "视频发布准备"],
  styleManager: ["Style Manager", "我的视频风格管理"],
};

const routeByView = {
  home: "#/home",
  editor: "#/editor",
  publishing: "#/publishing",
  styleManager: "#/styles",
};

const activeViewMarker = {
  home: "home",
  editor: "editor",
  publishing: "publishing",
  styleManager: "styles",
};
const editStepKeys = ["arrange_timeline", "clean_speech", "subtitles_bilingual", "apply_style_profile"];
editStepChecks.forEach((checkbox, index) => {
  checkbox.dataset.stepKey = editStepKeys[index];
});

function openModal(id) {
  const modal = document.querySelector(`#${id}`);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  if (id === "newVideoModal") {
    newVideoError.textContent = "";
  }
}

function closeModal(id) {
  const modal = document.querySelector(`#${id}`);
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("active");
  window.setTimeout(() => toast.classList.remove("active"), 3200);
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function parseRoute() {
  const hash = window.location.hash || "#/home";
  const editorMatch = hash.match(/^#\/editor(?:\/([^/]+))?$/);
  if (editorMatch) {
    return { viewName: "editor", projectId: editorMatch[1] ? decodeURIComponent(editorMatch[1]) : null };
  }
  if (hash === "#/home") return { viewName: "home", projectId: null };
  if (hash === "#/publishing") return { viewName: "publishing", projectId: null };
  if (hash === "#/styles") return { viewName: "styleManager", projectId: null };
  window.location.hash = "#/home";
  return { viewName: "home", projectId: null };
}

function editorRoute(projectId) {
  return projectId ? `#/editor/${encodeURIComponent(projectId)}` : "#/editor";
}

function currentProject() {
  return appState.currentProject?.project || appState.projects.find((project) => project.id === appState.currentProjectId) || null;
}

function projectTitleForTopbar() {
  return currentProject()?.title || viewLabels.editor[1];
}

function setActiveView(viewName, options = {}) {
  const { updateRoute = true, projectId = null } = options;

  if (viewName === "editor") {
    appState.currentProjectId = projectId || appState.currentProjectId || appState.projects[0]?.id || null;
  }

  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[viewName].classList.add("active");

  moduleButtons.forEach((button) => button.classList.remove("active"));
  const activeButton = document.querySelector(`.module-button[data-view="${viewName}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }

  appShell.classList.toggle("is-editor", viewName === "editor");
  appShell.classList.toggle("home-mode", viewName === "home");
  appShell.classList.toggle("style-mode", viewName === "styleManager");
  appShell.dataset.activeView = activeViewMarker[viewName];
  currentSection.textContent = viewLabels[viewName][0];
  pageTitleInput.value = viewName === "editor" ? projectTitleForTopbar() : viewLabels[viewName][1];

  if (viewName === "editor") {
    editStepDropdown.classList.add("open");
    editorNav.setAttribute("aria-expanded", "true");
    if (appState.currentProjectId && appState.currentProject?.project?.id !== appState.currentProjectId) {
      loadProject(appState.currentProjectId);
    }
  } else {
    editStepDropdown.classList.remove("open");
    editorNav.setAttribute("aria-expanded", "false");
  }

  if (updateRoute) {
    const nextRoute = viewName === "editor" ? editorRoute(projectId) : routeByView[viewName];
    if (window.location.hash !== nextRoute) {
      window.location.hash = nextRoute;
    }
  }
}

function setActiveTab(tab) {
  const target = document.querySelector(`#${tab.dataset.tab}`);
  const tabGroup = tab.closest(".tab-strip");
  const container = tab.closest(".tool-panel, .publish-workspace");

  tabGroup.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
  container.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));

  tab.classList.add("active");
  target.classList.add("active");
}

function thumbClass(index) {
  return ["thumb-a", "thumb-b", "thumb-c"][index % 3];
}

function formatPlayhead(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderProjects() {
  recentVideoGrid.innerHTML = "";

  if (appState.bootstrapError) {
    const error = document.createElement("div");
    error.className = "error-state";
    error.dataset.testid = "recent-error";
    error.textContent = `无法读取项目数据库：${appState.bootstrapError}`;
    recentVideoGrid.append(error);
    return;
  }

  if (!appState.projects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.dataset.testid = "recent-empty";
    empty.textContent = "还没有可恢复的草稿项目。";
    recentVideoGrid.append(empty);
    return;
  }

  appState.projects.forEach((project, index) => {
    const card = document.createElement("button");
    card.className = "recent-card";
    card.type = "button";
    card.dataset.projectId = project.id;
    card.dataset.testid = "recent-card";
    card.innerHTML = `
      <span class="recent-thumb ${thumbClass(index)}"></span>
      <strong>${project.title}</strong>
      <small>上次编辑到 ${formatPlayhead(project.lastPlayheadMs)} · ${project.status}</small>
    `;
    recentVideoGrid.append(card);
  });
}

function renderStyles() {
  homeStyleList.innerHTML = "";
  appState.styles.forEach((style) => {
    const chip = document.createElement("span");
    chip.textContent = style.name;
    homeStyleList.append(chip);
  });

  newVideoStylePicker.innerHTML = "<h3>选择剪辑风格</h3>";
  if (!appState.styles.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "当前没有可用风格。";
    newVideoStylePicker.append(empty);
    return;
  }

  appState.styles.forEach((style, index) => {
    const label = document.createElement("label");
    label.innerHTML = `<input name="newVideoStyle" type="radio" value="${style.id}" ${index === 0 ? "checked" : ""} /> ${style.name}`;
    newVideoStylePicker.append(label);
  });
  renderStyleManager();
}

function renderStyleManager() {
  styleCardGrid.innerHTML = "";
  appState.styles.forEach((style) => {
    const card = document.createElement("button");
    card.className = "style-card";
    card.type = "button";
    card.dataset.styleId = style.id;
    card.dataset.testid = "style-card";
    card.innerHTML = `
      <strong>${escapeHtml(style.name)}</strong>
      <span>创建时间：${escapeHtml((style.createdAt || "").slice(0, 10))}</span>
      <small>${escapeHtml(style.summary)}</small>
    `;
    styleCardGrid.append(card);
  });
}

function renderStyleDetail() {
  if (!appState.currentStyle) return;
  styleNameInput.value = appState.currentStyle.style.name;
  styleRuleList.innerHTML = "";
  appState.currentStyle.rules.forEach((rule) => {
    const label = document.createElement("label");
    label.dataset.ruleId = rule.id;
    label.innerHTML = `
      <input type="checkbox" ${rule.enabled ? "checked" : ""} />
      <span>${escapeHtml(rule.ruleText)}</span>
      <small>${escapeHtml(rule.rule?.review_status || "")}</small>
      <button class="trash-button" type="button" data-delete-rule="${escapeHtml(rule.id)}">⌫</button>
    `;
    styleRuleList.append(label);
  });
}

function updateSaveState() {
  saveProjectButton.textContent = appState.dirty ? "保存*" : "保存";
}

function trackLabel(trackType) {
  return { video: "Video", audio: "Audio", subtitles: "Subtitles", effects: "Effects" }[trackType] || trackType;
}

function renderTimeline() {
  const project = appState.currentProject;
  timeline.innerHTML = '<div class="playhead"></div>';
  if (!project) return;
  project.tracks.forEach((track) => {
    const row = document.createElement("div");
    row.className = "track";
    row.dataset.trackType = track.trackType;
    row.innerHTML = `<span class="track-label">${escapeHtml(trackLabel(track.trackType))}</span>`;
    project.items
      .filter((item) => item.trackId === track.id)
      .forEach((item) => {
        const clip = document.createElement("button");
        clip.type = "button";
        clip.className = `clip ${item.itemType}-clip`;
        clip.dataset.itemId = item.id;
        clip.textContent =
          item.properties?.text ||
          item.properties?.catalog_display_name ||
          item.properties?.catalog_id ||
          item.itemType;
        row.append(clip);
      });
    timeline.append(row);
  });
}

function renderAssets() {
  const project = appState.currentProject;
  videoAssetList.innerHTML = "";
  const importButton = document.createElement("button");
  importButton.className = "asset-card";
  importButton.type = "button";
  importButton.dataset.importFixture = "true";
  importButton.innerHTML = '<span class="thumb thumb-two"></span><span><strong>导入测试视频</strong><small>复制到 AutoMedia library</small></span>';
  videoAssetList.append(importButton);
  if (!project) return;
  project.assets
    .filter((asset) => asset.assetType === "video")
    .forEach((asset) => {
      const button = document.createElement("button");
      button.className = "asset-card";
      button.type = "button";
      button.dataset.assetId = asset.id;
      button.dataset.addVideoAsset = asset.id;
      button.innerHTML = `
        <span class="thumb thumb-one"></span>
        <span><strong>${escapeHtml(asset.originalName)}</strong><small>${escapeHtml(asset.role)} · ${asset.durationMs || 0}ms</small></span>
      `;
      videoAssetList.append(button);
    });
}

function catalogButton(container, label, dataset) {
  const button = document.createElement("button");
  button.type = "button";
  Object.entries(dataset).forEach(([key, value]) => {
    button.dataset[key] = value;
  });
  button.textContent = label;
  container.append(button);
}

function renderCatalogs() {
  effectCatalog.innerHTML = "";
  audioCatalog.innerHTML = "";
  musicCatalog.innerHTML = "";
  textToolList.innerHTML = "";
  stickerCatalog.innerHTML = "";
  transitionCatalog.innerHTML = "";
  catalogButton(effectCatalog, "关键词弹出", { catalogType: "effect", catalogId: "effect_presets_keyword_pop" });
  catalogButton(audioCatalog, "Pop 音效", { catalogType: "audio", catalogId: "audio_presets_pop" });
  catalogButton(musicCatalog, "轻柔日常背景", { catalogType: "music", catalogId: "music_assets_calm_loop" });
  catalogButton(textToolList, "添加句子文本", { addText: "true" });
  catalogButton(stickerCatalog, "灵感火花", { catalogType: "sticker", catalogId: "sticker_assets_spark" });
  catalogButton(transitionCatalog, "闪白转场", { catalogType: "transition", catalogId: "transition_presets_flash_white" });
}

function renderSubtitles() {
  subtitleEditor.innerHTML = "";
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "secondary-button";
  addButton.dataset.addSubtitle = "true";
  addButton.textContent = "添加句级字幕";
  subtitleEditor.append(addButton);
  const project = appState.currentProject;
  if (!project) return;
  project.items
    .filter((item) => item.itemType === "subtitle")
    .forEach((item) => {
      const label = document.createElement("label");
      label.innerHTML = `<span>${formatPlayhead(item.startMs)}</span><textarea data-edit-item="${escapeHtml(item.id)}">${escapeHtml(item.properties?.text || "")}</textarea>`;
      subtitleEditor.append(label);
    });
}

function applyLayout() {
  const layout = appState.currentProject?.layout;
  if (!layout) return;
  canvasColumn.style.setProperty("--video-panel-height", `${layout.videoPanelHeight || 520}px`);
  canvasColumn.style.setProperty("--timeline-panel-height", `${layout.timelinePanelHeight || 260}px`);
}

function syncEditSteps() {
  const steps = appState.currentProject?.steps || [];
  editStepChecks.forEach((checkbox) => {
    const stepKey = checkbox.dataset.stepKey;
    const row = steps.find((step) => step.stepKey === stepKey);
    if (row) checkbox.checked = Boolean(row.enabled);
  });
}

function renderProjectWorkspace() {
  renderTimeline();
  renderAssets();
  renderCatalogs();
  renderSubtitles();
  applyLayout();
  syncEditSteps();
}

async function loadBootstrap() {
  try {
    const payload = await apiJson("/api/bootstrap");
    appState.projects = payload.projects || [];
    appState.styles = payload.styles || [];
    appState.bootstrapError = null;
  } catch (error) {
    appState.projects = [];
    appState.styles = [];
    appState.bootstrapError = error.message;
  }
  renderProjects();
  renderStyles();
}

async function refreshBootstrap() {
  await loadBootstrap();
}

async function ensureJianyingStyle() {
  try {
    let imported = false;
    if (!appState.styles.some((style) => style.id === "style_jianying_3yue6")) {
      await apiJson("/api/styles/import-jianying-first", { method: "POST", body: JSON.stringify({}) });
      imported = true;
    }
    if (!appState.styles.some((style) => style.id === "style_jianying_3yue6_v3")) {
      await apiJson("/api/styles/import-jianying-v3", { method: "POST", body: JSON.stringify({}) });
      imported = true;
    }
    if (imported) await loadBootstrap();
  } catch (error) {
    showToast(`剪映风格导入跳过：${error.message}`);
  }
}

async function loadProject(projectId) {
  if (!projectId) return;
  try {
    appState.currentProject = await apiJson(`/api/projects/${encodeURIComponent(projectId)}`);
    appState.currentProjectId = projectId;
    appState.dirty = false;
    pageTitleInput.value = appState.currentProject.project.title;
    renderProjectWorkspace();
    updateSaveState();
  } catch (error) {
    showToast(`无法读取项目：${error.message}`);
  }
}

async function createNewVideo() {
  if (appState.createInFlight) {
    return;
  }

  const filename = newVideoFilename.value.trim();
  const selectedStyle = newVideoStylePicker.querySelector('input[name="newVideoStyle"]:checked');
  if (!filename) {
    newVideoError.textContent = "请输入素材文件名。";
    return;
  }
  if (!selectedStyle) {
    newVideoError.textContent = "请选择剪辑风格。";
    return;
  }

  appState.createInFlight = true;
  confirmNewVideo.disabled = true;
  newVideoError.textContent = "";
  try {
    const payload = await apiJson("/api/projects", {
      method: "POST",
      body: JSON.stringify({ filename, styleId: selectedStyle.value }),
    });
    appState.projects = [payload.project, ...appState.projects.filter((project) => project.id !== payload.project.id)];
    renderProjects();
    closeModal("newVideoModal");
    setActiveView("editor", { projectId: payload.project.id });
    showToast("已创建新视频，素材和风格已载入剪辑页面。");
  } catch (error) {
    newVideoError.textContent = error.message;
  } finally {
    appState.createInFlight = false;
    confirmNewVideo.disabled = false;
  }
}

async function openStyleDetail(styleId) {
  appState.currentStyle = await apiJson(`/api/styles/${encodeURIComponent(styleId)}`);
  renderStyleDetail();
  openModal("styleDetailModal");
}

async function saveStyle() {
  if (!appState.currentStyle) return;
  appState.currentStyle = await apiJson(`/api/styles/${encodeURIComponent(appState.currentStyle.style.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ name: styleNameInput.value }),
  });
  await refreshBootstrap();
  renderStyleDetail();
  showToast("风格已保存。");
}

async function saveProject() {
  if (!appState.currentProjectId) return;
  const rows = getComputedStyle(canvasColumn).gridTemplateRows.split(" ");
  const payload = {
    title: pageTitleInput.value,
    layout: {
      videoPanelHeight: parseFloat(rows[0]) || 520,
      timelinePanelHeight: parseFloat(rows[2]) || 260,
    },
    steps: Array.from(editStepChecks).map((checkbox) => ({
      stepKey: checkbox.dataset.stepKey,
      enabled: checkbox.checked,
    })),
  };
  try {
    appState.currentProject = await apiJson(`/api/projects/${encodeURIComponent(appState.currentProjectId)}/save`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    appState.projects = appState.projects.map((project) =>
      project.id === appState.currentProjectId ? { ...project, title: appState.currentProject.project.title } : project,
    );
    appState.dirty = false;
    updateSaveState();
    renderProjectWorkspace();
    showToast("项目已保存。");
  } catch (error) {
    showToast(`保存失败：${error.message}`);
  }
}

async function importFixtureAsset() {
  if (!appState.currentProjectId) return;
  const payload = await apiJson(`/api/projects/${encodeURIComponent(appState.currentProjectId)}/import-asset`, {
    method: "POST",
    body: JSON.stringify({ filePath: `${window.location.origin ? "" : ""}${"fixtures/media/m3m6_fixture_video.mp4"}` }),
  });
  appState.currentProject = payload.project;
  renderProjectWorkspace();
  showToast("素材已复制到 AutoMedia library。");
}

async function addTimelineItem(input) {
  if (!appState.currentProjectId) return;
  const payload = await apiJson(`/api/projects/${encodeURIComponent(appState.currentProjectId)}/timeline-items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  appState.currentProject = payload.project;
  renderProjectWorkspace();
}

async function updateTimelineItem(itemId, properties) {
  appState.currentProject = await apiJson(`/api/timeline-items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
  renderProjectWorkspace();
}

async function deleteTimelineItem(itemId) {
  appState.currentProject = await apiJson(`/api/timeline-items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
  });
  renderProjectWorkspace();
}

sidebarToggle.addEventListener("click", () => {
  appShell.classList.toggle("sidebar-collapsed");
});

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const wasOpen = editStepDropdown.classList.contains("open");
    setActiveView(button.dataset.view, { projectId: button.dataset.view === "editor" ? appState.currentProjectId : null });
    if (button === editorNav) {
      const isOpen = views.editor.classList.contains("active") ? !wasOpen : true;
      editStepDropdown.classList.toggle("open", isOpen);
      editorNav.setAttribute("aria-expanded", String(isOpen));
    }
  });
});

tabButtons.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab));
});

recentVideoGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-project-id]");
  if (!card) return;
  setActiveView("editor", { projectId: card.dataset.projectId });
});

document.querySelector("#openNewVideo").addEventListener("click", () => {
  openModal("newVideoModal");
});

confirmNewVideo.addEventListener("click", createNewVideo);

saveProjectButton.addEventListener("click", saveProject);

pageTitleInput.addEventListener("input", () => {
  if (views.editor.classList.contains("active")) {
    appState.dirty = true;
    updateSaveState();
  }
});

document.querySelector("#openStyleManager").addEventListener("click", async () => {
  await refreshBootstrap();
  setActiveView("styleManager");
});

document.querySelector("#openNewStyle").addEventListener("click", () => {
  openModal("newStyleModal");
});

styleCardGrid.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-style-id]");
  if (!card) return;
  await openStyleDetail(card.dataset.styleId);
});

editStepChecks.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    appState.dirty = true;
    updateSaveState();
    if (!checkbox.checked) {
      openModal("recutConfirmModal");
    }
  });
});

styleRuleList.addEventListener("change", async (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  const row = event.target.closest("[data-rule-id]");
  if (!checkbox || !row) return;
  appState.currentStyle = await apiJson(`/api/style-rules/${encodeURIComponent(row.dataset.ruleId)}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled: checkbox.checked }),
  });
  renderStyleDetail();
});

styleRuleList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-rule]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  appState.deleteTarget = { type: "rule", id: button.dataset.deleteRule };
  document.querySelector("#deleteConfirmTitle").textContent = "确认删除这条风格规则？";
  document.querySelector("#deleteConfirmBody").textContent = "删除后这条规则将不再参与后续自动剪辑。";
  openModal("deleteConfirmModal");
});

saveStyleButton.addEventListener("click", async () => {
  await saveStyle();
  closeModal("styleDetailModal");
});

deleteStyleButton.addEventListener("click", () => {
  if (!appState.currentStyle) return;
  appState.deleteTarget = { type: "style", id: appState.currentStyle.style.id };
  document.querySelector("#deleteConfirmTitle").textContent = "确认删除这个风格？";
  document.querySelector("#deleteConfirmBody").textContent = "删除后这个风格不会再出现在主页、创建新视频和风格管理里。";
  openModal("deleteConfirmModal");
});

async function resolveDelete(decision) {
  if (!appState.deleteTarget) return;
  const target = appState.deleteTarget;
  if (target.type === "rule") {
    await apiJson(`/api/style-rules/${encodeURIComponent(target.id)}`, {
      method: "DELETE",
      body: JSON.stringify({ decision }),
    });
    if (appState.currentStyle) {
      appState.currentStyle = await apiJson(`/api/styles/${encodeURIComponent(appState.currentStyle.style.id)}`);
      renderStyleDetail();
    }
  }
  if (target.type === "style") {
    await apiJson(`/api/styles/${encodeURIComponent(target.id)}`, {
      method: "DELETE",
      body: JSON.stringify({ decision }),
    });
    await refreshBootstrap();
    closeModal("styleDetailModal");
  }
  appState.deleteTarget = null;
  closeModal("deleteConfirmModal");
}

confirmDeleteButton.addEventListener("click", () => resolveDelete("confirmed"));
cancelDeleteButton.addEventListener("click", () => resolveDelete("cancelled"));

document.querySelector("#confirmRecut").addEventListener("click", () => {
  closeModal("recutConfirmModal");
  showToast("已按新的步骤重新开始自动剪辑。");
});

document.querySelector("#runAutoEdit").addEventListener("click", () => {
  showToast("自动剪辑已开始，正在按当前步骤重新生成 timeline。");
});

document.querySelector("#openMemory").addEventListener("click", () => {
  openModal("memoryModal");
});

timelineDivider.addEventListener("pointerdown", (event) => {
  const startY = event.clientY;
  const rect = canvasColumn.getBoundingClientRect();
  const rows = getComputedStyle(canvasColumn).gridTemplateRows.split(" ");
  const startVideo = parseFloat(rows[0]);
  const startTimeline = parseFloat(rows[2]);

  timelineDivider.setPointerCapture(event.pointerId);

  function onMove(moveEvent) {
    const delta = moveEvent.clientY - startY;
    const nextVideo = Math.max(280, Math.min(rect.height - 210, startVideo + delta));
    const nextTimeline = Math.max(180, startTimeline - delta);
    canvasColumn.style.setProperty("--video-panel-height", `${nextVideo}px`);
    canvasColumn.style.setProperty("--timeline-panel-height", `${nextTimeline}px`);
    appState.dirty = true;
    updateSaveState();
  }

  function onUp() {
    timelineDivider.removeEventListener("pointermove", onMove);
    timelineDivider.removeEventListener("pointerup", onUp);
  }

  timelineDivider.addEventListener("pointermove", onMove);
  timelineDivider.addEventListener("pointerup", onUp);
});

videoAssetList.addEventListener("click", async (event) => {
  const importButton = event.target.closest("[data-import-fixture]");
  if (importButton) {
    await importFixtureAsset();
    return;
  }
  const assetButton = event.target.closest("[data-add-video-asset]");
  if (!assetButton) return;
  await addTimelineItem({
    itemType: "video",
    sourceAssetId: assetButton.dataset.addVideoAsset,
    startMs: 0,
    endMs: 3000,
    properties: { label: assetButton.textContent.trim() },
  });
});

document.querySelector(".tool-panel").addEventListener("click", async (event) => {
  const catalog = event.target.closest("[data-catalog-type]");
  if (catalog) {
    await addTimelineItem({
      catalogType: catalog.dataset.catalogType,
      catalogId: catalog.dataset.catalogId,
      startMs: 0,
      endMs: 2000,
    });
    return;
  }
  const textButton = event.target.closest("[data-add-text]");
  if (textButton) {
    await addTimelineItem({
      itemType: "text",
      startMs: 0,
      endMs: 2500,
      properties: { text: "新的文本片段" },
    });
    return;
  }
  const subtitleButton = event.target.closest("[data-add-subtitle]");
  if (subtitleButton) {
    await addTimelineItem({
      itemType: "subtitle",
      startMs: 0,
      endMs: 6000,
      properties: { text: "第一句来了。第二句继续。" },
    });
  }
});

subtitleEditor.addEventListener("change", async (event) => {
  const textarea = event.target.closest("[data-edit-item]");
  if (!textarea) return;
  await updateTimelineItem(textarea.dataset.editItem, { text: textarea.value });
});

timeline.addEventListener("click", async (event) => {
  const clip = event.target.closest("[data-item-id]");
  if (!clip) return;
  await deleteTimelineItem(clip.dataset.itemId);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.dataset.closeModal));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-page.active").forEach((modal) => {
      closeModal(modal.id);
    });
  }
});

window.addEventListener("hashchange", () => {
  const route = parseRoute();
  setActiveView(route.viewName, { updateRoute: false, projectId: route.projectId });
});

async function initialize() {
  await loadBootstrap();
  await ensureJianyingStyle();
  const route = parseRoute();
  setActiveView(route.viewName, { updateRoute: !window.location.hash, projectId: route.projectId });
  window.__automediaReady = true;
}

initialize();
