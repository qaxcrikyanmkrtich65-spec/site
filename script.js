"use strict";

/* ===== ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ ===== */
const SMS_PHONE = "044535454";  // պատվերի SMS-ի համարը
const SMS_ENDPOINT = "";        // սերվերի հասցե՝ ավտոմատ SMS-ի համար (տես բացատրությունը)
const ADMIN_PIN = "1234";       // ադմին վահանակի կոդը՝ փոխեք

const CATS = {
  cases: ["Պատյաններ", "📱"], glass: ["Ապակիներ", "🛡️"], chargers: ["Լիցքավորիչներ", "⚡"],
  cables: ["Մալուխներ", "🔌"], earphones: ["Ականջակալներ", "🎧"]
};
const SEED = [{
  id: 1700000000001, name: "Crystal Case (Թափանցիկ պաշտպանիչ պատյան)", category: "cases",
  price: 3000, oldPrice: 4500, tag: "Զեղչ", image: "",
  description: "Թափանցիկ պատյան՝ հարվածակայուն եզրերով և տեսախցիկի պաշտպանությամբ։ Չի դեղնում։"
}];

/* ===== ՊԱՀՈՑ ===== */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
let products = load("mobilab_gyumri_products", SEED);
let orders = load("mobilab_gyumri_orders", []);
let cart = load("mobilab_cart", []);
let cat = "all", query = "", editId = null;

const $ = (s) => document.querySelector(s);
const money = (n) => Number(n).toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ֏";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icon = (p) => (CATS[p.category] || ["", "📦"])[1];
const pic = (p) => p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : "";

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2400);
}

/* ===== ԲԱՑԵԼ/ՓԱԿԵԼ ===== */
function show(el, on) {
  el.classList.toggle("on", on);
  el.setAttribute("aria-hidden", String(!on));
  const anyOpen = document.querySelector(".drawer.on, .modal.on");
  $("#veil").classList.toggle("on", !!document.querySelector(".drawer.on"));
  document.body.style.overflow = anyOpen ? "hidden" : "";
}
function closeAll() { document.querySelectorAll(".drawer.on, .modal.on").forEach((e) => show(e, false)); }

/* ===== ԿԱՏԱԼՈԳ ===== */
function renderChips() {
  const items = [["all", "Բոլորը"], ...Object.entries(CATS).map(([k, v]) => [k, v[0]])];
  $("#chips").innerHTML = items.map(([k, n]) =>
    `<button class="chip" data-cat="${k}" aria-pressed="${k === cat}">${n}</button>`).join("");
}

function renderGrid() {
  const q = query.trim().toLowerCase();
  const list = products.filter((p) =>
    (cat === "all" || p.category === cat) &&
    (!q || (p.name + " " + (p.description || "")).toLowerCase().includes(q)));
  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list.map((p) => `
    <article class="card">
      <div class="card__img" data-detail="${p.id}">
        ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}${icon(p)}${pic(p)}
      </div>
      <div class="card__body">
        <h3 data-detail="${p.id}">${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <div class="price"><b>${money(p.price)}</b>${p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : ""}</div>
        <button class="btn btn--add" data-add="${p.id}">Ավելացնել</button>
      </div>
    </article>`).join("");
}

function openDetail(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  $("#detailBody").innerHTML = `
    <div class="detail">
      <div class="detail__img">${icon(p)}${pic(p)}</div>
      <div class="pad">
        <h2>${esc(p.name)}</h2>
        <div class="price"><b>${money(p.price)}</b>${p.oldPrice ? `<s>${money(p.oldPrice)}</s>` : ""}</div>
        <p>${esc(p.description)}</p>
        <div class="stack">
          <button class="btn" data-add="${p.id}" data-then="cart">Ավելացնել և պատվիրել</button>
          <button class="btn btn--ghost" data-close>Փակել</button>
        </div>
      </div>
    </div>`;
  show($("#detail"), true);
}

/* ===== ԶԱՄԲՅՈՒՂ ===== */
const total = () => cart.reduce((s, i) => s + (products.find((p) => p.id === i.id)?.price || 0) * i.qty, 0);

