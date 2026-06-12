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

const viewLabels = {
  home: ["Home", "AutoMedia 工作台"],
  editor: ["Video Editing", "ADHD 教育实验 vlog 01"],
  publishing: ["Video Publishing", "视频发布准备"],
  styleManager: ["Style Manager", "我的视频风格管理"],
};

function openModal(id) {
  const modal = document.querySelector(`#${id}`);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
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

function setActiveView(viewName) {
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
  currentSection.textContent = viewLabels[viewName][0];
  pageTitleInput.value = viewLabels[viewName][1];

  if (viewName === "editor") {
    editStepDropdown.classList.add("open");
    editorNav.setAttribute("aria-expanded", "true");
  } else {
    editStepDropdown.classList.remove("open");
    editorNav.setAttribute("aria-expanded", "false");
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

sidebarToggle.addEventListener("click", () => {
  appShell.classList.toggle("sidebar-collapsed");
});

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const wasOpen = editStepDropdown.classList.contains("open");
    setActiveView(button.dataset.view);
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

document.querySelectorAll("[data-open-editor]").forEach((button) => {
  button.addEventListener("click", () => setActiveView("editor"));
});

document.querySelector("#openNewVideo").addEventListener("click", () => {
  openModal("newVideoModal");
});

document.querySelector("#confirmNewVideo").addEventListener("click", () => {
  closeModal("newVideoModal");
  setActiveView("editor");
  showToast("已创建新视频，素材和风格已载入剪辑页面。");
});

document.querySelector("#openStyleManager").addEventListener("click", () => {
  setActiveView("styleManager");
});

document.querySelector("#openNewStyle").addEventListener("click", () => {
  openModal("newStyleModal");
});

document.querySelectorAll(".style-card").forEach((card) => {
  card.addEventListener("click", () => {
    const name = card.querySelector("strong").textContent;
    document.querySelector(".style-name-input").value = name;
    openModal("styleDetailModal");
  });
});

document.querySelectorAll("[data-delete-rule]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openModal("deleteConfirmModal");
  });
});

editStepChecks.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    if (!checkbox.checked) {
      openModal("recutConfirmModal");
    }
  });
});

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
  }

  function onUp() {
    timelineDivider.removeEventListener("pointermove", onMove);
    timelineDivider.removeEventListener("pointerup", onUp);
  }

  timelineDivider.addEventListener("pointermove", onMove);
  timelineDivider.addEventListener("pointerup", onUp);
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
