// Prayer times widget for Scriptable (medium size, black and white).
// Widget parameter: leave empty for the dial, or type  quote  for the daily quote.

const SITE = "https://YOURUSERNAME.github.io/istiqamah/"; // your app address, keep the slash at the end
const ASR_MITHL = 2; // 2 = Hanafi, 1 = other scholars

const MODE = (args.widgetParameter || "dial").toString().trim().toLowerCase();
const QUOTES = [
  ["Qur’an 94:6", "Indeed, with hardship comes ease."],
  ["Qur’an 2:152", "Remember Me, and I will remember you."],
  ["Qur’an 13:28", "In the remembrance of Allah do hearts find rest."],
  ["Qur’an 2:153", "Indeed, Allah is with the patient."],
  ["Qur’an 65:3", "Whoever relies upon Allah, He is sufficient for them."],
  ["Qur’an 20:114", "My Lord, increase me in knowledge."],
  ["Bukhari & Muslim", "The most beloved deeds to Allah are the consistent ones."],
  ["Bukhari", "The best of you are those who learn the Qur’an and teach it."],
  ["Bukhari & Muslim", "Keep refreshing the Qur’an. It slips away faster than a camel from its rope."],
  ["Muslim", "Whoever walks a path seeking knowledge, Allah makes easy a path to Paradise."],
  ["Bukhari", "Two blessings many people lose: health and free time."],
  ["Small steps", "Small and steady beats big and rare."],
  ["One ayah", "Even one ayah today keeps your streak alive."],
  ["Begin", "Say bismillah and open the mushaf."]
];
const WHITE = new Color("#ffffff"), GREY = new Color("#8a8a8a"), DIM = new Color("#5a5a5a"),
      LINE = new Color("#2b2b2b"), SOFT = new Color("#9a9a9a"), BLACK = new Color("#000000");

function p2(n) { return ("0" + n).slice(-2); }
function f12(m) { const h = Math.floor(m / 60) % 24; return (h % 12 || 12) + ":" + p2(m % 60); }
function at(d, m) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, m); }
function cd(ms) { const m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? h + "h " + (m % 60) + "m" : m + " min"; }

async function loadTimetable() {
  const fm = FileManager.local(), path = fm.joinPath(fm.documentsDirectory(), "elm-prayer.json");
  let cached = null;
  try { if (fm.fileExists(path)) { cached = JSON.parse(fm.readString(path)); if (Date.now() - fm.modificationDate(path).getTime() < 6 * 864e5) return cached; } } catch (e) {}
  try {
    const txt = await new Request(SITE + "prayer.js?" + Date.now()).loadString();
    const w = {}; new Function("window", txt)(w);
    if (w.ELM && w.ELM.d) { fm.writeString(path, JSON.stringify(w.ELM)); return w.ELM; }
  } catch (e) {}
  return cached;
}
function dayTimes(E, d) {
  if (!E || d.getFullYear() !== E.y) return null;
  const r = E.d[p2(d.getMonth() + 1) + "-" + p2(d.getDate())]; if (!r) return null;
  return { fajr: r[0], sunrise: r[2], zuhr: r[3], asr: ASR_MITHL == 1 ? r[5] : r[6], maghrib: r[8], isha: r[10] };
}
const ORDER = [["fajr", "Fajr"], ["sunrise", "Sunrise"], ["zuhr", "Zuhr"], ["asr", "Asr"], ["maghrib", "Maghrib"], ["isha", "Isha"]];
function seq(E, d) { const T = dayTimes(E, d); return T ? ORDER.map(p => ({ k: p[0], n: p[1], t: at(d, T[p[0]]) })) : []; }

// Widgets differ in size between iPhones, so the layout is built at your phone's real widget size.
function widgetSize() {
  const sc = Device.screenSize(), long = Math.max(sc.width, sc.height), short = Math.min(sc.width, sc.height);
  const t = { 932: [364, 170], 926: [364, 170], 896: [360, 169], 852: [338, 158], 844: [338, 158], 812: [329, 155], 736: [348, 159], 667: [321, 148], 568: [292, 141] };
  if (t[long]) return t[long];
  const w = Math.round(short * 0.865); return [w, Math.round(w * 0.4675)];
}

