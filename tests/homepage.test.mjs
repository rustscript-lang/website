import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("homepage links and labels the CLR runtime as IronRust", () => {
  assert.match(html, /https:\/\/github\.com\/rustscript-lang\/IronRust/);
  assert.match(html, /<strong>IronRust<\/strong>/);
  assert.match(html, /label: "IronRust \/ WinForms"/);
  assert.doesNotMatch(html, /rustscript-clr-vm|<strong>clr vm<\/strong>|CLR \/ WinForms/);
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

test("example slot reserves the tallest code panel across carousel changes", () => {
  assert.match(html, /class="hero-example-slot"/);
  assert.match(html, /id="example-code-stack"/);
  assert.match(html, /const codeStackEl = document\.getElementById\("example-code-stack"\)/);
  assert.match(html, /panel\.className = "rss-code example-code-panel"/);
  assert.match(css, /\.example-code-stack\s*\{[^}]*display:\s*grid;/s);
  assert.match(css, /\.example-code-panel\s*\{[^}]*grid-area:\s*1\s*\/\s*1;[^}]*visibility:\s*hidden;/s);
  assert.match(css, /\.example-code-panel\.is-active\s*\{[^}]*visibility:\s*visible;[^}]*pointer-events:\s*auto;/s);
  assert.doesNotMatch(css, /\.example-code-panel\s*\{[^}]*display:\s*none;/s);
  assert.match(css, /pre\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
});
