import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Window } from "happy-dom";

const script = readFileSync(new URL("../src/mermaid-init.js", import.meta.url), "utf8");

async function createDiagramPage() {
  const window = new Window({ url: "https://rustscript.org/docs/reference/pd-edge/full-dag/" });
  window.document.write('<!doctype html><html data-theme="light"><body><div class="mermaid" role="img" aria-label="Mermaid diagram"><svg id="diagram-root" viewBox="0 0 800 500"><g><rect width="800" height="500"></rect></g></svg></div></body></html>');
  let initOptions;
  window.mermaid = {
    initialize(options) { initOptions = options; },
    run: async () => {},
  };

  const execute = new Function("window", "document", "console", script);
  execute(window, window.document, console);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await Promise.resolve();
  await Promise.resolve();

  return { window, host: window.document.querySelector(".mermaid"), initOptions };
}

function pointer(window, type, { button = 0, clientX, clientY }) {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, { button: { value: button }, clientX: { value: clientX }, clientY: { value: clientY }, pointerId: { value: 1 } });
  return event;
}

test("Mermaid diagrams stay static inline and open a vector lightbox", async () => {
  const { window, host, initOptions } = await createDiagramPage();
  const inlineSvg = host.querySelector("svg");
  const expand = host.querySelector("[data-mermaid-expand]");

  assert.equal(initOptions.flowchart.htmlLabels, false);

  assert.ok(expand);
  assert.equal(host.querySelector(".mermaid-viewport"), null);
  assert.equal(inlineSvg.style.transform, "");

  expand.click();
  const lightbox = window.document.querySelector("[data-mermaid-lightbox]");
  const viewport = lightbox?.querySelector(".mermaid-lightbox-viewport");
  const lightboxSvg = viewport?.querySelector("svg");

  assert.ok(lightbox);
  assert.equal(lightbox.getAttribute("role"), "dialog");
  assert.ok(viewport);
  assert.ok(lightboxSvg);
  assert.notEqual(lightboxSvg, inlineSvg);
  assert.equal(inlineSvg.id, "diagram-root");
  assert.notEqual(lightboxSvg.id, inlineSvg.id);
  assert.equal(new Set([...window.document.querySelectorAll("[id]")].map((element) => element.id)).size, window.document.querySelectorAll("[id]").length);
  assert.equal(lightboxSvg.getAttribute("viewBox"), "0 0 800 500");
  assert.equal(window.document.body.style.overflow, "hidden");

  viewport.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 250 });
  const wheel = new window.Event("wheel", { bubbles: true, cancelable: true });
  Object.defineProperties(wheel, { clientX: { value: 200 }, clientY: { value: 125 }, deltaY: { value: -180 } });
  viewport.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented, true);
  assert.notEqual(lightboxSvg.getAttribute("viewBox"), "0 0 800 500");
  assert.notEqual(lightbox.querySelector("[data-mermaid-zoom-value]").textContent, "100%");

  const zoomedViewBox = lightboxSvg.getAttribute("viewBox");
  viewport.dispatchEvent(pointer(window, "pointerdown", { clientX: 80, clientY: 60 }));
  viewport.dispatchEvent(pointer(window, "pointermove", { clientX: 130, clientY: 95 }));
  viewport.dispatchEvent(pointer(window, "pointerup", { clientX: 130, clientY: 95 }));
  assert.notEqual(lightboxSvg.getAttribute("viewBox"), zoomedViewBox);

  lightbox.querySelector("[data-mermaid-zoom-reset]").click();
  assert.equal(lightboxSvg.getAttribute("viewBox"), "0 0 800 500");
  assert.equal(lightbox.querySelector("[data-mermaid-zoom-value]").textContent, "100%");

  lightbox.querySelector("[data-mermaid-close]").click();
  assert.equal(window.document.querySelector("[data-mermaid-lightbox]"), null);
  assert.equal(window.document.body.style.overflow, "");

  window.close();
});