function addToCart(id) {
  const it = cart.find((i) => i.id === id);
  it ? it.qty++ : cart.push({ id, qty: 1 });
  renderCart(); toast("Ավելացվեց զամբյուղ");
}
function qty(id, d) {
  const it = cart.find((i) => i.id === id);
  if (!it) return;
  it.qty += d;
  if (it.qty <= 0) cart = cart.filter((i) => i.id !== id);
  renderCart();
}

function renderCart() {
  cart = cart.filter((i) => products.some((p) => p.id === i.id));
  save("mobilab_cart", cart);
  $("#cnt").textContent = cart.reduce((s, i) => s + i.qty, 0);
  $("#total").textContent = money(total());
  $("#form").hidden = !cart.length;
  $("#cartBody").innerHTML = cart.length ? cart.map((i) => {
    const p = products.find((x) => x.id === i.id);
    return `<div class="line">
      <div class="line__ic">${icon(p)}${pic(p)}</div>
      <div><h4>${esc(p.name)}</h4><span>${money(p.price)}</span></div>
      <div class="qty"><button data-q="${p.id}:-1" aria-label="Պակասեցնել">−</button><b>${i.qty}</b><button data-q="${p.id}:1" aria-label="Ավելացնել">+</button></div>
    </div>`;
  }).join("") : `<p class="empty">Զամբյուղը դատարկ է։ Ընտրեք ապրանք կատալոգից։</p>`;
}

/* ===== ՊԱՏՎԵՐ ԵՎ SMS ===== */
function smsText(o) {
  return [
    `Նոր պատվեր ${o.id}`,
    `Անուն: ${o.customerName}`,
    `Հեռ: ${o.phone}`,
    `Հասցե: ${o.address}`,
    ...o.items.map((i) => `- ${i.name} x${i.qty} = ${i.price * i.qty} դրամ`),
    `Ընդամենը: ${o.totalAmount} դրամ (կանխիկ)`,
    o.changeOption
  ].join("\n");
}

function showDone(o, text, link, auto) {
  $("#doneBody").innerHTML = `
    <div class="pad done">
      <h2>Պատվերն ընդունված է</h2>
      <p>${auto ? "Պատվերը ուղարկվեց մեզ։ Շուտով կզանգահարենք։" : "Վերջին քայլ՝ սեղմեք «Ուղարկել SMS» և հեռախոսի հավելվածում հաստատեք ուղարկումը։"}</p>
      <div class="box">${esc(text)}</div>
      <div class="stack">
        ${auto ? "" : `<a class="btn" href="${link}">Ուղարկել SMS 044 53 54 54</a>
        <button class="btn btn--ghost" id="copyOrder">Պատճենել պատվերի տեքստը</button>`}
        <button class="btn btn--ghost" data-close>Փակել</button>
      </div>
    </div>`;
  const c = $("#copyOrder");
  if (c) c.onclick = () => navigator.clipboard?.writeText(text).then(() => toast("Պատճենվեց"), () => toast("Չհաջողվեց պատճենել"));
  show($("#done"), true);
}

async function checkout(e) {
  e.preventDefault();
  const f = e.target, err = $("#err");
  const name = f.name.value.trim(), phone = f.phone.value.trim(), address = f.address.value.trim();
  if (name.length < 2) return void (err.textContent = "Գրեք ձեր անունը");
  if (!/^[+\d][\d\s()-]{6,}$/.test(phone)) return void (err.textContent = "Հեռախոսահամարը սխալ է");
  if (address.length < 4) return void (err.textContent = "Գրեք առաքման հասցեն");
  err.textContent = "";

  const o = {
    id: "MOB-" + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toLocaleString("hy-AM", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
    customerName: name, phone, address, changeOption: f.change.value,
    items: cart.map((i) => { const p = products.find((x) => x.id === i.id); return { id: p.id, name: p.name, price: p.price, qty: i.qty }; }),
    totalAmount: total(), status: "Նոր (կանխիկ)"
  };
  orders.unshift(o); save("mobilab_gyumri_orders", orders);
  const text = smsText(o);
  const link = `sms:${SMS_PHONE}?&body=${encodeURIComponent(text)}`;

  cart = []; renderCart(); f.reset();
  show($("#cart"), false);

  if (SMS_ENDPOINT) {
    try {
      const r = await fetch(SMS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: SMS_PHONE, text, order: o }) });
      if (!r.ok) throw new Error(r.status);
      return showDone(o, text, link, true);
    } catch (x) { /* անցնում ենք SMS հավելվածին */ }
  }
  showDone(o, text, link, false);
  location.href = link;   // փորձում ենք անմիջապես բացել SMS հավելվածը
}

