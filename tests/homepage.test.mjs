import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("homepage links and labels the CLR runtime as IronRust", () => {
  const legacyRepo = ["rustscript", "clr", "vm"].join("-");
  const legacyProjectLabel = ["clr", "vm"].join(" ");
  const legacyExampleLabel = ["CLR", "WinForms"].join(" / ");

  assert.match(html, /https:\/\/github\.com\/rustscript-lang\/IronRust/);
  assert.match(html, /<strong>IronRust<\/strong>/);
  assert.match(html, /label: "IronRust \/ WinForms"/);
  assert.equal(html.includes(legacyRepo), false);
  assert.equal(html.includes(`<strong>${legacyProjectLabel}</strong>`), false);
  assert.equal(html.includes(legacyExampleLabel), false);
});

test("homepage includes a concise flint LLM inference example", () => {
  assert.match(html, /file: "llm\.rss"/);
  assert.match(html, /label: "LLM Inference"/);
  assert.match(html, /use flint::llama as llama;/);
  assert.match(html, /llama::model_load/);
  assert.match(html, /llama::context_decode/);
  assert.match(html, /llama::sampler_sample/);
  assert.doesNotMatch(html, /'flint::llama::/);
});

test("outer example slot reserves the tallest panel without stretching the visible card", () => {
  assert.match(html, /class="hero-example-slot"/);
  assert.match(html, /class="hero-card"[^>]*id="hero-example"/);
  assert.match(html, /<pre class="rss-code"><code id="example-code"><\/code><\/pre>/);
  assert.match(html, /class="hero-card hero-card-size-probe"[^>]*aria-hidden="true"/);
  assert.match(html, /id="example-code-stack"/);
  assert.match(html, /const codeEl = document\.getElementById\("example-code"\)/);
  assert.match(html, /const codeStackEl = document\.getElementById\("example-code-stack"\)/);
  assert.match(html, /panel\.className = "rss-code example-code-panel"/);
  assert.match(html, /codeEl\.innerHTML = highlight\(ex\.code\)/);
  assert.match(css, /\.hero-example-slot\s*\{[^}]*display:\s*grid;/s);
  assert.match(css, /\.hero-card\s*\{[^}]*grid-area:\s*1\s*\/\s*1;[^}]*align-self:\s*start;/s);
  assert.match(css, /\.hero-card-size-probe\s*\{[^}]*grid-area:\s*1\s*\/\s*1;[^}]*visibility:\s*hidden;/s);
  assert.match(css, /\.example-code-stack\s*\{[^}]*display:\s*grid;/s);
  assert.match(css, /\.example-code-panel\s*\{[^}]*grid-area:\s*1\s*\/\s*1;[^}]*visibility:\s*hidden;/s);
  assert.doesNotMatch(html, /panels\.forEach\(\(panel, i\)/);
  assert.match(css, /pre\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
});

test("each example exposes its matching GitHub destination from the lower-right action", () => {
  const examples = [
    ["proxy.rss", "Programmable Edge", "https://github.com/rustscript-lang/pd-edge"],
    ["damage.rss", "Game Behaviour", "https://github.com/rustscript-lang/rustscript-bevy-gameplay"],
    ["policy.rss", "Gateway Scripting", "https://github.com/rustscript-lang/rustscript-pingora-gateway"],
    ["llm.rss", "LLM Inference", "https://github.com/rustscript-lang/flint"],
    ["winforms.rss", "IronRust / WinForms", "https://github.com/rustscript-lang/IronRust"],
    ["blinky.rss", "Embedded", "https://github.com/rustscript-lang/micro-rustscript"],
  ];

  for (const [file, label, repo] of examples) {
    const pattern = [file, label, repo]
      .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join('[\\s\\S]*?');
    assert.match(html, new RegExp(pattern));
  }
  assert.match(html, /id="example-jump-link"/);
  assert.match(html, /exampleJumpLink\.href = ex\.repo/);
  assert.match(html, /exampleJumpLink\.setAttribute\("aria-label", `Open \$\{ex\.label\} on GitHub`\)/);
  assert.match(css, /\.example-jump-link\s*\{[^}]*margin-left:\s*auto;/s);
  assert.match(css, /\.example-jump-link\s*\{[^}]*\bborder:\s*0;/s);
  assert.match(css, /\.example-jump-link\s*\{[^}]*\bbackground:\s*transparent;/s);
  assert.doesNotMatch(css, /\.example-jump-link:hover\s*\{[^}]*\bborder(?:-color)?:/s);
  assert.doesNotMatch(css, /\.example-jump-link:hover\s*\{[^}]*\bbackground:/s);
});

test("carousel pauses while focus or pointer interaction could activate the mutable jump link", () => {
  assert.match(html, /const exampleSlotEl = document\.querySelector\("\.hero-example-slot"\)/);
  assert.match(html, /const pauseReasons = new Set\(\)/);
  assert.match(html, /let renderedIndex = -1/);
  assert.match(html, /function pauseAutoRotation\(reason\)[\s\S]*?clearTimeout\(transitionTimer\)[\s\S]*?current = renderedIndex/);
  assert.match(html, /function resumeAutoRotation\(reason\)/);
  assert.match(html, /exampleSlotEl\.addEventListener\("focusin",/);
  assert.match(html, /exampleSlotEl\.addEventListener\("focusout",/);
  assert.match(html, /exampleSlotEl\.addEventListener\("pointerenter",/);
  assert.match(html, /exampleSlotEl\.addEventListener\("pointerleave",/);
});
