import { accessSync, constants, mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createStaticServer } from "./serve.mjs";

const host = "127.0.0.1";
const port = Number(process.env.AUTOMEDIA_PORT || 4173);
const chromePort = Number(process.env.AUTOMEDIA_CHROME_PORT || 9333);
const baseUrl = `http://${host}:${port}`;

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForServer(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    function tryRequest() {
      const req = request(url, (response) => {
        response.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) {
          reject(new Error(`Server did not start at ${url}`));
          return;
        }
        setTimeout(tryRequest, 100);
      });
      req.end();
    }

    tryRequest();
  });
}

async function fetchJson(url, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      await sleep(100);
    }
  }

  throw new Error(`Could not fetch ${url}`);
}

function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error("Chrome/Chromium not found. Set CHROME_PATH to a Chrome executable.");
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });

    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data.toString());
      if (!message.id || !this.pending.has(message.id)) {
        return;
      }
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result || {});
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;

    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.ws?.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    const details = result.exceptionDetails;
    const description = details.exception?.description || details.exception?.value || details.text;
    throw new Error(description || "Runtime evaluation failed");
  }

  return result.result?.value;
}

async function waitForCondition(cdp, expression, label, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) {
      return;
    }
    await sleep(75);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitForCondition(cdp, "document.readyState === 'complete'", `load ${url}`);
  await waitForCondition(cdp, "Boolean(window.__automediaReady)", "AutoMedia app ready");
}

async function click(cdp, selector) {
  const selectorLiteral = JSON.stringify(selector);
  const messageLiteral = JSON.stringify(`Missing selector: ${selector}`);
  await evaluate(
    cdp,
    `(() => {
      const element = document.querySelector(${selectorLiteral});
      if (!element) throw new Error(${messageLiteral});
      element.click();
      return true;
    })()`,
  );
  await sleep(100);
}

async function readState(cdp) {
  return evaluate(
    cdp,
    `(() => {
      const byId = (id) => document.querySelector(id);
      const visible = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
      };
      const allVisible = (selector) => Array.from(document.querySelectorAll(selector)).map((element) => {
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0;
      });
      const labels = (selector) => Array.from(document.querySelectorAll(selector)).map((element) => element.textContent.trim());

      return {
        hash: window.location.hash,
        activeView: document.querySelector(".app-shell")?.dataset.activeView,
        active: {
          home: byId("#homeView")?.classList.contains("active"),
          editor: byId("#editorView")?.classList.contains("active"),
          publishing: byId("#publishingView")?.classList.contains("active"),
          styles: byId("#styleManagerView")?.classList.contains("active"),
        },
        sidebarVisible: visible(".sidebar"),
        navHomeVisible: visible('[data-testid="nav-home"]'),
        navEditorVisible: visible('[data-testid="nav-editor"]'),
        navPublishingVisible: visible('[data-testid="nav-publishing"]'),
        styleMemoryVisible: visible(".style-memory"),
        editorOnlyVisible: allVisible(".topbar .editor-only"),
        editorAriaExpanded: document.querySelector("#editorNav")?.getAttribute("aria-expanded"),
        titleValue: document.querySelector("#pageTitleInput")?.value,
        homeModules: {
          recent: Boolean(document.querySelector('[data-testid="home-recent"]')),
          newVideo: Boolean(document.querySelector('[data-testid="home-new-video"]')),
          styleManagement: Boolean(document.querySelector('[data-testid="home-style-management"]')),
          platformAnalytics: Boolean(document.querySelector('[data-testid="home-platform-analytics"]')),
          comments: Boolean(document.querySelector('[data-testid="home-comments"]')),
        },
        editorTabs: labels(".edit-tabs .tab"),
        publishingTabs: labels(".publishing-layout .tab-strip .tab"),
        newVideoModalOpen: document.querySelector("#newVideoModal")?.classList.contains("active"),
        toast: document.querySelector("#toast")?.textContent.trim(),
      };
    })()`,
  );
}

