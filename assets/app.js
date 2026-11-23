/* Portfolio: lädt inhalt.json, wählt den Einstieg nach Herkunft, rendert die Ansichten. */
(() => {
  "use strict";

  const VIEWS = ["start", "skills", "projekte", "ziele"];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* privat/blockiert: egal */ } },
  };

  let data = null;
  let lang = "de";
  let interest = "alle";
  let source = null; // "linkedin" | "github" | null

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  };
  const t = (v) => (v && typeof v === "object" && !Array.isArray(v) ? (v[lang] ?? v.de ?? "") : (v ?? ""));
  const ui = (key) => t(data.ui[key]) || key;

  /* ---------- Herkunft ---------- */
  function detectSource() {
    const p = new URLSearchParams(location.search);
    const von = (p.get("von") || p.get("from") || p.get("utm_source") || "").toLowerCase();
    if (von.includes("linkedin")) return "linkedin";
    if (von.includes("github")) return "github";
    let ref = "";
    try { ref = new URL(document.referrer).hostname; } catch { /* kein Referrer */ }
    if (/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/.test(ref)) return "linkedin";
    if (/(^|\.)github\.com$|(^|\.)github\.io$/.test(ref) && !ref.startsWith(location.hostname)) return "github";
    return null;
  }

  function initialView() {
    const h = location.hash.replace("#", "");
    if (VIEWS.includes(h)) return h;
    if (source === "linkedin") return "skills";
    if (source === "github") return "projekte";
    return "start";
  }

  /* ---------- Rahmen ---------- */
  function renderChrome() {
    document.documentElement.lang = lang;
    document.title = t(data.person.title);
    $("#brand-name").textContent = data.person.name;
    $("#brand-role").textContent = t(data.person.role);

    const nav = $("#nav");
    nav.replaceChildren(...VIEWS.map((v) =>
      el("a", { href: `#${v}`, "data-view": v }, ui(`nav_${v}`))));

    $("#btn-contact").textContent = ui("contact");
    $("#btn-cv").replaceChildren(el("span", { class: "long" }, ui("cv")), el("span", { class: "short", "aria-hidden": "true" }, "CV"));
    const cv = data.person.cv;
    $("#btn-cv").href = cv.href;
    $("#btn-cv").hidden = !cv.available;

    $("#lang").textContent = lang === "de" ? "EN" : "DE";
    $("#lang").setAttribute("aria-label", ui("lang_switch"));

    const foot = $("#footer");
    foot.replaceChildren(
      el("span", {}, `© ${new Date().getFullYear()} ${data.person.name}`),
      el("span", { class: "foot-links" },
        el("a", { href: data.person.links.linkedin, rel: "me noopener", target: "_blank" }, "LinkedIn"),
        el("a", { href: data.person.links.github, rel: "me noopener", target: "_blank" }, "GitHub"),
        el("a", { href: "#", onclick: contact }, ui("contact")),
        data.person.links.imprint ? el("a", { href: data.person.links.imprint }, ui("imprint")) : null));
  }

  function renderBanner(view) {
    const b = $("#banner");
    const key = source && store.get("banner-dismissed") !== source ? `banner_${source}` : null;
    if (!key) { b.hidden = true; return; }
    b.hidden = false;
    b.replaceChildren(
      el("p", {}, ui(key)),
      el("button", { type: "button", class: "linklike", onclick: () => go(view === "skills" ? "projekte" : "skills") },
        ui(view === "skills" ? "banner_to_projects" : "banner_to_skills")),
      el("button", { type: "button", class: "icon-btn", "aria-label": ui("close"),
        onclick: () => { store.set("banner-dismissed", source); b.hidden = true; } }, "×"));
  }

  /* ---------- Interessen-Filter ---------- */
  function interestBar() {
    const used = new Set([...visibleGroups().flatMap((g) => g.skills), ...data.projects].flatMap((x) => x.tags || []));
    const opts = [{ id: "alle", label: data.ui.interest_all }, ...data.interests.filter((i) => used.has(i.id))];
    return el("div", { class: "interest", role: "group", "aria-label": ui("interest_label") },
      el("span", { class: "interest-label" }, ui("interest_label")),
      ...opts.map((o) => el("button", {
        type: "button", class: "chip", "aria-pressed": String(interest === o.id),
        onclick: () => { interest = o.id; store.set("interest", o.id); render(currentView()); },
      }, t(o.label))));
  }
  const matches = (item) => interest === "alle" || (item.tags || []).includes(interest);

  /* ---------- Ansichten ---------- */
  function viewStart() {
    const s = data.start;
    const p = data.person;
    return el("section", { class: "view view-start", "aria-labelledby": "h-start" },
      el("div", { class: "hero" },
        el("p", { class: "status" }, el("span", { class: "dot", "aria-hidden": "true" }), t(p.status)),
        el("h1", { id: "h-start" }, t(s.headline)),
        el("p", { class: "lead" }, t(s.lead)),
        el("div", { class: "hero-actions" },
          el("a", { class: "btn primary", href: "#skills" }, ui("cta_skills")),
          el("a", { class: "btn", href: "#projekte" }, ui("cta_projects")))),
      el("div", { class: "problems" },
        el("h2", {}, t(s.problems_title)),
        el("ul", { class: "problem-list" }, ...data.projects.filter((x) => x.problem_short).map((x) =>
          el("li", {},
            el("span", { class: "prob" }, t(x.problem_short)),
            el("a", { class: "sol", href: `#projekte`, onclick: (e) => { e.preventDefault(); go("projekte", x.id); } }, x.title))))),
      el("div", { class: "way" },
        el("h2", {}, t(s.way_title)),
        el("ol", { class: "way-steps" }, ...s.way.map((w) =>
          el("li", {}, el("strong", {}, t(w.title)), el("span", {}, t(w.text)))))));
  }

  /* Retro-Balken: 20 Blöcke à 5 %, jeder Block gehört zu einem Beleg (für die Einfärbung beim Aufklappen). */
  function blockCells(sk) {
    const owners = [];
    sk.evidence.forEach((e) => { for (let i = 0; i < Math.round((e.points || 0) / 5); i++) owners.push(e.type); });
    return Array.from({ length: 20 }, (_, i) => el("span", {
      class: `cell${owners[i] ? ` on seg-${owners[i]}` : ""}${[8, 13, 17].includes(i) ? " tick" : ""}`,
      style: `--i:${i}`,
    }));
  }

  function skillRow(sk) {
    const id = `sk-${sk.id}`;
    const pct = sk.pct;
    const btn = el("button", {
      type: "button", class: "skill-head", "aria-expanded": "false", "aria-controls": id,
      onclick: (e) => {
        const open = e.currentTarget.getAttribute("aria-expanded") === "true";
        e.currentTarget.setAttribute("aria-expanded", String(!open));
        $(`#${id}`).hidden = open;
        row.classList.toggle("open", !open);
      },
    },
      el("span", { class: "skill-name" }, t(sk.name)),
      el("span", { class: "skill-stage" }, t(data.stages[sk.stage].label)),
      el("span", { class: "skill-pct", "aria-hidden": "true" }, sk.placeholder ? "?" : `${pct} %`),
      el("span", { class: "bar", role: "img", "aria-label": sk.placeholder ? ui("unknown_yet") : `${pct} %` },
        ...blockCells(sk)));

    const details = el("div", { class: "skill-details", id, hidden: true },
      sk.placeholder ? el("p", { class: "todo" }, ui("placeholder_note")) : null,
      el("p", { class: "stage-text" }, t(data.stages[sk.stage].text)),
      el("h4", {}, ui("evidence_title")),
      el("ul", { class: "evidence" }, ...sk.evidence.map((e) =>
        el("li", {},
          el("span", { class: `swatch seg-${e.type}`, "aria-hidden": "true" }),
          el("span", { class: "ev-type" }, t(data.evidence_types[e.type])),
          el("span", { class: "ev-text" },
            e.link ? el("a", { href: e.link, target: "_blank", rel: "noopener" }, t(e.text)) : t(e.text)),
          el("span", { class: "ev-pts" }, sk.placeholder ? "" : `+${e.points}`)))),
      el("div", { class: "full" },
        el("h4", {}, ui("full_title")),
        el("p", {}, t(sk.full))));
    const row = el("li", { class: `skill${matches(sk) ? "" : " dim"}` }, btn, details);
    return row;
  }

  /* Platzhalter nur lokal zeigen; online erscheinen nur belegte Skills. */
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  function visibleGroups() {
    return data.skillGroups
      .map((g) => ({ ...g, skills: g.skills.filter((s) => isLocal || !s.placeholder) }))
      .filter((g) => g.skills.length);
  }

  function viewSkills() {
    return el("section", { class: "view view-skills", "aria-labelledby": "h-skills" },
      el("header", { class: "view-head" },
        el("h1", { id: "h-skills" }, ui("nav_skills")),
        el("p", { class: "lead" }, t(data.skills_intro))),
      interestBar(),
      el("details", { class: "scale" },
        el("summary", {}, ui("scale_title")),
        el("dl", {}, ...Object.values(data.stages).flatMap((s) => [
          el("dt", {}, `${t(s.label)} (${s.range})`), el("dd", {}, t(s.text))])),
        el("p", { class: "legend" }, ...Object.entries(data.evidence_types).map(([k, v]) =>
          el("span", {}, el("span", { class: `swatch seg-${k}`, "aria-hidden": "true" }), t(v))))),
      el("div", { class: "skill-grid" }, ...visibleGroups().map((g) =>
        el("section", { class: "skill-group" },
          el("h2", {}, t(g.title)),
          el("ul", { class: "skills" }, ...g.skills.map(skillRow))))));
  }

  function projectCard(p) {
    const st = data.project_status[p.status];
    return el("article", { class: `project${matches(p) ? "" : " dim"}`, id: `p-${p.id}`, tabindex: "-1" },
      el("header", {},
        el("h2", {}, p.title),
        el("span", { class: `pill st-${p.status}` }, t(st))),
      el("p", { class: "problem" }, el("strong", {}, ui("problem")), " ", t(p.problem)),
      el("p", {}, t(p.what)),
      p.features ? el("ul", { class: "features" }, ...p.features.map((f) => el("li", {}, t(f)))) : null,
      el("ul", { class: "stack", "aria-label": ui("stack") }, ...p.stack.map((s) => el("li", {}, s))),
      el("p", { class: "links" },
        ...(p.links || []).map((l) => el("a", { href: l.href, target: "_blank", rel: "noopener" }, t(l.label))),
        p.private ? el("span", { class: "private" }, ui("private_repo")) : null));
  }

  function viewProjects() {
    const order = [...data.projects].sort((a, b) => Number(matches(b)) - Number(matches(a)));
    return el("section", { class: "view view-projects", "aria-labelledby": "h-projects" },
      el("header", { class: "view-head" },
        el("h1", { id: "h-projects" }, ui("nav_projekte")),
        el("p", { class: "lead" }, t(data.projects_intro))),
      interestBar(),
      el("div", { class: "projects" }, ...order.map(projectCard)));
  }

  function viewGoals() {
    const g = data.goals;
    return el("section", { class: "view view-goals", "aria-labelledby": "h-goals" },
      el("header", { class: "view-head" },
        el("h1", { id: "h-goals" }, ui("nav_ziele")),
        el("p", { class: "lead" }, t(g.intro))),
      el("ol", { class: "timeline" }, ...g.phases.map((ph) =>
        el("li", { class: `phase ${ph.state}` },
          el("span", { class: "phase-state" }, t(data.phase_states[ph.state])),
          el("h2", {}, t(ph.title)),
          el("p", {}, t(ph.text))))),
      el("aside", { class: "callout", "aria-labelledby": "h-join" },
        el("h2", { id: "h-join" }, t(g.join.title)),
        el("p", {}, t(g.join.text)),
        el("ul", {}, ...g.join.who.map((w) => el("li", {}, t(w)))),
        el("button", { type: "button", class: "btn primary", onclick: (e) => contact(e, t(g.join.subject)) }, t(g.join.cta))),
      el("div", { class: "values" },
        el("h2", {}, t(g.values_title)),
        el("ul", {}, ...g.values.map((v) => el("li", {}, el("strong", {}, t(v.title)), " ", t(v.text))))));
  }

  /* ---------- Kontakt (Adresse steht nicht im HTML) ---------- */
  function contact(e, subject) {
    if (e) e.preventDefault();
    const [u, d] = data.person.mail;
    const s = encodeURIComponent(subject || ui("mail_subject"));
    location.href = `mailto:${u}@${d}?subject=${s}`;
  }

  /* ---------- Router ---------- */
  const currentView = () => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : current);
  let current = "start";

  function go(view, anchor) {
    if (location.hash !== `#${view}`) history.pushState(null, "", `${location.search}#${view}`);
    render(view, anchor);
  }

  function render(view, anchor) {
    current = view;
    const main = $("#main");
    const builders = { start: viewStart, skills: viewSkills, projekte: viewProjects, ziele: viewGoals };
    main.replaceChildren(builders[view]());
    document.querySelectorAll("#nav a").forEach((a) => {
      if (a.dataset.view === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    renderBanner(view);
    if (anchor) {
      const target = $(`#p-${anchor}`);
      if (target) { target.scrollIntoView({ block: "start" }); target.focus({ preventScroll: true }); target.classList.add("flash"); }
    } else {
      window.scrollTo(0, 0);
    }
  }

  /* ---------- Start ---------- */
  async function boot() {
    try {
      const res = await fetch("inhalt.json", { cache: "no-cache" });
      data = await res.json();
    } catch {
      $("#main").textContent = "inhalt.json konnte nicht geladen werden.";
      return;
    }
    const saved = store.get("lang");
    lang = saved || ((navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en");
    interest = store.get("interest") || "alle";
    if (!["alle", ...data.interests.map((i) => i.id)].includes(interest)) interest = "alle";
    source = detectSource();

    $("#lang").addEventListener("click", () => {
      lang = lang === "de" ? "en" : "de";
      store.set("lang", lang);
      renderChrome(); render(current);
    });
    $("#btn-contact").addEventListener("click", contact);
    $("#btn-cv").addEventListener("click", (e) => { if (!data.person.cv.available) e.preventDefault(); });
    window.addEventListener("hashchange", () => {
      const v = location.hash.slice(1);
      if (VIEWS.includes(v)) render(v);
    });
    window.addEventListener("popstate", () => {
      const v = location.hash.slice(1);
      render(VIEWS.includes(v) ? v : "start");
    });

    renderChrome();
    const v = initialView();
    if (v !== "start" && !location.hash) history.replaceState(null, "", `${location.search}#${v}`);
    render(v);
  }

  boot();
})();
