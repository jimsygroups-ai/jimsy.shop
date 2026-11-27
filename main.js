(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* year */
  $("#year").textContent = new Date().getFullYear();

  /* nav border on scroll */
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* mobile menu */
  const menu = $(".menu"), mnav = $("#mobile-nav");
  const setMenu = (open) => { menu.setAttribute("aria-expanded", open); mnav.hidden = !open; document.body.style.overflow = open ? "hidden" : ""; };
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  $$("a", mnav).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* rotating hero word */
  const words = ["ships.", "scales.", "sells.", "lasts."];
  const w = $("#swap-word"); let wi = 0;
  if (!reduce) setInterval(() => {
    w.classList.add("out");
    setTimeout(() => { wi = (wi + 1) % words.length; w.textContent = words[wi]; w.classList.remove("out"); }, 380);
  }, 2600);

  /* console build log */
  const lines = [
    ["dim", "$ jimsy new client-portal --stack next,postgres"],
    ["", "  scaffolding app ........................ "], ["ok", "done"],
    ["dim", "$ jimsy design --prototype"],
    ["", "  12 screens · 3 user flows .............. "], ["ok", "approved"],
    ["dim", "$ jimsy test --all"],
    ["", "  unit · e2e · a11y ...................... "], ["ok", "passing"],
    ["dim", "$ jimsy deploy --prod"],
    ["", "  building · migrating · warming cache ... "], ["ok", "live"],
    ["ac", "\n  ✦ shipped. on time, on budget."],
  ];
  const pre = $("#console");
  const render = (html) => { pre.innerHTML = html + '<span class="caret"></span>'; };
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  if (reduce) {
    render(lines.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join("").replace(/(done|approved|passing|live)<\/span>/g, "$1</span>\n"));
  } else {
    let out = "", li = 0, ci = 0;
    const tick = () => {
      if (li >= lines.length) { setTimeout(() => { out = ""; li = 0; ci = 0; tick(); }, 4200); return; }
      const [cls, text] = lines[li];
      if (ci === 0) out += `<span class="${cls}">`;
      out += esc(text[ci]); ci++;
      if (ci >= text.length) {
        out += "</span>";
        if (cls === "ok" || cls === "dim") out += "\n";
        li++; ci = 0;
        render(out); setTimeout(tick, cls === "dim" ? 260 : 420); return;
      }
      render(out + "</span>");
      setTimeout(tick, cls === "" ? 8 : 26);
    };
    // start when visible
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { tick(); o.disconnect(); } }).observe(pre);
  }

  /* interactive dot field behind hero */
  const cv = $("#field"), ctx = cv.getContext("2d");
  let W, H, dpr, pts = [], mouse = { x: -9999, y: -9999 }, raf;
  const GAP = 34;
  const build = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = [];
    for (let y = GAP / 2; y < H; y += GAP) for (let x = GAP / 2; x < W; x += GAP) pts.push({ x, y });
  };
  const draw = (t = 0) => {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      const near = Math.max(0, 1 - d / 180);
      const wave = reduce ? 0 : (Math.sin(p.x * .012 + t * .0012) + Math.cos(p.y * .015 + t * .0009)) * .5;
      const r = 1 + near * 2.6 + wave * .35;
      const push = near * 10;
      const ox = d ? (dx / d) * push : 0, oy = d ? (dy / d) * push : 0;
      ctx.fillStyle = near > .05 ? `rgba(232,71,28,${.25 + near * .6})` : "rgba(21,20,15,.16)";
      ctx.beginPath(); ctx.arc(p.x + ox, p.y + oy, Math.max(.6, r), 0, Math.PI * 2); ctx.fill();
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  };
  const hero = $(".hero");
  hero.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; if (reduce) draw(); });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; if (reduce) draw(); });
  addEventListener("resize", () => { build(); if (reduce) draw(); });
  build(); draw();
  // pause animation when hero offscreen
  new IntersectionObserver(([e]) => {
    if (reduce) return;
    if (e.isIntersecting) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } else cancelAnimationFrame(raf);
  }).observe(hero);

  /* scroll reveal (staggered within groups) */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const sibs = $$(".reveal", e.target.parentElement);
    e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 5) * 70}ms`;
    e.target.classList.add("in"); io.unobserve(e.target);
  }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => io.observe(el));

  /* plan buttons pre-select engagement */
  const form = $("#contact-form");
  $$("[data-plan]").forEach(b => b.addEventListener("click", () => { form.plan.value = b.dataset.plan; }));

  /* contact form → mailto */
  const note = $("#form-note");
  form.addEventListener("submit", e => {
    e.preventDefault();
    let bad = null;
    ["name", "email", "message"].forEach(n => {
      const f = form[n]; const ok = f.value.trim() && (n !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute("aria-invalid", !ok); if (!ok && !bad) bad = f;
    });
    if (bad) { note.textContent = "Please fill in your name, a valid email and a few project details."; note.classList.add("err"); bad.focus(); return; }
    note.classList.remove("err");
    const needs = $$('input[name="need"]:checked', form).map(i => i.value).join(", ") || "Not specified";
    const body = `Name: ${form.name.value}\nEmail: ${form.email.value}\nNeeds: ${needs}\nEngagement: ${form.plan.value}\n\n${form.message.value}`;
    location.href = `mailto:hello@jimsy.shop?subject=${encodeURIComponent("New project enquiry — " + form.name.value)}&body=${encodeURIComponent(body)}`;
    note.textContent = "Your email app should open now. If it doesn't, write to hello@jimsy.shop.";
  });
})();
