import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Window } from "happy-dom";

const script = readFileSync(new URL("../src/mermaid-init.js", import.meta.url), "utf8");

async function createDiagramPage() {
  const window = new Window({ url: "https://rustscript.org/docs/reference/pd-edge/full-dag/" });
  window.document.write('<!doctype html><html data-theme="light"><body><div class="mermaid" role="img" aria-label="Mermaid diagram"><svg viewBox="0 0 800 500"></svg></div></body></html>');
  window.mermaid = {
    initialize() {},
    run: async () => {},
  };

  const execute = new Function("window", "document", "console", script);
  execute(window, window.document, console);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await Promise.resolve();
  await Promise.resolve();

  const viewport = window.document.querySelector(".mermaid-viewport");
  return { window, viewport, host: window.document.querySelector(".mermaid") };
}

test("Mermaid diagrams support wheel zoom, pointer panning, and reset", async () => {
  const { window, viewport, host } = await createDiagramPage();
  const svg = host.querySelector("svg");
  const reset = host.querySelector("[data-mermaid-zoom-reset]");

  assert.ok(viewport);
  viewport.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300 });
  assert.ok(reset);
  assert.equal(host.querySelector("[data-mermaid-zoom-value]").textContent, "100%");

  const wheel = new window.Event("wheel", { bubbles: true, cancelable: true });
  Object.defineProperties(wheel, { clientX: { value: 0 }, clientY: { value: 0 }, deltaY: { value: -180 } });
  viewport.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented, true);
  assert.match(svg.style.transform, /scale\(1\.[0-9]+\)/);
  assert.notEqual(host.querySelector("[data-mermaid-zoom-value]").textContent, "100%");

  const pointer = (type, { button = 0, clientX, clientY }) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, { button: { value: button }, clientX: { value: clientX }, clientY: { value: clientY }, pointerId: { value: 1 } });
    return event;
  };
  viewport.dispatchEvent(pointer("pointerdown", { clientX: 80, clientY: 60 }));
  viewport.dispatchEvent(pointer("pointermove", { clientX: 130, clientY: 95 }));
  viewport.dispatchEvent(pointer("pointerup", { clientX: 130, clientY: 95 }));
  assert.match(svg.style.transform, /translate\(50px, 35px\)/);

  reset.click();
  assert.equal(svg.style.transform, "translate(0px, 0px) scale(1)");
  assert.equal(host.querySelector("[data-mermaid-zoom-value]").textContent, "100%");

  window.close();
});
