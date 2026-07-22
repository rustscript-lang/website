(() => {
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 8;
  const diagrams = () => [...document.querySelectorAll(".mermaid")];
  let lightboxSequence = 0;
  let closeActiveLightbox = null;

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const icon = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;

  const createButton = ({ className, label, title = label, content, dataAttribute }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.title = title;
    button.innerHTML = content;
    if (dataAttribute) button.dataset[dataAttribute] = "";
    return button;
  };

  const parseViewBox = (svg) => {
    const values = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
    if (values.length === 4 && values.every(Number.isFinite) && values[2] > 0 && values[3] > 0) {
      return { x: values[0], y: values[1], width: values[2], height: values[3] };
    }
    const width = Number.parseFloat(svg.getAttribute("width")) || 800;
    const height = Number.parseFloat(svg.getAttribute("height")) || 500;
    return { x: 0, y: 0, width, height };
  };

  const rewriteSvgIds = (svg, prefix) => {
    const replacements = new Map();
    [svg, ...svg.querySelectorAll("[id]")].forEach((element) => {
      if (!element.id) return;
      const previous = element.id;
      const next = `${prefix}-${previous}`;
      replacements.set(previous, next);
      element.id = next;
    });
    if (replacements.size === 0) return;

    svg.querySelectorAll("*").forEach((element) => {
      element.getAttributeNames?.().forEach((name) => {
        const value = element.getAttribute(name);
        if (!value) return;
        let next = value;
        replacements.forEach((replacement, previous) => {
          next = next.replaceAll(`url(#${previous})`, `url(#${replacement})`);
          if (next === `#${previous}`) next = `#${replacement}`;
        });
        if (next !== value) element.setAttribute(name, next);
      });
    });
    svg.querySelectorAll("style").forEach((style) => {
      let text = style.textContent || "";
      replacements.forEach((replacement, previous) => {
        text = text.replaceAll(`#${previous}`, `#${replacement}`);
      });
      style.textContent = text;
    });
  };

  const openLightbox = (sourceSvg, opener) => {
    closeActiveLightbox?.();

    const originalBodyOverflow = document.body.style.overflow;
    const original = parseViewBox(sourceSvg);
    let scale = 1;
    let view = { ...original };
    let drag = null;

    const lightbox = document.createElement("div");
    lightbox.className = "mermaid-lightbox";
    lightbox.dataset.mermaidLightbox = "";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Expanded Mermaid diagram");

    const panel = document.createElement("div");
    panel.className = "mermaid-lightbox-panel";

    const toolbar = document.createElement("div");
    toolbar.className = "mermaid-lightbox-toolbar";
    toolbar.setAttribute("aria-label", "Diagram controls");

    const zoomOut = createButton({
      className: "mermaid-lightbox-control",
      label: "Zoom out",
      content: icon('<path d="M5 12h14" />'),
    });
    const zoomValue = document.createElement("output");
    zoomValue.dataset.mermaidZoomValue = "";
    zoomValue.setAttribute("aria-live", "polite");
    const zoomIn = createButton({
      className: "mermaid-lightbox-control",
      label: "Zoom in",
      content: icon('<path d="M12 5v14M5 12h14" />'),
    });
    const reset = createButton({
      className: "mermaid-lightbox-reset",
      label: "Reset diagram zoom and position",
      content: "Reset",
      dataAttribute: "mermaidZoomReset",
    });
    const close = createButton({
      className: "mermaid-lightbox-close",
      label: "Close expanded diagram",
      content: icon('<path d="m6 6 12 12M18 6 6 18" />'),
      dataAttribute: "mermaidClose",
    });
    toolbar.append(zoomOut, zoomValue, zoomIn, reset, close);

    const viewport = document.createElement("div");
    viewport.className = "mermaid-lightbox-viewport";
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-label", "Vector Mermaid diagram. Use the mouse wheel to zoom and drag to pan.");

    const svg = sourceSvg.cloneNode(true);
    svg.classList.add("mermaid-lightbox-svg");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.removeAttribute("style");
    rewriteSvgIds(svg, `mermaid-lightbox-${++lightboxSequence}`);
    viewport.append(svg);
    panel.append(toolbar, viewport);
    lightbox.append(panel);

    const render = () => {
      svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
      zoomValue.textContent = `${Math.round(scale * 100)}%`;
    };
    const setScale = (nextScale, focalX = 0.5, focalY = 0.5) => {
      const next = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const focusSvgX = view.x + view.width * focalX;
      const focusSvgY = view.y + view.height * focalY;
      const nextWidth = original.width / next;
      const nextHeight = original.height / next;
      view = {
        x: focusSvgX - nextWidth * focalX,
        y: focusSvgY - nextHeight * focalY,
        width: nextWidth,
        height: nextHeight,
      };
      scale = next;
      render();
    };
    const resetView = () => {
      scale = 1;
      view = { ...original };
      render();
    };
    const closeLightbox = () => {
      if (!lightbox.isConnected) return;
      document.removeEventListener("keydown", onDocumentKeydown);
      lightbox.remove();
      document.body.style.overflow = originalBodyOverflow;
      closeActiveLightbox = null;
      opener.focus?.();
    };
    const onDocumentKeydown = (event) => {
      if (event.key === "Escape") closeLightbox();
    };

    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const focalX = bounds.width > 0 ? clamp((event.clientX - bounds.left) / bounds.width, 0, 1) : 0.5;
      const focalY = bounds.height > 0 ? clamp((event.clientY - bounds.top) / bounds.height, 0, 1) : 0.5;
      setScale(scale * Math.exp(-event.deltaY * 0.0015), focalX, focalY);
    }, { passive: false });
    viewport.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = { clientX: event.clientX, clientY: event.clientY, view: { ...view } };
      viewport.classList.add("is-panning");
      viewport.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    viewport.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const bounds = viewport.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      view.x = drag.view.x - (event.clientX - drag.clientX) * drag.view.width / bounds.width;
      view.y = drag.view.y - (event.clientY - drag.clientY) * drag.view.height / bounds.height;
      render();
      event.preventDefault();
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
    close.addEventListener("click", closeLightbox);
    lightbox.addEventListener("pointerdown", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", onDocumentKeydown);

    document.body.append(lightbox);
    document.body.style.overflow = "hidden";
    closeActiveLightbox = closeLightbox;
    render();
    close.focus?.();
  };

  const enhance = (host) => {
    if (host.dataset.mermaidInteractive === "true") return;
    const svg = host.querySelector("svg");
    if (!svg) return;

    host.dataset.mermaidInteractive = "true";
    host.classList.add("mermaid-expandable");
    svg.classList.add("mermaid-inline-svg");

    const expand = createButton({
      className: "mermaid-expand",
      label: "Expand Mermaid diagram",
      title: "Expand diagram",
      content: icon('<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5M3 8l6-6M15 2l6 6M21 16l-6 6M9 22l-6-6" />'),
      dataAttribute: "mermaidExpand",
    });
    expand.addEventListener("click", () => openLightbox(svg, expand));
    host.append(expand);
  };

  const render = async () => {
    const nodes = diagrams();
    if (nodes.length === 0 || !window.mermaid) return;

    const dark = document.documentElement.dataset.theme === "dark";
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: dark ? "dark" : "neutral",
      flowchart: { htmlLabels: false, useMaxWidth: true },
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
