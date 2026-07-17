(() => {
  const MIN_SCALE = 0.35;
  const MAX_SCALE = 3;
  const diagrams = () => [...document.querySelectorAll(".mermaid")];

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const enhance = (host) => {
    if (host.dataset.mermaidInteractive === "true") return;
    const svg = host.querySelector("svg");
    if (!svg) return;

    host.dataset.mermaidInteractive = "true";
    host.classList.add("mermaid-pan-zoom");

    const controls = document.createElement("div");
    controls.className = "mermaid-controls";
    controls.setAttribute("aria-label", "Diagram zoom controls");

    const zoomOut = document.createElement("button");
    zoomOut.type = "button";
    zoomOut.textContent = "−";
    zoomOut.setAttribute("aria-label", "Zoom out");

    const zoomValue = document.createElement("output");
    zoomValue.dataset.mermaidZoomValue = "";
    zoomValue.setAttribute("aria-live", "polite");

    const zoomIn = document.createElement("button");
    zoomIn.type = "button";
    zoomIn.textContent = "+";
    zoomIn.setAttribute("aria-label", "Zoom in");

    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset";
    reset.dataset.mermaidZoomReset = "";
    reset.setAttribute("aria-label", "Reset diagram zoom and position");

    controls.append(zoomOut, zoomValue, zoomIn, reset);

    const viewport = document.createElement("div");
    viewport.className = "mermaid-viewport";
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-label", "Interactive Mermaid diagram. Use the mouse wheel to zoom and drag to pan.");
    viewport.append(svg);
    host.replaceChildren(controls, viewport);

    let scale = 1;
    let x = 0;
    let y = 0;
    let drag = null;

    const render = () => {
      svg.style.transformOrigin = "0 0";
      svg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      zoomValue.textContent = `${Math.round(scale * 100)}%`;
    };
    const setScale = (nextScale, focalX = 0, focalY = 0) => {
      const next = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const ratio = next / scale;
      x = focalX - (focalX - x) * ratio;
      y = focalY - (focalY - y) * ratio;
      scale = next;
      render();
    };
    const resetView = () => {
      scale = 1;
      x = 0;
      y = 0;
      render();
    };

    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      setScale(scale * Math.exp(-event.deltaY * 0.0015), event.clientX - bounds.left, event.clientY - bounds.top);
    }, { passive: false });
    viewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, offsetX: x, offsetY: y };
      viewport.classList.add("is-panning");
      viewport.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!drag) return;
      x = drag.offsetX + event.clientX - drag.x;
      y = drag.offsetY + event.clientY - drag.y;
      render();
    });
    const stopPanning = (event) => {
      if (!drag) return;
      viewport.releasePointerCapture?.(event.pointerId);
      drag = null;
      viewport.classList.remove("is-panning");
    };
    viewport.addEventListener("pointerup", stopPanning);
    viewport.addEventListener("pointercancel", stopPanning);

    zoomOut.addEventListener("click", () => setScale(scale / 1.25));
    zoomIn.addEventListener("click", () => setScale(scale * 1.25));
    reset.addEventListener("click", resetView);
    render();
  };

  const render = async () => {
    const nodes = diagrams();
    if (nodes.length === 0 || !window.mermaid) return;

    const dark = document.documentElement.dataset.theme === "dark";
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "neutral",
      flowchart: { htmlLabels: true, useMaxWidth: true },
    });

    try {
      await window.mermaid.run({ nodes });
      nodes.forEach(enhance);
    } catch (error) {
      console.error("Mermaid diagram rendering failed", error);
      nodes.forEach((node) => node.classList.add("mermaid-render-failed"));
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    void render();
  }
})();