const E = await loadTimetable();
const now = new Date();
const day = (o) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + o);
const T = dayTimes(E, now);

// Everything is designed on a 340 x 160 card, then scaled by K to the real widget size.
const [WW, WH] = widgetSize();
const K = Math.min(WW / 340, WH / 160);

function painter(w, h) { // a transparent drawing area of w x h design units
  const dc = new DrawContext(); dc.size = new Size(w * K, h * K); dc.opaque = false; dc.respectScreenScale = true;
  return {
    dc,
    txt(t, x, yb, size, color, align, light) {
      dc.setFont(light ? Font.lightSystemFont(size * K) : Font.systemFont(size * K)); dc.setTextColor(color);
      const top = (yb - size * 0.92) * K, hh = size * 1.5 * K, ww = 220 * K;
      if (align === "center") { dc.setTextAlignedCenter(); dc.drawTextInRect(t, new Rect(x * K - ww / 2, top, ww, hh)); }
      else if (align === "right") { dc.setTextAlignedRight(); dc.drawTextInRect(t, new Rect(x * K - ww, top, ww, hh)); }
      else { dc.setTextAlignedLeft(); dc.drawTextInRect(t, new Rect(x * K, top, ww, hh)); }
    },
    circle(cx, cy, r, fill, stroke, lw) {
      const p = new Path(); p.addEllipse(new Rect((cx - r) * K, (cy - r) * K, 2 * r * K, 2 * r * K));
      if (fill) { dc.addPath(p); dc.setFillColor(fill); dc.fillPath(); }
      if (stroke) { dc.addPath(p); dc.setStrokeColor(stroke); dc.setLineWidth(lw * K); dc.strokePath(); }
    },
    pill(x, y, w2, h2, r, color) { const p = new Path(); p.addRoundedRect(new Rect(x * K, y * K, w2 * K, h2 * K), r * K, r * K); dc.addPath(p); dc.setFillColor(color); dc.fillPath(); },
    arc(cx, cy, r, m0, m1, color, w2) { // minutes of the day, 12 o'clock = midnight
      const a0 = m0 / 4, a1 = m1 / 4, n = Math.max(2, Math.ceil((a1 - a0) / 3)), pts = [];
      for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; pts.push(new Point((cx + r * Math.sin(a)) * K, (cy - r * Math.cos(a)) * K)); }
      const p = new Path(); p.move(pts[0]); p.addLines(pts); dc.addPath(p); dc.setStrokeColor(color); dc.setLineWidth(w2 * K); dc.strokePath();
    }
  };
}

const widget = new ListWidget();
widget.backgroundColor = BLACK;
widget.setPadding(0, 0, 0, 0);
widget.url = SITE + "#prayer";
let refresh = new Date(now.getTime() + 60000);