/* ===== ԱԴՄԻՆ ===== */
function renderAdmin() {
  $("#pform").category.innerHTML = Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join("");
  $("#plist").innerHTML = products.length ? products.map((p) => `
    <div class="arow"><div>${esc(p.name)}<small>${money(p.price)}</small></div>
    <div><button class="btn btn--sm" data-edit="${p.id}">Խմբագրել</button><button class="btn btn--del" data-del="${p.id}">Ջնջել</button></div></div>`).join("")
    : `<p class="order">Ապրանք չկա</p>`;
  $("#olist").innerHTML = orders.length ? orders.map((o) => `
    <div class="order"><b>${esc(o.id)}</b> · ${esc(o.date)} · ${money(o.totalAmount)}<br>
    ${esc(o.customerName)}, ${esc(o.phone)}<br>${esc(o.address)}
    <ul>${(o.items || []).map((i) => `<li>${esc(i.name)} — ${i.qty} հատ</li>`).join("")}</ul></div>`).join("")
    : `<p class="order">Պատվերներ դեռ չկան</p>`;
}

function saveProduct(e) {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(), category: f.category.value, price: Number(f.price.value),
    oldPrice: f.oldPrice.value ? Number(f.oldPrice.value) : 0, tag: f.tag.value.trim(),
    image: f.image.value.trim(), description: f.description.value.trim()
  };
  if (!data.name || !(data.price >= 0)) return;
  if (editId) products = products.map((p) => p.id === editId ? { ...p, ...data } : p);
  else products.unshift({ id: Date.now(), ...data });
  save("mobilab_gyumri_products", products);
  resetForm(); renderAdmin(); renderGrid(); renderCart(); toast("Պահպանվեց");
}
function resetForm() {
  editId = null; $("#pform").reset();
  $("#pformTitle").textContent = "Նոր ապրանք"; $("#pcancel").hidden = true;
}

/* ===== ԻՐԱԴԱՐՁՈՒԹՅՈՒՆՆԵՐ ===== */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cat],[data-detail],[data-add],[data-q],[data-close],[data-edit],[data-del]");
  if (!t) return;
  const d = t.dataset;
  if (d.cat) { cat = d.cat; renderChips(); renderGrid(); }
  else if (d.detail) openDetail(+d.detail);
  else if (d.add) { addToCart(+d.add); if (d.then === "cart") { show($("#detail"), false); show($("#cart"), true); } }
  else if (d.q) { const [id, n] = d.q.split(":"); qty(+id, +n); }
  else if (d.edit) {
    const p = products.find((x) => x.id === +d.edit), f = $("#pform");
    editId = p.id;
    ["name", "category", "price", "oldPrice", "tag", "image", "description"].forEach((k) => { f[k].value = p[k] ?? ""; });
    $("#pformTitle").textContent = "Խմբագրել ապրանքը"; $("#pcancel").hidden = false;
    $("#admin .sheet").scrollTo({ top: 0, behavior: "smooth" });
  } else if (d.del) {
    if (!confirm("Ջնջե՞լ ապրանքը։")) return;
    products = products.filter((p) => p.id !== +d.del);
    save("mobilab_gyumri_products", products); renderAdmin(); renderGrid(); renderCart();
  } else if ("close" in d) closeAll();
});

$("#veil").onclick = closeAll;
document.querySelectorAll(".modal").forEach((m) => m.addEventListener("mousedown", (e) => { if (e.target === m) closeAll(); }));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
$("#openCart").onclick = () => show($("#cart"), true);
$("#form").onsubmit = checkout;
$("#pform").onsubmit = saveProduct;
$("#pcancel").onclick = resetForm;
$("#openAdmin").onclick = () => {
  if (prompt("Ադմինի կոդը") !== ADMIN_PIN) return;
  renderAdmin(); show($("#admin"), true);
};
const onSearch = (e) => { query = e.target.value; $("#q").value = query; $("#q2").value = query; renderGrid(); };
$("#q").oninput = onSearch; $("#q2").oninput = onSearch;

renderChips(); renderGrid(); renderCart();
