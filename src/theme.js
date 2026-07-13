(() => {
  const STORAGE_KEY = "rustscript-site-theme";
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const valid = (value) => value === "light" || value === "dark" || value === "system";
  let preference = "system";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && valid(stored)) preference = stored;
  } catch {
    // Ignore storage failures.
  }

  const resolve = () =>
    preference === "system" ? (query.matches ? "dark" : "light") : preference;

  const apply = () => {
    const resolved = resolve();
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    const control = document.getElementById("theme-control");
    if (control) {
      control.dataset.theme = preference;
      control.querySelectorAll("[data-theme-choice]").forEach((button) => {
        const active = button.dataset.themeChoice === preference;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }
  };

  apply();

  const bind = () => {
    const control = document.getElementById("theme-control");
    if (!control) return;
    control.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.themeChoice;
        if (!next || !valid(next)) return;
        preference = next;
        try { window.localStorage.setItem(STORAGE_KEY, preference); } catch {}
        apply();
      });
    });
    apply();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }

  query.addEventListener("change", () => {
    if (preference === "system") apply();
  });
})();
