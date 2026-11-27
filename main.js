(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  $("#year").textContent = new Date().getFullYear();
  requestAnimationFrame(() => document.body.classList.add("loaded"));

  /* nav: solid after scroll, hides on scroll down */
  const nav = $(".nav"); let lastY = scrollY;
  const onNav = () => {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 20);
    nav.classList.toggle("hide", y > 400 && y > lastY && !document.body.classList.contains("menu-open"));
    lastY = y;
  };
  addEventListener("scroll", onNav, { passive: true }); onNav();

  /* mobile menu */
  const menu = $(".menu"), mnav = $("#mobile-nav");
  const setMenu = (open) => {
    menu.setAttribute("aria-expanded", open); menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mnav.hidden = !open; document.body.classList.toggle("menu-open", open); document.body.style.overflow = open ? "hidden" : "";
  };
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  $$("a", mnav).forEach(a => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* rotating hero word */
  const words = ["ship", "scale", "sell", "last"];
  const w = $("#swap-word"); let wi = 0;
  if (!reduce) setInterval(() => {
    w.classList.add("out");
    setTimeout(() => { wi = (wi + 1) % words.length; w.textContent = words[wi]; w.classList.remove("out"); }, 320);
  }, 2400);

  /* hero orb: drifting pink / cyan / violet blobs, blurred by CSS */
  const cv = $("#orb"), ctx = cv.getContext("2d");
  let W = 0, H = 0, raf, mx = .5, my = .5, tx = .5, ty = .5;
  const blobs = [
    { c: "236,72,153", r: .34, sx: .00031, sy: .00023, ox: .62, oy: .35 },
    { c: "34,211,238", r: .26, sx: .00027, sy: .00035, ox: .80, oy: .55 },
    { c: "139,92,246", r: .30, sx: .00019, sy: .00029, ox: .45, oy: .60 },
  ];
  const size = () => { const r = cv.getBoundingClientRect(); W = cv.width = Math.round(r.width / 2); H = cv.height = Math.round(r.height / 2); };
  const paint = (t) => {
    mx += (tx - mx) * .04; my += (ty - my) * .04;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    blobs.forEach((b, i) => {
      const x = (b.ox + Math.sin(t * b.sx + i) * .12 + (mx - .5) * .12 * (i + 1)) * W;
      const y = (b.oy + Math.cos(t * b.sy + i * 2) * .14 + (my - .5) * .1 * (i + 1)) * H;
      const r = b.r * Math.max(W, H);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${b.c},.75)`); g.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    ctx.globalCompositeOperation = "source-over";
  };
  const loop = (t) => { paint(t); raf = requestAnimationFrame(loop); };
  size(); addEventListener("resize", () => { size(); if (reduce) paint(0); });
  if (reduce) paint(0);
  else new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(loop); }).observe(cv);
  $(".hero").addEventListener("pointermove", e => { tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; });

  /* custom cursor + magnetic buttons (mouse only) */
  if (fine && !reduce) {
    const cur = $(".cursor"); let cx = -100, cy = -100, px = -100, py = -100;
    addEventListener("pointermove", e => { cx = e.clientX; cy = e.clientY; cur.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.remove("on"));
    (function follow() { px += (cx - px) * .22; py += (cy - py) * .22; cur.style.transform = `translate3d(${px}px,${py}px,0)`; requestAnimationFrame(follow); })();
    $$("a, button, summary, .chips label").forEach(el => {
      el.addEventListener("pointerenter", () => cur.classList.add("big"));
      el.addEventListener("pointerleave", () => cur.classList.remove("big"));
    });
    $$(".magnetic").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* glow that follows the pointer on cards */
  $$(".card, .plan").forEach(el => el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  /* split headings into words */
  const splitWords = (el, inner = true) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(t => inner ? `<span class="w"><span>${t}</span></span>` : `<span class="w">${t}</span>`).join(" ");
  };
  $$(".split").forEach(el => {
    splitWords(el);
    $$(".w > span", el).forEach((s, i) => { s.style.transitionDelay = `${i * 60}ms`; });
  });

  /* reveal on scroll */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (el.classList.contains("reveal")) {
      const sibs = $$(".reveal", el.parentElement);
      el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 5) * 70}ms`;
    }
    el.classList.add("in"); io.unobserve(el);
  }), { threshold: .15, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal, .split").forEach(el => io.observe(el));

  /* statement: words light up as it scrolls through the viewport */
  const st = $("#statement"); splitWords(st, false);
  const sw = $$(".w", st);
  const onStatement = () => {
    const r = st.getBoundingClientRect();
    const p = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0, 1);
    const n = Math.round(p * sw.length);
    sw.forEach((el, i) => el.classList.toggle("lit", i < n));
  };

  /* process: horizontal scroll pinned on wide screens */
  const proc = $("#process"), track = $("#track"), bar = $("#progress-bar");
  let dist = 0, pinned = false;
  const setupPin = () => {
    pinned = !reduce && innerWidth > 900;
    proc.style.height = ""; track.style.transform = "";
    if (!pinned) return;
    dist = Math.max(0, track.scrollWidth - innerWidth);
    proc.style.height = `${innerHeight + dist}px`;
  };
  const onPin = () => {
    if (!pinned) return;
    const r = proc.getBoundingClientRect();
    const p = clamp(-r.top / (proc.offsetHeight - innerHeight || 1), 0, 1);
    track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    bar.style.transform = `scaleX(${p})`;
  };

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { onStatement(); onPin(); ticking = false; });
  }, { passive: true });
  addEventListener("resize", () => { setupPin(); onPin(); onStatement(); });
  addEventListener("load", () => { setupPin(); onPin(); });
  setupPin(); onPin(); onStatement();

  /* plan buttons preselect the engagement */
  const form = $("#contact-form");
  $$("[data-plan]").forEach(b => b.addEventListener("click", () => { form.plan.value = b.dataset.plan; }));

  /* contact form opens a prefilled email */
  const note = $("#form-note");
  form.addEventListener("submit", e => {
    e.preventDefault();
    let bad = null;
    ["name", "email", "message"].forEach(n => {
      const f = form[n];
      const ok = f.value.trim() && (n !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute("aria-invalid", !ok); if (!ok && !bad) bad = f;
    });
    if (bad) { note.textContent = "Please add your name, a valid email and a few project details."; note.classList.add("err"); bad.focus(); return; }
    note.classList.remove("err");
    const needs = $$('input[name="need"]:checked', form).map(i => i.value).join(", ") || "Not specified";
    const body = `Name: ${form.name.value}\nEmail: ${form.email.value}\nNeeds: ${needs}\nEngagement: ${form.plan.value}\n\n${form.message.value}`;
    location.href = `mailto:hello@jimsy.shop?subject=${encodeURIComponent("New project enquiry from " + form.name.value)}&body=${encodeURIComponent(body)}`;
    note.textContent = "Your email app should open now. If it doesn't, write to hello@jimsy.shop.";
  });
})();