function expectHome(state, label) {
  assert(state.activeView === "home", `${label}: active view marker should be home`);
  assert(state.active.home && !state.active.editor && !state.active.publishing && !state.active.styles, `${label}: only Home view should be active`);
  assert(!state.sidebarVisible, `${label}: sidebar should be hidden`);
  assert(state.editorOnlyVisible.length === 5, `${label}: should have exactly five editor-only actions`);
  assert(state.editorOnlyVisible.every((value) => !value), `${label}: editor-only actions should be hidden`);
  assert(state.titleValue === "AutoMedia 工作台", `${label}: title should be AutoMedia 工作台`);
  assert(Object.values(state.homeModules).every(Boolean), `${label}: all five Home modules should be present`);
}

function expectEditor(state, label) {
  const expectedTabs = ["添加视频", "特效", "音效", "字幕", "背景音", "文本", "贴纸", "转场"];
  assert(state.activeView === "editor", `${label}: active view marker should be editor`);
  assert(state.active.editor && !state.active.home && !state.active.publishing && !state.active.styles, `${label}: only Editor view should be active`);
  assert(state.sidebarVisible, `${label}: sidebar should be visible`);
  assert(state.editorOnlyVisible.length === 5, `${label}: should have exactly five editor-only actions`);
  assert(state.editorOnlyVisible.every(Boolean), `${label}: editor-only actions should be visible`);
  assert(state.editorAriaExpanded === "true", `${label}: editor nav should be expanded`);
  assert(expectedTabs.every((tab) => state.editorTabs.includes(tab)), `${label}: editor should retain all eight tabs`);
}

function expectPublishing(state, label) {
  const expectedTabs = ["标题推荐", "封面设计", "平台选择", "定时发布"];
  assert(state.activeView === "publishing", `${label}: active view marker should be publishing`);
  assert(state.active.publishing && !state.active.home && !state.active.editor && !state.active.styles, `${label}: only Publishing view should be active`);
  assert(state.sidebarVisible, `${label}: sidebar should be visible`);
  assert(state.editorOnlyVisible.length === 5, `${label}: should have exactly five editor-only actions`);
  assert(state.editorOnlyVisible.every((value) => !value), `${label}: editor-only actions should be hidden`);
  assert(expectedTabs.every((tab) => state.publishingTabs.includes(tab)), `${label}: publishing should retain all four tabs`);
}

function expectStyles(state, label) {
  assert(state.activeView === "styles", `${label}: active view marker should be styles`);
  assert(state.active.styles && !state.active.home && !state.active.editor && !state.active.publishing, `${label}: only Style Manager view should be active`);
  assert(state.sidebarVisible, `${label}: sidebar should be visible`);
  assert(state.navHomeVisible, `${label}: Home nav should be visible`);
  assert(!state.navEditorVisible, `${label}: Editor nav should be hidden`);
  assert(!state.navPublishingVisible, `${label}: Publishing nav should be hidden`);
  assert(!state.styleMemoryVisible, `${label}: Style Memory should be hidden`);
  assert(state.editorOnlyVisible.length === 5, `${label}: should have exactly five editor-only actions`);
  assert(state.editorOnlyVisible.every((value) => !value), `${label}: editor-only actions should be hidden`);
}

