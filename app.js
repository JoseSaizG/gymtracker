/* GymTracker — registro local de entrenamientos. Sin servidor: todo vive en localStorage. */
(() => {
  "use strict";

  const STORE_KEY = "gymtracker.v1";
  const DEFAULT_EXERCISES = [
    "Press banca", "Sentadilla", "Peso muerto", "Press militar", "Remo con barra",
    "Dominadas", "Jalón al pecho", "Press inclinado con mancuernas", "Prensa de piernas",
    "Hip thrust", "Zancadas", "Curl de bíceps", "Extensión de tríceps", "Elevaciones laterales", "Fondos"
  ];
  const DEFAULT_INCS = [1, 2.5, 5];
  const DEFAULT_DAY_TYPES =["Push", "Pull", "Pierna", "Upper", "Lower", "Full body"];

  /* ---------- Utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const todayISO = () => toISO(new Date());
  const numFmt = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });
  const fmt = (n) => numFmt.format(n);
  const parseNum = (s) => parseFloat(String(s).replace(",", ".").replace(/[^\d.]/g, ""));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dayLong = (iso) => cap(fromISO(iso).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }));
  const dayShort = (iso) => fromISO(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" }).replace(".", "");
  const dayFull = (iso) => fromISO(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
  const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);

  /* ---------- Datos ---------- */
  let data = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      if (raw && Array.isArray(raw.sets)) return normalize(raw);
    } catch (e) { /* datos dañados: empezar limpio */ }
    return normalize({});
  }
  function normalize(raw) {
    const days = {};
    if (raw.days && typeof raw.days === "object") {
      for (const [d, v] of Object.entries(raw.days)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d) && v && typeof v.type === "string" && v.type.trim()) days[d] = { type: v.type.trim().slice(0, 40) };
      }
    }
    return {
      version: 1,
      sets: raw.sets || [],
      exercises: Array.isArray(raw.exercises) ? raw.exercises.filter((x) => typeof x === "string") : [],
      days,
      dayTypes: Array.isArray(raw.dayTypes) ? raw.dayTypes.filter((x) => typeof x === "string" && x.trim()) : [],
      settings: { incs: cleanIncs(raw.settings && raw.settings.incs) || DEFAULT_INCS.slice() },
    };
  }
  /** Saltos válidos: entre 0,01 y 100 kg, sin repetidos, de menor a mayor, máximo 3. */
  function cleanIncs(list) {
    if (!Array.isArray(list)) return null;
    const out = [...new Set(list.map(Number).filter((n) => Number.isFinite(n) && n > 0 && n <= 100).map((n) => Math.round(n * 100) / 100))].sort((a, b) => a - b).slice(0, 3);
    return out.length ? out : null;
  }
  const dayType = (date) => (data.days[date] ? data.days[date].type : null);
  function allDayTypes() {
    const used = Object.values(data.days).map((d) => d.type);
    return [...new Set([...DEFAULT_DAY_TYPES, ...data.dayTypes, ...used])];
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
    catch (e) { toast("No se pudo guardar: el almacenamiento está lleno o bloqueado"); }
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  const sortSets = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts);
  const sessionDates = () => [...new Set(data.sets.map((s) => s.date))].sort();
  const setsOn = (date) => data.sets.filter((s) => s.date === date).sort(sortSets);

  /** Marca récords: la primera serie del día que supera el máximo de días anteriores. */
  function computeRecords() {
    const prIds = new Set();
    const prDates = new Set();
    const best = new Map(); // ejercicio -> máximo previo
    const byDayEx = new Map();
    for (const s of [...data.sets].sort(sortSets)) {
      const k = s.date + "\u0000" + s.exercise;
      if (!byDayEx.has(k)) byDayEx.set(k, []);
      byDayEx.get(k).push(s);
    }
    const keys = [...byDayEx.keys()].sort();
    for (const k of keys) {
      const list = byDayEx.get(k);
      const ex = list[0].exercise;
      const dayMax = Math.max(...list.map((s) => s.weight));
      if (best.has(ex) && dayMax > best.get(ex)) {
        const first = list.find((s) => s.weight === dayMax);
        prIds.add(first.id);
        prDates.add(first.date);
      }
      best.set(ex, Math.max(best.get(ex) ?? -Infinity, dayMax));
    }
    return { prIds, prDates };
  }

  function knownExercises() {
    const last = new Map();
    for (const s of data.sets) {
      const key = s.date + String(s.ts).padStart(16, "0");
      if (!last.has(s.exercise) || last.get(s.exercise) < key) last.set(s.exercise, key);
    }
    const used = [...last.keys()].sort((a, b) => (last.get(a) < last.get(b) ? 1 : -1));
    const rest = data.exercises.filter((e) => !last.has(e));
    return { used, all: [...new Set([...used, ...rest, ...DEFAULT_EXERCISES])] };
  }

  /* ---------- Estado de la interfaz ---------- */
  const ui = {
    view: "hoy",
    date: todayISO(),
    exercise: null,
    inc: 2.5,
    calMonth: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })(),
    calSel: null,
    progEx: null,
    progRange: 0,
  };
  try { ui.inc = parseFloat(localStorage.getItem("gymtracker.inc")) || 2.5; } catch (e) {}

  /* ---------- Navegación ---------- */
  function show(view) {
    ui.view = view;
    for (const t of $$(".tab")) {
      const on = t.dataset.view === view;
      t.classList.toggle("is-on", on);
      if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    }
    for (const v of $$(".view")) v.hidden = v.id !== "view-" + view;
    $("#ctaWrap").hidden = view !== "hoy";
    $("#dateBtn").hidden = view !== "hoy";
    $("#sessionTag").hidden = view !== "hoy";
    if (view !== "hoy") $("#typeBtn").hidden = true;
    render();
    window.scrollTo(0, 0);
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));

  function render() {
    renderHeader();
    if (ui.view === "hoy") renderHoy();
    if (ui.view === "historial") renderHistory();
    if (ui.view === "calendario") renderCalendar();
    if (ui.view === "progreso") renderProgress();
  }

  /* ---------- Cabecera ---------- */
  function renderHeader() {
    const t = todayISO();
    const diff = daysBetween(ui.date, t);
    const main = diff === 0 ? "Hoy" : diff === 1 ? "Ayer" : cap(fromISO(ui.date).toLocaleDateString("es-CL", { weekday: "long" }));
    $("#dateMain").textContent = main;
    $("#dateSub").textContent = fromISO(ui.date).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: diff > 300 ? "numeric" : undefined });
    $("#dateBtn").classList.toggle("is-past", diff !== 0);
    $("#dateInput").value = ui.date;
    $("#dateInput").max = t;

    const dates = sessionDates();
    const idx = dates.indexOf(ui.date);
    const n = idx >= 0 ? idx + 1 : dates.filter((d) => d < ui.date).length + 1;
    $("#sessionTag").innerHTML = `Sesión <b>${n}</b>`;

    const type = dayType(ui.date);
    const tb = $("#typeBtn");
    // visible siempre en Hoy cuando el selector grande no está a la vista
    tb.hidden = ui.view !== "hoy" || (!type && !setsOn(ui.date).length);
    tb.textContent = type || "Elegir rutina";
    tb.classList.toggle("is-unset", !type);
  }
  $("#dateBtn").addEventListener("click", (e) => {
    const input = $("#dateInput");
    if (e.target !== input && input.showPicker) { try { input.showPicker(); } catch (err) { input.focus(); } }
  });
  $("#dateInput").addEventListener("change", (e) => {
    if (!e.target.value) return;
    ui.date = e.target.value > todayISO() ? todayISO() : e.target.value;
    ui.exercise = null;
    render();
  });

  /* ---------- HOY ---------- */
  const weightInput = $("#weightInput");
  const repsInput = $("#repsInput");

  function prefill(ex) {
    const today = setsOn(ui.date).filter((s) => s.exercise === ex);
    let src = today[today.length - 1];
    if (!src) {
      const prev = data.sets.filter((s) => s.exercise === ex && s.date < ui.date).sort(sortSets);
      src = prev[prev.length - 1];
    }
    setWeight(src ? src.weight : 20);
    setReps(src ? src.reps : 10);
  }
  function setWeight(v) { weightInput.value = fmt(Math.max(0, Math.round(v * 100) / 100)); fitWeight(); }
  function fitWeight() { weightInput.dataset.len = Math.min(6, Math.max(3, weightInput.value.length)); }
  weightInput.addEventListener("input", fitWeight);
  function setReps(v) { repsInput.value = String(Math.max(1, Math.round(v))); }
  const getWeight = () => parseNum(weightInput.value);
  const getReps = () => parseInt(repsInput.value, 10);

  function selectExercise(ex, { fill = true } = {}) {
    ui.exercise = ex;
    if (!data.exercises.includes(ex)) { data.exercises.push(ex); save(); }
    if (fill) prefill(ex);
    renderHoy();
  }

  /** Ejercicios hechos en días anteriores con la misma rutina, del más reciente al más antiguo. */
  function exercisesForType(type) {
    if (!type) return [];
    const dates = Object.keys(data.days).filter((d) => d < ui.date && data.days[d].type === type).sort().reverse();
    const out = [];
    for (const d of dates) for (const s of setsOn(d)) if (!out.includes(s.exercise)) out.push(s.exercise);
    return out;
  }

  function renderHoy() {
    const day = setsOn(ui.date);
    const { used } = knownExercises();
    const type = dayType(ui.date);
    const typeEx = exercisesForType(type);

    // rutina del día: se pregunta mientras el día no tenga una ni series
    const ask = !type && !day.length;
    $("#typePicker").hidden = !ask;
    if (ask) {
      $("#typeQ").textContent = ui.date === todayISO() ? "¿Qué rutina toca hoy?" : "¿Qué rutina hiciste ese día?";
      $("#typeChips").innerHTML = allDayTypes().map((t) => `<button type="button" class="chip" data-type="${esc(t)}">${esc(t)}</button>`).join("") +
        `<button type="button" class="chip is-add" data-type-other><svg class="ic"><use href="#i-plus"/></svg>Otra</button>`;
    }

    if (!ui.exercise) {
      const lastToday = day[day.length - 1];
      // con rutina elegida y sin series, el usuario elige el primer ejercicio
      ui.exercise = lastToday ? lastToday.exercise : type ? null : used[0] || null;
      if (ui.exercise) prefill(ui.exercise);
    }
    const { prIds } = computeRecords();

    // chips: los de hoy, luego los de la misma rutina, luego recientes
    const todayEx = [...new Set(day.map((s) => s.exercise))];
    const chipList = [...new Set([...todayEx, ...typeEx, ...used, ...(used.length < 4 ? DEFAULT_EXERCISES.slice(0, 4) : [])])].slice(0, 14);
    if (ui.exercise && !chipList.includes(ui.exercise)) chipList.unshift(ui.exercise);
    const countFor = (ex) => day.filter((s) => s.exercise === ex).length;
    $("#chips").innerHTML = `<button type="button" class="chip is-add" id="addExChip"><svg class="ic"><use href="#i-plus"/></svg>Agregar ejercicio</button>` +
      chipList.map((ex) => {
        const c = countFor(ex);
        return `<button type="button" role="listitem" class="chip${ex === ui.exercise ? " is-on" : ""}" data-ex="${esc(ex)}" aria-pressed="${ex === ui.exercise}">${esc(ex)}${c ? `<span class="count">${c}</span>` : ""}</button>`;
      }).join("");

    const name = $("#exName");
    name.textContent = ui.exercise || "Elige un ejercicio";
    name.classList.toggle("is-empty", !ui.exercise);

    // última vez
    const last = $("#lastTime");
    if (ui.exercise) {
      const prev = data.sets.filter((s) => s.exercise === ui.exercise && s.date < ui.date);
      const lastDate = prev.reduce((m, s) => (s.date > m ? s.date : m), "");
      if (lastDate) {
        const ls = prev.filter((s) => s.date === lastDate).sort(sortSets);
        last.innerHTML = `Última vez, ${esc(dayShort(lastDate))}: <b>${ls.map((s) => `${fmt(s.weight)}×${s.reps}`).join(", ")}</b>`;
      } else last.textContent = "Primera vez con este ejercicio";
    } else last.textContent = "Toca un ejercicio de arriba o agrega uno nuevo.";
    $("#board").classList.toggle("is-idle", !ui.exercise);

    // series de hoy del ejercicio actual
    const mine = day.filter((s) => s.exercise === ui.exercise);
    $("#todaySets").innerHTML = !ui.exercise ? "" : mine.length
      ? mine.map((s, i) => `
        <div class="set-row">
          <span class="set-n">Serie ${i + 1}</span>
          <button type="button" class="set-v" data-load="${s.id}" aria-label="Usar ${fmt(s.weight)} kilos por ${s.reps}">${fmt(s.weight)}<span class="kg">kg</span><span class="x">×</span>${s.reps}${prIds.has(s.id) ? '<span class="badge">Récord</span>' : ""}</button>
          <button type="button" class="icon-btn del" data-del="${s.id}" aria-label="Borrar serie ${i + 1}"><svg class="ic"><use href="#i-trash"/></svg></button>
        </div>`).join("")
      : `<p class="today-empty">Aún no anotas series de ${esc(ui.exercise)} ${ui.date === todayISO() ? "hoy" : "este día"}.</p>`;

    // otros ejercicios del día
    const others = [...new Set(day.map((s) => s.exercise))].filter((e) => e !== ui.exercise);
    $("#todayOthers").innerHTML = others.length ? `<h2 class="others-title">También ${ui.date === todayISO() ? "hoy" : "este día"}</h2>` + others.map((ex) => {
      const ss = day.filter((s) => s.exercise === ex);
      return `<button type="button" class="other-row" data-ex="${esc(ex)}"><span>${esc(ex)}</span><span>${ss.map((s) => `${fmt(s.weight)}×${s.reps}`).join("  ")}</span></button>`;
    }).join("") : "";

    const btn = $("#logBtn");
    btn.disabled = !ui.exercise;
    btn.textContent = ui.exercise ? `Anotar serie ${mine.length + 1}` : "Elige un ejercicio";
  }

  /* ---------- Rutina del día ---------- */
  const typeSheet = $("#typeSheet");
  function setDayType(type) {
    const t = type ? cap(type.trim().replace(/\s+/g, " ")).slice(0, 40) : "";
    if (t) {
      data.days[ui.date] = { type: t };
      if (!DEFAULT_DAY_TYPES.includes(t) && !data.dayTypes.includes(t)) data.dayTypes.push(t);
    } else delete data.days[ui.date];
    save();
    ui.exercise = setsOn(ui.date).length ? ui.exercise : null;
    if (typeSheet.open) typeSheet.close();
    render();
  }
  function openTypeSheet(focusNew = false) {
    const cur = dayType(ui.date);
    $("#typeGrid").innerHTML = allDayTypes().map((t) => `<button type="button" class="type-opt${t === cur ? " is-on" : ""}" data-type="${esc(t)}">${esc(t)}</button>`).join("");
    $("#typeNew").value = "";
    $("#typeClear").hidden = !cur;
    typeSheet.showModal();
    if (focusNew) setTimeout(() => $("#typeNew").focus(), 50);
  }
  $("#typeBtn").addEventListener("click", () => openTypeSheet());
  $("#typeGrid").addEventListener("click", (e) => { const b = e.target.closest("[data-type]"); if (b) setDayType(b.dataset.type); });
  $("#typeNewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#typeNew").value.trim();
    if (!v) { $("#typeNew").focus(); return; }
    setDayType(v);
  });
  $("#typeClear").addEventListener("click", () => setDayType(""));

  $("#view-hoy").addEventListener("click", (e) => {
    const typeChip = e.target.closest("[data-type]");
    if (typeChip) return setDayType(typeChip.dataset.type);
    if (e.target.closest("[data-type-other]")) return openTypeSheet(true);
    const chip = e.target.closest("[data-ex]");
    if (chip) return selectExercise(chip.dataset.ex);
    if (e.target.closest("#addExChip")) return openExerciseSheet();
    const load = e.target.closest("[data-load]");
    if (load) {
      const s = data.sets.find((x) => x.id === load.dataset.load);
      if (s) { setWeight(s.weight); setReps(s.reps); }
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) return deleteSet(del.dataset.del);
    const step = e.target.closest("[data-step]");
    if (step) {
      const dir = Number(step.dataset.dir);
      if (step.dataset.step === "weight") {
        const w = getWeight() || 0;
        setWeight(w + dir * ui.inc);
      } else setReps((getReps() || 0) + dir);
      return;
    }
    const inc = e.target.closest("[data-inc]");
    if (inc) {
      ui.inc = parseFloat(inc.dataset.inc);
      try { localStorage.setItem("gymtracker.inc", ui.inc); } catch (err) {}
      renderIncs();
    }
  });
  function renderIncs() {
    const incs = data.settings.incs;
    if (!incs.includes(ui.inc)) ui.inc = incs.includes(2.5) ? 2.5 : incs[Math.floor((incs.length - 1) / 2)];
    $("#incOpts").innerHTML = incs.map((n) => `<button type="button" class="inc${n === ui.inc ? " is-on" : ""}" data-inc="${n}" aria-pressed="${n === ui.inc}">${fmt(n)}</button>`).join("");
  }
  renderIncs();

  const incSheet = $("#incSheet");
  function fillIncForm(list) {
    const f = $("#incForm");
    for (let i = 0; i < 3; i++) f.elements["i" + i].value = list[i] != null ? fmt(list[i]) : "";
    $("#incError").hidden = true;
  }
  $("#incEdit").addEventListener("click", () => { fillIncForm(data.settings.incs); incSheet.showModal(); });
  $("#incReset").addEventListener("click", () => fillIncForm(DEFAULT_INCS));
  $("#incForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const raw = [0, 1, 2].map((i) => f.elements["i" + i].value.trim()).filter(Boolean);
    const bad = raw.find((v) => { const n = parseNum(v); return !Number.isFinite(n) || n <= 0 || n > 100; });
    const incs = cleanIncs(raw.map(parseNum));
    const err = $("#incError");
    if (bad || !incs) {
      err.textContent = bad ? `"${bad}" no sirve: usa un número mayor que 0 y hasta 100, por ejemplo 1,25.` : "Pon al menos un salto, por ejemplo 2,5.";
      err.hidden = false;
      return;
    }
    data.settings.incs = incs;
    save();
    renderIncs();
    incSheet.close();
    toast(`Saltos guardados: ${incs.map(fmt).join(", ")} kg`);
  });

  for (const input of [weightInput, repsInput]) {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") input.blur(); });
  }
  weightInput.addEventListener("blur", () => { const w = getWeight(); setWeight(Number.isFinite(w) ? w : 0); });
  repsInput.addEventListener("blur", () => { const r = getReps(); setReps(Number.isFinite(r) ? r : 1); });

  $("#logBtn").addEventListener("click", logSet);

  function logSet() {
    if (!ui.exercise) return;
    const weight = getWeight();
    const reps = getReps();
    if (!Number.isFinite(weight) || weight < 0) return toast("Escribe un peso válido en kilos");
    if (!Number.isFinite(reps) || reps < 1) return toast("Las repeticiones deben ser al menos 1");
    const set = { id: uid(), date: ui.date, exercise: ui.exercise, weight: Math.round(weight * 100) / 100, reps, ts: Date.now() };
    data.sets.push(set);
    save();
    const { prIds } = computeRecords();
    const record = prIds.has(set.id);
    flashLights(record);
    if (navigator.vibrate) navigator.vibrate(record ? [30, 60, 30] : 25);
    renderHeader();
    renderHoy();
    const n = data.sets.filter((s) => s.date === set.date && s.exercise === set.exercise).length;
    toast(record ? `Récord: ${fmt(set.weight)} kg en ${set.exercise}` : `Serie ${n} anotada`, "Deshacer", () => {
      data.sets = data.sets.filter((s) => s.id !== set.id);
      save(); render();
    }, record);
  }

  function deleteSet(id) {
    const s = data.sets.find((x) => x.id === id);
    if (!s) return;
    data.sets = data.sets.filter((x) => x.id !== id);
    save(); render();
    toast("Serie borrada", "Deshacer", () => { data.sets.push(s); save(); render(); });
  }

  let lightTimer;
  function flashLights(record) {
    const l = $("#lights");
    l.classList.remove("is-good", "is-record");
    void l.offsetWidth;
    l.classList.add(record ? "is-record" : "is-good");
    clearTimeout(lightTimer);
    lightTimer = setTimeout(() => l.classList.remove("is-good", "is-record"), record ? 2600 : 1500);
  }

  /* ---------- Hoja de ejercicios ---------- */
  const exSheet = $("#exSheet");
  function openExerciseSheet() {
    $("#exSearch").value = "";
    renderExList();
    exSheet.showModal();
    setTimeout(() => $("#exSearch").focus(), 50);
  }
  function renderExList() {
    const q = $("#exSearch").value.trim();
    const norm = (s) => s.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "");
    const { all, used } = knownExercises();
    const list = q ? all.filter((e) => norm(e).includes(norm(q))) : all;
    const exact = all.some((e) => norm(e) === norm(q));
    const counts = new Map();
    for (const s of data.sets) counts.set(s.exercise, (counts.get(s.exercise) || 0) + 1);
    $("#exList").innerHTML =
      (q && !exact ? `<button type="button" class="ex-opt is-new" data-pick="${esc(q)}">Agregar “${esc(q)}”<svg class="ic"><use href="#i-plus"/></svg></button>` : "") +
      list.map((e) => `<button type="button" class="ex-opt" data-pick="${esc(e)}">${esc(e)}${used.includes(e) ? `<small>${counts.get(e)} series</small>` : ""}</button>`).join("");
  }
  $("#exSearch").addEventListener("input", renderExList);
  $("#exSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); const first = $("#exList [data-pick]"); if (first) first.click(); }
  });
  $("#exList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (!b) return;
    exSheet.close();
    selectExercise(cap(b.dataset.pick.trim().replace(/\s+/g, " ")));
  });

  /* ---------- Bloque de un día (historial y calendario) ---------- */
  function dayBlock(date, prIds, { withSession = true } = {}) {
    const sets = setsOn(date);
    const exs = [...new Set(sets.map((s) => s.exercise))];
    const dates = sessionDates();
    const type = dayType(date);
    const sub = (type ? `<b>${esc(type)}</b>, ` : "") + [withSession ? `sesión ${dates.indexOf(date) + 1}` : "", `${sets.length} ${sets.length === 1 ? "serie" : "series"}`].filter(Boolean).join(", ");
    return `<article class="day">
      <div class="day-head">
        <h2 class="day-date">${esc(dayLong(date))}<small>${fromISO(date).getFullYear() !== new Date().getFullYear() ? fromISO(date).getFullYear() + ", " : ""}${sub}</small></h2>
        <button type="button" class="day-edit" data-open-day="${date}"><svg class="ic"><use href="#i-edit"/></svg>Editar</button>
      </div>
      ${exs.map((ex) => `<div class="ex-line"><span class="ex-line-name">${esc(ex)}</span><span class="ex-line-sets">${sets.filter((s) => s.exercise === ex).map((s) => `<span class="${prIds.has(s.id) ? "is-pr" : ""}">${fmt(s.weight)}×${s.reps}${prIds.has(s.id) ? " récord" : ""}</span>`).join("")}</span></div>`).join("")}
    </article>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open-day]");
    if (!b) return;
    ui.date = b.dataset.openDay;
    ui.exercise = null;
    show("hoy");
  });
  function emptyState(text, action) {
    return `<div class="empty"><div class="lights"><i></i><i></i><i></i></div><p>${text}</p>${action ? `<button type="button" class="btn btn-primary" data-goto="hoy" style="padding:0 22px">${action}</button>` : ""}</div>`;
  }
  document.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) { ui.date = todayISO(); show(g.dataset.goto); } });

  /* ---------- HISTORIAL ---------- */
  function renderHistory() {
    const dates = sessionDates().reverse();
    if (!dates.length) { $("#historyList").innerHTML = emptyState("Todavía no hay entrenamientos. Anota tu primera serie y aparecerá aquí.", "Registrar entrenamiento"); return; }
    const { prIds } = computeRecords();
    $("#historyList").innerHTML = dates.map((d) => dayBlock(d, prIds)).join("");
  }

  /* ---------- CALENDARIO ---------- */
  function renderCalendar() {
    const m = ui.calMonth;
    const y = m.getFullYear(), mo = m.getMonth();
    $("#calTitle").textContent = cap(m.toLocaleDateString("es-CL", { month: "long" })) + " " + y;
    const trained = new Set(sessionDates());
    const { prIds, prDates } = computeRecords();
    const monthPrefix = `${y}-${pad(mo + 1)}`;
    const inMonth = [...trained].filter((d) => d.startsWith(monthPrefix)).length;
    $("#calStats").innerHTML = `<b>${inMonth}</b> ${inMonth === 1 ? "día" : "días"} este mes, <b>${trained.size}</b> en total`;

    const first = new Date(y, mo, 1);
    const offset = (first.getDay() + 6) % 7; // lunes primero
    const days = new Date(y, mo + 1, 0).getDate();
    const t = todayISO();
    let html = ["L", "M", "M", "J", "V", "S", "D"].map((d, i) => `<span class="cal-dow" aria-hidden="true" title="${["lunes","martes","miércoles","jueves","viernes","sábado","domingo"][i]}">${d}</span>`).join("");
    for (let i = 0; i < offset; i++) html += `<span></span>`;
    for (let d = 1; d <= days; d++) {
      const iso = `${monthPrefix}-${pad(d)}`;
      const on = trained.has(iso);
      const cls = ["cal-cell", on && "is-on", prDates.has(iso) && "is-pr", iso === t && "is-today", iso === ui.calSel && "is-sel", iso > t && "is-future"].filter(Boolean).join(" ");
      const label = `${d} de ${m.toLocaleDateString("es-CL", { month: "long" })}${on ? ", entrenaste" : ""}${prDates.has(iso) ? ", récord" : ""}`;
      html += `<button type="button" class="${cls}" data-day="${iso}" aria-label="${label}" ${iso > t ? "disabled" : ""}><span>${d}</span></button>`;
    }
    $("#calGrid").innerHTML = html;
    $("#calNext").disabled = y === new Date().getFullYear() && mo === new Date().getMonth();
    $("#calNext").style.opacity = $("#calNext").disabled ? .3 : 1;

    const sel = ui.calSel && ui.calSel.startsWith(monthPrefix) ? ui.calSel : null;
    $("#calDay").innerHTML = sel
      ? (trained.has(sel) ? dayBlock(sel, prIds) : `<article class="day"><div class="day-head"><h2 class="day-date">${esc(dayLong(sel))}<small>Sin entrenamiento</small></h2><button type="button" class="day-edit" data-open-day="${sel}"><svg class="ic"><use href="#i-plus"/></svg>Registrar</button></div></article>`)
      : (!trained.size ? emptyState("Cada día que entrenes se encenderá aquí.", "Registrar entrenamiento") : "");
  }
  $("#calGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]");
    if (!b) return;
    ui.calSel = ui.calSel === b.dataset.day ? null : b.dataset.day;
    renderCalendar();
  });
  $("#calPrev").addEventListener("click", () => { ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() - 1, 1); renderCalendar(); });
  $("#calNext").addEventListener("click", () => { ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + 1, 1); renderCalendar(); });

  /* ---------- PROGRESO ---------- */
  function renderProgress() {
    const { used } = knownExercises();
    const sel = $("#progEx");
    const sorted = [...used].sort((a, b) => a.localeCompare(b, "es"));
    if (!used.length) {
      sel.parentElement.hidden = true; $("#ranges").hidden = true;
      $("#progBody").innerHTML = emptyState("Cuando registres series, aquí verás cómo sube tu peso máximo en cada ejercicio.", "Registrar entrenamiento");
      return;
    }
    sel.parentElement.hidden = false; $("#ranges").hidden = false;
    if (!ui.progEx || !used.includes(ui.progEx)) ui.progEx = used[0];
    sel.innerHTML = sorted.map((e) => `<option${e === ui.progEx ? " selected" : ""}>${esc(e)}</option>`).join("");
    for (const b of $$("#ranges button")) b.classList.toggle("is-on", Number(b.dataset.range) === ui.progRange);

    const all = data.sets.filter((s) => s.exercise === ui.progEx);
    // por sesión
    const byDate = new Map();
    for (const s of all) { if (!byDate.has(s.date)) byDate.set(s.date, []); byDate.get(s.date).push(s); }
    let running = -Infinity;
    const sessions = [...byDate.keys()].sort().map((date) => {
      const ss = byDate.get(date);
      const max = Math.max(...ss.map((s) => s.weight));
      const best = ss.filter((s) => s.weight === max).sort((a, b) => b.reps - a.reps)[0];
      const vol = ss.reduce((a, s) => a + s.weight * s.reps, 0);
      const pr = running !== -Infinity && max > running;
      running = Math.max(running, max);
      return { date, max, best, vol, pr, n: ss.length };
    });
    const t = todayISO();
    const shown = ui.progRange ? sessions.filter((s) => daysBetween(s.date, t) <= ui.progRange) : sessions;
    const top = sessions.reduce((a, s) => (s.max > a.max || (s.max === a.max && s.date < a.date) ? s : a), sessions[0]);

    let delta = "";
    if (shown.length >= 2) {
      const d = shown[shown.length - 1].max - shown[0].max;
      delta = `<div class="pr-delta"><b>${d > 0 ? "+" : d < 0 ? "−" : ""}${fmt(Math.abs(d))} kg</b>${ui.progRange ? "en el período" : "desde el inicio"}</div>`;
    }
    $("#progBody").innerHTML = `
      <p class="pr-label">Récord, ${esc(dayFull(top.date))}</p>
      <div class="pr-head"><div class="pr-big">${fmt(top.max)}<small>kg</small></div>${delta}</div>
      ${shown.length ? `<div class="chart-wrap" id="chartWrap">${(CH.w = Math.max(280, $("#progBody").clientWidth + 8), chartSVG(shown))}<div class="tip" id="tip" hidden></div></div>` : `<p class="today-empty">Sin sesiones en este período.</p>`}
      <h2 class="table-title">Sesiones</h2>
      <table>
        <thead><tr><th scope="col">Fecha</th><th scope="col">Peso máx.</th><th scope="col">Mejor serie</th><th scope="col">Volumen</th></tr></thead>
        <tbody>${[...shown].reverse().map((s) => `<tr><td>${esc(dayFull(s.date))}</td><td class="w${s.pr ? " is-pr" : ""}">${fmt(s.max)}</td><td>${fmt(s.best.weight)}×${s.best.reps}</td><td>${fmt(Math.round(s.vol))} kg</td></tr>`).join("")}</tbody>
      </table>`;
    if (shown.length) wireChart(shown);
  }
  $("#progEx").addEventListener("change", (e) => { ui.progEx = e.target.value; renderProgress(); });
  $("#ranges").addEventListener("click", (e) => { const b = e.target.closest("[data-range]"); if (b) { ui.progRange = Number(b.dataset.range); renderProgress(); } });

  const CH = { w: 360, h: 230, l: 40, r: 14, t: 16, b: 28 };
  function niceTicks(min, max, count = 4) {
    if (min === max) { min -= 5; max += 5; }
    const span = max - min;
    const raw = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }
  function chartGeom(pts) {
    const ticks = niceTicks(Math.min(...pts.map((p) => p.max)), Math.max(...pts.map((p) => p.max)));
    const yMin = ticks[0], yMax = ticks[ticks.length - 1];
    const t0 = fromISO(pts[0].date).getTime(), t1 = fromISO(pts[pts.length - 1].date).getTime();
    const iw = CH.w - CH.l - CH.r, ih = CH.h - CH.t - CH.b;
    const x = (d) => CH.l + (t1 === t0 ? iw / 2 : ((fromISO(d).getTime() - t0) / (t1 - t0)) * iw);
    const y = (v) => CH.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
    return { ticks, x, y };
  }
  function chartSVG(pts) {
    const { ticks, x, y } = chartGeom(pts);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.max).toFixed(1)}`).join("");
    const xl = pts.length > 1 ? [pts[0], pts[pts.length - 1]] : [pts[0]];
    return `<svg class="chart" viewBox="0 0 ${CH.w} ${CH.h}" role="img" aria-label="Peso máximo por sesión de ${esc(ui.progEx)}">
      <g class="grid">${ticks.map((t) => `<line x1="${CH.l}" x2="${CH.w - CH.r}" y1="${y(t)}" y2="${y(t)}"/>`).join("")}</g>
      <g class="axis">${ticks.map((t) => `<text x="${CH.l - 8}" y="${y(t) + 4}" text-anchor="end">${fmt(t)}</text>`).join("")}
      ${xl.map((p, i) => `<text x="${x(p.date)}" y="${CH.h - 8}" text-anchor="${xl.length === 1 ? "middle" : i ? "end" : "start"}">${esc(dayShort(p.date))}</text>`).join("")}</g>
      ${pts.length > 1 ? `<path class="series" d="${line}"/>` : ""}
      <line class="cross" id="cross" y1="${CH.t}" y2="${CH.h - CH.b}" x1="-10" x2="-10"/>
      ${pts.map((p) => `<circle class="pt${p.pr ? " is-pr" : ""}" cx="${x(p.date)}" cy="${y(p.max)}" r="${p.pr ? 5.5 : 4}"/>`).join("")}
      <circle class="hot" id="hot" r="9" cx="-20" cy="-20"/>
    </svg>`;
  }
  function wireChart(pts) {
    const wrap = $("#chartWrap"), svg = $(".chart", wrap), tip = $("#tip"), cross = $("#cross"), hot = $("#hot");
    const { x, y } = chartGeom(pts);
    const pick = (clientX) => {
      const r = svg.getBoundingClientRect();
      const vx = ((clientX - r.left) / r.width) * CH.w;
      let best = pts[0];
      for (const p of pts) if (Math.abs(x(p.date) - vx) < Math.abs(x(best.date) - vx)) best = p;
      const px = x(best.date), py = y(best.max);
      cross.setAttribute("x1", px); cross.setAttribute("x2", px);
      hot.setAttribute("cx", px); hot.setAttribute("cy", py);
      tip.innerHTML = `<b>${fmt(best.max)} kg${best.pr ? ", récord" : ""}</b>${esc(dayFull(best.date))}, mejor ${fmt(best.best.weight)}×${best.best.reps}`;
      tip.hidden = false;
      const left = (px / CH.w) * r.width;
      const tw = tip.offsetWidth;
      tip.style.left = Math.min(Math.max(left - tw / 2, 0), r.width - tw) + "px";
      tip.style.top = Math.max((py / CH.h) * r.height - tip.offsetHeight - 14, -8) + "px";
    };
    const hide = () => { tip.hidden = true; cross.setAttribute("x1", -10); cross.setAttribute("x2", -10); hot.setAttribute("cx", -20); };
    wrap.addEventListener("pointerdown", (e) => pick(e.clientX));
    wrap.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) pick(e.clientX); });
    wrap.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
  }

  /* ---------- Respaldo ---------- */
  const backupSheet = $("#backupSheet"), importSheet = $("#importSheet");
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  for (const d of [exSheet, backupSheet, importSheet, typeSheet, incSheet]) d.addEventListener("click", (e) => { if (e.target === d) d.close(); });

  $("#backupBtn").addEventListener("click", () => {
    const n = data.sets.length, s = sessionDates().length;
    $("#backupInfo").innerHTML = n ? `Tienes <b>${n}</b> series en <b>${s}</b> ${s === 1 ? "sesión" : "sesiones"}.` : "Aún no tienes datos para respaldar.";
    $("#exportBtn").disabled = !n;
    backupSheet.showModal();
  });
  $("#exportBtn").addEventListener("click", () => {
    const payload = { app: "GymTracker", version: 1, exportedAt: new Date().toISOString(), sets: [...data.sets].sort(sortSets), exercises: data.exercises, days: data.days, dayTypes: data.dayTypes, settings: data.settings };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gymtracker-respaldo-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    backupSheet.close();
    toast("Respaldo exportado a Descargas");
  });
  $("#importBtn").addEventListener("click", () => $("#importFile").click());

  let pending = null;
  function validSet(s) {
    return s && typeof s === "object" && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && typeof s.exercise === "string" && s.exercise.trim() &&
      Number.isFinite(Number(s.weight)) && Number(s.weight) >= 0 && Number.isInteger(Number(s.reps)) && Number(s.reps) >= 1;
  }
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const sets = Array.isArray(json) ? json : json.sets;
      if (!Array.isArray(sets)) throw new Error("formato");
      const good = sets.filter(validSet).map((s, i) => ({
        id: String(s.id || uid() + i), date: s.date, exercise: s.exercise.trim(),
        weight: Number(s.weight), reps: Number(s.reps), ts: Number(s.ts) || i,
      }));
      if (!good.length) throw new Error("vacío");
      const extra = normalize(Array.isArray(json) ? {} : json);
      pending = { sets: good, exercises: extra.exercises, days: extra.days, dayTypes: extra.dayTypes, settings: extra.settings };
      const dates = good.map((s) => s.date).sort();
      const skipped = sets.length - good.length;
      $("#importInfo").innerHTML = `El archivo tiene <b>${good.length}</b> series del ${esc(dayFull(dates[0]))} al ${esc(dayFull(dates[dates.length - 1]))}.${skipped ? ` Se omitirán ${skipped} filas con datos incompletos.` : ""} Tienes <b>${data.sets.length}</b> series ahora en este teléfono.`;
      backupSheet.close();
      importSheet.showModal();
    } catch (err) {
      toast("Ese archivo no es un respaldo de GymTracker. Elige el .json que exportaste.");
    }
  });
  $("#importMerge").addEventListener("click", () => {
    if (!pending) return;
    const ids = new Set(data.sets.map((s) => s.id));
    const sig = new Set(data.sets.map((s) => `${s.date}|${s.exercise}|${s.weight}|${s.reps}|${s.ts}`));
    let added = 0;
    for (const s of pending.sets) {
      if (ids.has(s.id) || sig.has(`${s.date}|${s.exercise}|${s.weight}|${s.reps}|${s.ts}`)) continue;
      data.sets.push(s); added++;
    }
    data.exercises = [...new Set([...data.exercises, ...pending.exercises])];
    data.dayTypes = [...new Set([...data.dayTypes, ...pending.dayTypes])];
    data.days = { ...pending.days, ...data.days }; // la rutina ya anotada en el teléfono manda
    finishImport(`Importadas ${added} series nuevas`);
  });
  $("#importReplace").addEventListener("click", () => {
    if (!pending) return;
    data = normalize({ sets: pending.sets, exercises: pending.exercises, days: pending.days, dayTypes: pending.dayTypes, settings: pending.settings });
    finishImport(`Datos reemplazados: ${pending.sets.length} series`);
  });
  function finishImport(msg) {
    save(); pending = null; importSheet.close();
    ui.exercise = null; render(); toast(msg);
  }

  /* ---------- Aviso ---------- */
  let toastTimer;
  function toast(text, actionLabel = "", action = null, record = false) {
    const el = $("#toast"), btn = $("#toastAction");
    $("#toastText").textContent = text;
    btn.textContent = actionLabel;
    btn.onclick = action ? () => { action(); el.hidden = true; } : null;
    el.classList.toggle("is-record", record);
    el.hidden = false;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 5000 : 3200);
  }

  /* ---------- Inicio ---------- */
  // si la app queda abierta pasada la medianoche, "Hoy" avanza
  let lastToday = todayISO();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    const t = todayISO();
    if (t !== lastToday) { if (ui.date === lastToday) { ui.date = t; ui.exercise = null; } lastToday = t; render(); }
  });

  show("hoy");

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
