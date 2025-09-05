
const MODULE_ID = "marvel-multiverse-chat-power-details";
const MCPD_VER = "1.0.3";

Hooks.once("ready", () => {
  console.log(`[${MODULE_ID}] v${MCPD_VER} ready`);
  // Global observer: if another module later mutates a message (e.g., adds "Aplicar/½ Dano/Curar"),
  // we remove our box from that message.
  const chat = document.querySelector("#chat-log");
  if (chat){
    const obs = new MutationObserver((mlist) => {
      for (const m of mlist){
        for (const node of (m.addedNodes || [])){
          scrubIfResultCard(node);
        }
        if (m.target) scrubIfResultCard(m.target);
      }
    });
    obs.observe(chat, { childList: true, subtree: true });
  }
});

const norm  = (s) => String(s||"").trim().toLowerCase();
const clean = (s) => norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();

function parseFromFlavor(flavor){
  const out = {};
  const raw = String(flavor||"");
  const rxPairs = Array.from(raw.matchAll(/([a-zA-Z]+)\s*:\s*([^<\n\r]+)/g));
  for (const m of rxPairs){
    const k = m[1].toLowerCase();
    const v = m[2].trim();
    out[k] = v;
  }
  const type = ["power","poder","weapon","trait","origin","occupation","item"].find(k => k in out);
  const name = type ? out[type] : null;
  return { type: (type||"").toLowerCase(), name };
}

function resolveActor(message){
  try{ const sid = message?.speaker?.actor; if (sid){ const a = game.actors?.get?.(sid); if (a) return a; } }catch{}
  try{ const tid = message?.speaker?.token; if (tid){ const t = canvas?.tokens?.get?.(tid); if (t?.actor) return t.actor; } }catch{}
  try{
    const alias = message?.speaker?.alias;
    if (alias){
      const c = clean(alias);
      for (const t of canvas?.tokens?.placeables || []){ if (clean(t?.actor?.name) === c) return t.actor; }
      const a = game.actors?.getName?.(alias) || game.actors?.find?.(x => clean(x.name) === c);
      if (a) return a;
    }
  }catch{}
  const targets = Array.from(game.user?.targets || []);
  if (targets.length && targets[0]?.actor) return targets[0].actor;
  return null;
}

function findItemOnActor(actor, type, name){
  if (!actor || !name) return null;
  const n = clean(name);
  try{
    let it = actor.items.find(i => clean(i.name) === n && (!type || i.type === type)); if (it) return it;
    it = actor.items.find(i => (!type || i.type === type) && (clean(i.name).includes(n) || n.includes(clean(i.name)))); if (it) return it;
  }catch{}
  return null;
}

function buildBox(s){
  const esc = (v) => v==null ? "" : String(v);
  const div = document.createElement("div");
  div.className = "mcpd-box";
  div.innerHTML = `
    <div class="mcpd-hdr">POWER DETAILS</div>
    <div class="mcpd-grid">
      <div class="row"><span class="k">ACTION</span><span class="v">${esc(s.action)}</span></div>
      <div class="row"><span class="k">DURATION</span><span class="v">${esc(s.duration)}</span></div>
      <div class="row"><span class="k">COST</span><span class="v">${esc(s.cost)}</span></div>
    </div>`;
  return div;
}

function isResultLike(el){
  if (!el) return false;
  const content = el.querySelector?.(".message-content") || el;
  if (!content) return false;
  const txt = (content.textContent || "");
  return content.querySelector(".dice-roll")
      || content.querySelector('[class*="mmdr-"]')
      || /Aplicar|½\s*Dano|Curar/i.test(txt);
}

function scrubIfResultCard(el){
  if (!el || !(el instanceof HTMLElement)) return;
  if (!isResultLike(el)) return;
  const box = el.querySelector?.(".mcpd-box");
  if (box) {
    box.remove();
    // console.log(`[${MODULE_ID}] removed box from result card`);
  }
}

// Inject only on FIRST description card; extra delayed re-check to self-remove if another module mutates later
function tryInject(message, html){
  const content = html.querySelector?.(".message-content") || html;
  if (!content) return false;
  if (content.querySelector(".mcpd-box")) return false;

  // If already looks like a result card, skip
  if (isResultLike(html)) return false;

  const { type, name } = parseFromFlavor(message?.flavor);
  if (!name || !(type === "power" || type === "poder")) return false;

  const actor = resolveActor(message);
  if (!actor) return false;

  const item = findItemOnActor(actor, "power", name);
  if (!item) return false;

  content.appendChild(buildBox(item.system || {}));
  // delayed re-check in case a helper modifies this same message shortly after
  setTimeout(() => scrubIfResultCard(html), 0);
  setTimeout(() => scrubIfResultCard(html), 50);
  setTimeout(() => scrubIfResultCard(html), 150);
  console.log(`[${MODULE_ID}] injected first-card`, { actor: actor.name, power: item.name });
  return true;
}

Hooks.on("renderChatMessageHTML", (message, html) => {
  try { tryInject(message, html); }
  catch(e){ console.error(`[${MODULE_ID}] renderChatMessageHTML error`, e); }
});