if (!T) {
  const P = painter(340, 160);
  P.txt("Timetable not loaded", 20, 70, 16, WHITE, "left");
  P.txt("Check the SITE line in the script", 20, 94, 12, GREY, "left");
  widget.backgroundImage = P.dc.getImage();
} else {
  const all = seq(E, day(-1)).concat(seq(E, day(0)), seq(E, day(1)));
  let prev = null, next = null;
  all.forEach(e => { if (e.t <= now) prev = e; else if (!next) next = e; });
  const cur = prev && prev.k !== "sunrise" && prev.t.toDateString() === now.toDateString() ? prev.k : null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const left_ms = next ? next.t.getTime() - now.getTime() : 0;
  const lm = Math.max(1, Math.ceil(left_ms / 60000));
  const leftTxt = (lm >= 60 ? Math.floor(lm / 60) + "h " + (lm % 60) + "m" : lm + "m") + " left";

  // right: six times, 172 x 160
  const L = painter(172, 160);
  [["Fajr", "fajr"], ["Sunrise", "sunrise"], ["Zuhr", "zuhr"], ["Asr", "asr"], ["Maghrib", "maghrib"], ["Isha", "isha"]].forEach((r, i) => {
    const y = 31 + i * 21, m = T[r[1]], sun = r[1] === "sunrise", st = r[1] === cur ? 2 : (m <= nowMin ? 0 : 1);
    if (st === 2) L.pill(0, y - 14.5, 152, 20, 10, WHITE);
    const col = st === 0 ? DIM : (st === 2 ? BLACK : (sun ? SOFT : WHITE));
    if (sun) L.circle(13, y - 4, 2.5, null, col, 1);
    else if (st === 0) L.circle(13, y - 4, 3.5, DIM); else if (st === 2) L.circle(13, y - 4, 3.5, BLACK); else L.circle(13, y - 4, 3.5, null, WHITE, 1);
    L.txt(r[0], 26, y, 13, col, "left"); L.txt(f12(m), 142, y, 13, col, "right");
  });

  // left: 140 x 160, everything drawn in one picture so it is centred exactly
  const Y = dayTimes(E, day(-1)), M = dayTimes(E, day(1));
  let a0, b0;
  if (nowMin < T.fajr && Y) { a0 = at(day(-1), Y.maghrib).getTime(); b0 = at(day(0), T.fajr).getTime(); }
  else { a0 = at(day(0), T.maghrib).getTime(); b0 = M ? at(day(1), M.fajr).getTime() : at(day(1), T.fajr).getTime(); }
  const tj = new Date(a0 + (b0 - a0) * 2 / 3);

  const Q = painter(140, 160), cx = 70, cy = 66, r = 50;
  if (MODE === "quote") {
    const q = QUOTES[Math.floor(now.getTime() / 864e5 - now.getTimezoneOffset() / 1440) % QUOTES.length];
    Q.txt(now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), 4, 31, 11, GREY, "left");
    const qs = q[1].length > 62 ? 12 : (q[1].length > 44 ? 13 : 14);
    Q.dc.setFont(Font.lightSystemFont(qs * K)); Q.dc.setTextColor(WHITE); Q.dc.setTextAlignedLeft();
    Q.dc.drawTextInRect(q[1], new Rect(4 * K, 40 * K, 130 * K, 82 * K));
    Q.txt(q[0], 4, 136, 11, GREY, "left");
  } else {
    const wins = [[0, T.fajr, "n"], [T.fajr, T.sunrise, "fajr"], [T.sunrise, T.zuhr, "n"], [T.zuhr, T.asr, "zuhr"], [T.asr, T.maghrib, "asr"], [T.maghrib, T.isha, "maghrib"], [T.isha, 1440, "isha"]];
    wins.forEach(w => {
      const a = w[0] + 6, b = w[1] - 6; if (b <= a) return;
      let col = LINE, wd = 4;
      if (w[2] !== "n") { if (w[2] === cur) { col = WHITE; wd = 7; } else if (w[1] <= nowMin) col = new Color("#3a3a3a"); else col = new Color("#8a8a8a"); }
      Q.arc(cx, cy, r, a, b, col, wd);
    });
    const ang = nowMin / 4 * Math.PI / 180; Q.circle(cx + r * Math.sin(ang), cy - r * Math.cos(ang), 5, BLACK, WHITE, 2);
    Q.txt(next ? next.n : "", cx, cy - 2, next && next.n.length > 6 ? 18 : 22, WHITE, "center", true);
    if (next) Q.txt(leftTxt, cx, cy + 20, 11, SOFT, "center");
    Q.txt("Duha " + f12(T.sunrise + 20) + "  ·  Tahajjud " + f12(tj.getHours() * 60 + tj.getMinutes()), cx, 148, 10.5, GREY, "center");
  }

  const root = widget.addStack(); root.layoutHorizontally(); root.centerAlignContent();
  root.addSpacer();
  const li = root.addImage(Q.dc.getImage()); li.imageSize = new Size(140 * K, 160 * K);
  root.addSpacer(8 * K);
  const ri = root.addImage(L.dc.getImage()); ri.imageSize = new Size(172 * K, 160 * K);
  root.addSpacer();
}

widget.refreshAfterDate = refresh;
if (config.runsInWidget) Script.setWidget(widget); else await widget.presentMedium();
Script.complete();
