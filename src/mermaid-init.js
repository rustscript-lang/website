(() => {
  const diagrams = () => [...document.querySelectorAll(".mermaid")];

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