async function main() {
  const server = createStaticServer();
  const userDataDir = mkdtempSync(join(tmpdir(), "automedia-chrome-"));
  let chrome;
  let cdp;

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, resolve);
    });
    await waitForServer(`${baseUrl}/`);

    const chromePath = findChrome();
    chrome = spawn(chromePath, [
      "--headless=new",
      `--remote-debugging-port=${chromePort}`,
      `--user-data-dir=${userDataDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ], { stdio: "ignore" });

    const targets = await fetchJson(`http://${host}:${chromePort}/json/list`);
    const pageTarget = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
    assert(pageTarget, "Could not find a Chrome page target for CDP verification");
    cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    await navigate(cdp, `${baseUrl}/`);
    let state = await readState(cdp);
    expectHome(state, "C1 open /");
    assert(state.hash === "#/home", "C1 open /: route should normalize to #/home");

    await navigate(cdp, `${baseUrl}/#/editor`);
    state = await readState(cdp);
    expectEditor(state, "C2 open #/editor");
    assert(state.hash === "#/editor", "C2 open #/editor: route should remain #/editor");

    await click(cdp, '[data-testid="nav-home"]');
    await waitForCondition(cdp, "window.location.hash === '#/home'", "Home click route");
    state = await readState(cdp);
    expectHome(state, "C3 click Home from Editor");

    await navigate(cdp, `${baseUrl}/#/editor`);
    await click(cdp, '[data-testid="nav-publishing"]');
    await waitForCondition(cdp, "window.location.hash === '#/publishing'", "Publishing click route");
    state = await readState(cdp);
    expectPublishing(state, "C4 click Video Publishing from Editor");

    await navigate(cdp, `${baseUrl}/#/styles`);
    state = await readState(cdp);
    expectStyles(state, "C5 open #/styles");
    assert(state.hash === "#/styles", "C5 open #/styles: route should remain #/styles");

    await navigate(cdp, `${baseUrl}/#/unknown`);
    await waitForCondition(cdp, "window.location.hash === '#/home'", "unknown hash fallback");
    state = await readState(cdp);
    expectHome(state, "C6 unknown hash fallback");

    for (const [route, expectation, label] of [
      ["/", expectHome, "C7 reload /"],
      ["/#/editor", expectEditor, "C7 reload #/editor"],
      ["/#/publishing", expectPublishing, "C7 reload #/publishing"],
      ["/#/styles", expectStyles, "C7 reload #/styles"],
    ]) {
      await navigate(cdp, `${baseUrl}${route}`);
      await cdp.send("Page.reload", { ignoreCache: true });
      await waitForCondition(cdp, "document.readyState === 'complete' && Boolean(window.__automediaReady)", `${label} complete`);
      state = await readState(cdp);
      expectation(state, label);
    }

    await navigate(cdp, `${baseUrl}/`);
    await click(cdp, '[data-testid="recent-card"]');
    await waitForCondition(cdp, "window.location.hash === '#/editor'", "recent card route");
    state = await readState(cdp);
    expectEditor(state, "C8 recent card opens Editor");

    await navigate(cdp, `${baseUrl}/`);
    await click(cdp, "#openNewVideo");
    state = await readState(cdp);
    assert(state.newVideoModalOpen, "C9 new video modal should open");
    await click(cdp, "#confirmNewVideo");
    await waitForCondition(cdp, "window.location.hash === '#/editor'", "new video confirm route");
    state = await readState(cdp);
    expectEditor(state, "C9 new video confirm opens Editor");
    assert(state.toast.includes("已创建新视频"), "C9 new video confirm should show success toast");

    await navigate(cdp, `${baseUrl}/`);
    await click(cdp, "#openStyleManager");
    await waitForCondition(cdp, "window.location.hash === '#/styles'", "style manager route");
    state = await readState(cdp);
    expectStyles(state, "C10 style manager entry");

    await click(cdp, '[data-testid="nav-home"]');
    await waitForCondition(cdp, "window.location.hash === '#/home'", "style manager Home route");
    state = await readState(cdp);
    expectHome(state, "C11 style manager Home nav");

    console.log("AutoMedia M0 browser verification passed.");
  } finally {
    cdp?.close();
    if (chrome && !chrome.killed) {
      chrome.kill();
      await new Promise((resolve) => {
        chrome.once("exit", resolve);
        setTimeout(resolve, 1000);
      });
    }
    await new Promise((resolve) => server.close(resolve));
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // Chrome can briefly keep profile files open after process exit; this should not fail M0 validation.
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
