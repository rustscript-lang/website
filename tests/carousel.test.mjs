import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Window } from "happy-dom";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const carouselScript = inlineScripts.at(-1)?.[1];

function createCarouselPage() {
  assert.ok(carouselScript, "homepage carousel script must exist");

  const window = new Window({ url: "https://rustscript.org/" });
  const documentHtml = html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, "");
  window.document.write(documentHtml);

  let timerId = 0;
  const intervals = new Map();
  const timeouts = new Map();

  window.setInterval = (callback, delay) => {
    const id = ++timerId;
    intervals.set(id, { callback, delay });
    return id;
  };
  window.clearInterval = (id) => intervals.delete(id);
  window.setTimeout = (callback, delay) => {
    const id = ++timerId;
    timeouts.set(id, { callback, delay });
    return id;
  };
  window.clearTimeout = (id) => timeouts.delete(id);
  window.requestAnimationFrame = (callback) => {
    callback(0);
    return ++timerId;
  };
  window.matchMedia = () => ({ matches: false });
  window.Math = Object.create(globalThis.Math);
  window.Math.random = () => 0;

  const execute = new Function(
    "window",
    "document",
    "Math",
    "setInterval",
    "clearInterval",
    "setTimeout",
    "clearTimeout",
    "requestAnimationFrame",
    carouselScript,
  );
  execute(
    window,
    window.document,
    window.Math,
    window.setInterval,
    window.clearInterval,
    window.setTimeout,
    window.clearTimeout,
    window.requestAnimationFrame,
  );

  return {
    window,
    intervals,
    timeouts,
    fireIntervals() {
      for (const { callback } of [...intervals.values()]) callback();
    },
    flushTimeouts() {
      while (timeouts.size > 0) {
        const pending = [...timeouts.values()];
        timeouts.clear();
        for (const { callback } of pending) callback();
      }
    },
  };
}

const examples = [
  ["proxy.rss", "Programmable Edge", "https://github.com/rustscript-lang/pd-edge"],
  ["damage.rss", "Game Behaviour", "https://github.com/rustscript-lang/rustscript-bevy-gameplay"],
  ["policy.rss", "Gateway Scripting", "https://github.com/rustscript-lang/rustscript-pingora-gateway"],
  ["llm.rss", "LLM Inference", "https://github.com/rustscript-lang/flint"],
  ["winforms.rss", "IronRust / WinForms", "https://github.com/rustscript-lang/IronRust"],
  ["blinky.rss", "Embedded", "https://github.com/rustscript-lang/micro-rustscript"],
];

test("WinForms carousel uses direct RSS callable event handlers", () => {
  const page = createCarouselPage();
  const buttons = [...page.window.document.querySelectorAll(".example-dot")];

  buttons[4].click();
  page.flushTimeouts();
  const code = page.window.document.getElementById("example-code").textContent;

  for (const expected of [
    "fn on_close() -> null",
    "Ui::BindClosing(form, || on_close())",
    "Ui::Show(form)",
  ]) {
    assert.ok(code.includes(expected), `WinForms carousel missing ${expected}`);
  }
  for (const retired of ["Ui::Ui", "Ui::Wait", "dispatcher"]) {
    assert.equal(code.includes(retired), false, `WinForms carousel still contains ${retired}`);
  }

  page.window.close();
});

test("carousel renders each example with its exact hardened GitHub action", () => {
  const page = createCarouselPage();
  const { document } = page.window;
  const buttons = [...document.querySelectorAll(".example-dot")];
  const link = document.getElementById("example-jump-link");

  assert.equal(buttons.length, examples.length);
  assert.equal(link.target, "_blank");
  assert.deepEqual(new Set(link.rel.split(/\s+/)), new Set(["noopener", "noreferrer"]));

  examples.forEach(([file, label, repo], index) => {
    buttons[index].click();
    page.flushTimeouts();

    assert.equal(document.getElementById("example-filename").textContent, file);
    assert.equal(link.href, repo);
    assert.equal(link.getAttribute("aria-label"), `Open ${label} on GitHub`);
    assert.equal(document.getElementById("example-code").textContent.length > 0, true);
    assert.equal(buttons.filter((button) => button.getAttribute("aria-current") === "true").length, 1);
    assert.equal(buttons[index].getAttribute("aria-current"), "true");
  });

  page.window.close();
});

test("focus and pointer pauses cancel pending rotation and resume after the final reason leaves", () => {
  const page = createCarouselPage();
  const { document, Event } = page.window;
  const slot = document.querySelector(".hero-example-slot");
  const card = document.getElementById("hero-example");
  const link = document.getElementById("example-jump-link");
  const initialHref = link.href;
  const initialFile = document.getElementById("example-filename").textContent;

  assert.equal(page.intervals.size, 1);
  page.fireIntervals();
  assert.equal(page.timeouts.size, 1);
  assert.equal(card.classList.contains("is-changing"), true);

  link.focus();
  assert.equal(page.intervals.size, 0);
  assert.equal(page.timeouts.size, 0);
  assert.equal(card.classList.contains("is-changing"), false);
  page.flushTimeouts();
  assert.equal(link.href, initialHref);
  assert.equal(document.getElementById("example-filename").textContent, initialFile);

  slot.dispatchEvent(new Event("pointerenter"));
  link.blur();
  assert.equal(page.intervals.size, 0, "pointer pause must survive focus leaving");

  slot.dispatchEvent(new Event("pointerleave"));
  assert.equal(page.intervals.size, 1, "rotation resumes after the final pause reason leaves");
  page.fireIntervals();
  page.flushTimeouts();
  assert.equal(link.href, examples[1][2]);
  assert.equal(document.getElementById("example-filename").textContent, examples[1][0]);

  page.window.close();
});
