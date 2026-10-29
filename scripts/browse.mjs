/**
 * Look at a page on the dev server in a headless Chrome: screenshots, a script
 * run in the page, and the page's console errors.
 *
 * This is how sessions check their work, instead of Claude in Chrome. That
 * drives Nolan's real browser and stops to ask before every action; this runs
 * as a plain `node` command, which is pre-approved, and touches nothing of his.
 * No dependencies: it talks to Chrome's DevTools protocol over Node's own
 * WebSocket.
 *
 *   node scripts/browse.mjs advisor --selector "#problem-heading" --out shot.png
 *   node scripts/browse.mjs advisor --eval "document.title"
 *   node scripts/browse.mjs advisor --selector figure --frames 6 --every 1500 --out f.png
 *
 * Options
 *   --size WxH        viewport, default 1440x900
 *   --scale N         device pixel ratio, default 1; 2 for retina-sharp shots
 *   --selector CSS    scroll this element to the middle of the viewport first;
 *                     screenshots then crop to it
 *   --wait MS         settle time after load and scroll, default 800
 *   --eval JS         evaluated in the page (top-level await works) and printed
 *                     as JSON; with --frames it runs before every frame
 *   --out PATH        save a PNG screenshot
 *   --full            screenshot the whole page rather than the viewport
 *   --frames N        repeat --eval and the screenshot N times, saving
 *                     PATH-1.png ... PATH-N.png
 *   --every MS        gap between frames, default 1000
 *   --reduced-motion  emulate prefers-reduced-motion: reduce
 *
 * Anything that is not a full URL is a path on http://localhost:3000; leave
 * off the leading slash ("advisor", or "." for home), since Git Bash rewrites
 * /advisor into a file path.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    size: { type: "string", default: "1440x900" },
    scale: { type: "string", default: "1" },
    selector: { type: "string" },
    wait: { type: "string", default: "800" },
    eval: { type: "string" },
    out: { type: "string" },
    full: { type: "boolean", default: false },
    frames: { type: "string", default: "1" },
    every: { type: "string", default: "1000" },
    "reduced-motion": { type: "boolean", default: false },
  },
});

const target = positionals[0];
if (!target) {
  console.error("Usage: node scripts/browse.mjs <url or path> [options]");
  process.exit(2);
}
// Git Bash rewrites a leading-slash argument such as /advisor into a file
// path under its install folder before Node ever sees it.
if (/^[a-z]:[\\/]/i.test(target)) {
  console.error(`Got a file path (${target}). Pass the page without its leading slash, e.g. "advisor", or a full URL.`);
  process.exit(2);
}
const url = /^https?:\/\//.test(target)
  ? target
  : `http://localhost:3000/${target.replace(/^\.?\/?/, "")}`;
const [width, height] = opts.size.split("x").map(Number);
const frames = Number(opts.frames);

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((path) => path && existsSync(path));
if (!CHROME) {
  console.error("Chrome not found. Set CHROME_PATH.");
  process.exit(2);
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function within(ms, promise, what) {
  return Promise.race([
    promise,
    sleep(ms).then(() => {
      throw new Error(`Timed out after ${ms}ms waiting for ${what}`);
    }),
  ]);
}

/** A minimal DevTools protocol client over one WebSocket. */
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();
  let id = 0;

  ws.addEventListener("message", ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) {
      const call = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) call.reject(new Error(`${call.method}: ${msg.error.message}`));
      else call.resolve(msg.result);
    } else {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  });
  await new Promise((done, fail) => {
    ws.addEventListener("open", done, { once: true });
    ws.addEventListener("error", fail, { once: true });
  });

  return {
    send(method, params = {}) {
      const n = ++id;
      ws.send(JSON.stringify({ id: n, method, params }));
      return new Promise((resolve, reject) =>
        pending.set(n, { method, resolve, reject }),
      );
    },
    on(method, fn) {
      listeners.set(method, [...(listeners.get(method) ?? []), fn]);
    },
    once(method) {
      return new Promise((done) => this.on(method, done));
    },
    close: () => ws.close(),
  };
}

const profile = await mkdtemp(join(tmpdir(), "browse-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--mute-audio",
    `--window-size=${width},${height}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);
const exited = new Promise((done) => chrome.once("exit", done));

let browser;
let failed = false;
try {
  // Chrome writes the port it picked, and the browser endpoint, here.
  let port;
  let browserPath;
  for (let i = 0; i < 150 && !port; i++) {
    try {
      [port, browserPath] = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).split("\n");
    } catch {
      await sleep(100);
    }
  }
  if (!port) throw new Error("Chrome did not start");
  browser = await connect(`ws://127.0.0.1:${port}${browserPath.trim()}`);

  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = await connect(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);

  const problems = [];
  page.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type === "error" || type === "warning") {
      problems.push(`${type}: ${args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
    }
  });
  page.on("Runtime.exceptionThrown", ({ exceptionDetails: d }) => {
    problems.push(`exception: ${d.exception?.description ?? d.text}`);
  });
  page.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error") problems.push(`${entry.source}: ${entry.text} ${entry.url ?? ""}`.trim());
  });
  await Promise.all([page.send("Page.enable"), page.send("Runtime.enable"), page.send("Log.enable")]);

  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: Number(opts.scale),
    mobile: false,
  });
  if (opts["reduced-motion"]) {
    await page.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
  }

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await page.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      replMode: true,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return result.value;
  };

  console.log(`${url}  ${width}x${height}`);
  const loaded = page.once("Page.loadEventFired");
  await page.send("Page.navigate", { url });
  await within(60000, loaded, "page load");

  if (opts.selector) {
    const found = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(opts.selector)});
      if (!el) return false;
      el.scrollIntoView({ block: "center", behavior: "instant" });
      return true;
    })()`);
    if (!found) throw new Error(`No element matches ${opts.selector}`);
  }
  await sleep(Number(opts.wait));

  for (let i = 1; i <= frames; i++) {
    if (i > 1) await sleep(Number(opts.every));
    const tag = frames > 1 ? `[${i}] ` : "";

    if (opts.eval) {
      console.log(`${tag}eval: ${JSON.stringify(await evaluate(opts.eval), null, 2)}`);
    }

    if (opts.out) {
      let clip;
      if (opts.full) {
        const { cssContentSize: s } = await page.send("Page.getLayoutMetrics");
        clip = { x: 0, y: 0, width: s.width, height: s.height, scale: 1 };
      } else if (opts.selector) {
        clip = await evaluate(`(() => {
          const r = document.querySelector(${JSON.stringify(opts.selector)}).getBoundingClientRect();
          return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 1 };
        })()`);
      }
      const { data } = await page.send("Page.captureScreenshot", {
        format: "png",
        ...(clip ? { clip, captureBeyondViewport: true } : {}),
      });
      const file = resolve(frames > 1 ? opts.out.replace(/(\.png)?$/i, `-${i}.png`) : opts.out);
      await writeFile(file, Buffer.from(data, "base64"));
      console.log(`${tag}saved: ${file}`);
    }
  }

  console.log(problems.length ? `console:\n  ${problems.join("\n  ")}` : "console: clean");
  page.close();
} catch (error) {
  failed = true;
  console.error(String(error.message ?? error));
} finally {
  await browser?.send("Browser.close").catch(() => {});
  browser?.close();
  await within(5000, exited, "Chrome to exit").catch(() => chrome.kill());
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
}
process.exit(failed ? 1 : 0);
