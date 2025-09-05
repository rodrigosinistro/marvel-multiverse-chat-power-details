
const MODULE_ID = "marvel-multiverse-chat-power-details";
const MCPD_VER = "1.0.0";

Hooks.once("ready", () => {
  console.log(`[${MODULE_ID}] v${MCPD_VER} ready`);
});

const norm  = (s) => String(s||"").trim().toLowerCase();
const clean = (s) => norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();

/** Parse item type + name from message.flavor (e.g., "ability: Melee<br/>power: Esmagar<br/>damagetype: health") */
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
  try{
    const sid = message?.speaker?.actor;
    if (sid){
      const a = game.actors?.get?.(sid);
      if (a) return a;
    }
  }catch{}
  try{
    const tid = message?.speaker?.token;
    if (tid){
      const t = canvas?.tokens?.get?.(tid);
      if (t?.actor) return t.actor;
    }
  }catch{}
  try{
    const alias = message?.speaker?.alias;
    if (alias){
      const c = clean(alias);
      for (const t of canvas?.tokens?.placeables || []){
        if (clean(t?.actor?.name) === c) return t.actor;
      }
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
    let it = actor.items.find(i => clean(i.name) === n && (!type || i.type === type));
    if (it) return it;
    it = actor.items.find(i => (!type || i.type === type) && (clean(i.name).includes(n) || n.includes(clean(i.name))));
    if (it) return it;
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

// Inject only on the FIRST (non-roll) card to avoid duplication
function tryInject(message, root){
  const content = root.querySelector?.(".message-content") || root;
  if (!content) return false;
  if (content.querySelector(".mcpd-box")) return false;

  // Skip roll/result cards (they carry message.rolls)
  if ((message?.rolls && message.rolls.length > 0) || message?.isRoll) return false;

  const { type, name } = parseFromFlavor(message?.flavor);
  if (!name || !(type === "power" || type === "poder")) return false;

  const actor = resolveActor(message);
  if (!actor) return false;

  const item = findItemOnActor(actor, "power", name);
  if (!item) return false;

  content.appendChild(buildBox(item.system || {}));
  console.log(`[${MODULE_ID}] injected first-card`, { actor: actor.name, power: item.name });
  return true;
}

Hooks.on("renderChatMessage", (message, $html) => {
  try { const root = $html?.[0] || $html; tryInject(message, root); }
  catch(e){ console.error(`[${MODULE_ID}] renderChatMessage error`, e); }
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  try { tryInject(message, html); }
  catch(e){ console.error(`[${MODULE_ID}] renderChatMessageHTML error`, e); }
});
