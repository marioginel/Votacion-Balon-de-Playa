const CATS=[
  {id:'balon',name:'Balón de Oro',icon:'⚽',desc:'Al mejor año con los colegas.',c:'var(--balon)'},
  {id:'mojon',name:'Mojón de Oro',icon:'💩',desc:'Al peor amigo del año.',c:'var(--mojon)'},
  {id:'pony', name:'Pony de Oro', icon:'🐴',desc:'Al caballo más domado por su mujer.',c:'var(--pony)'}
];
const POINTS=[3,2,1];
const TOKEN_KEY='premios-oro-2026-token';

const S={photos:{},photosFor:null,pub:null,me:null,token:null,tab:'vote',draft:null,dirty:false,saving:false,seen:null,
  pendingRender:false,showReq:false,reqMsg:null,loadError:false};

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),3000);}
function store(val){try{if(val===undefined)return localStorage.getItem(TOKEN_KEY);if(val===null)localStorage.removeItem(TOKEN_KEY);else localStorage.setItem(TOKEN_KEY,val);}catch(e){return null}}

async function api(path,{method='GET',body}={}){
  const headers={'Content-Type':'application/json'};
  if(S.token)headers.Authorization='Bearer '+S.token;
  const r=await fetch('/api/'+path,{method,headers,body:body?JSON.stringify(body):undefined});
  let data={};try{data=await r.json();}catch(e){}
  if(!r.ok){const err=new Error(data.error||'Algo ha fallado. Inténtalo otra vez.');err.status=r.status;err.data=data;throw err;}
  return data;
}

const parts=()=>S.pub?.participants||[];
const person=id=>parts().find(p=>p.id===id);
const nameOf=id=>person(id)?.name||'?';
const sortedParts=()=>[...parts()].sort((a,b)=>a.name.localeCompare(b.name,'es'));

function statusText(){
  const p=S.pub;if(!p)return '';
  const now=Date.now(),sc=p.schedule;
  if(p.override==='open')return 'Votación abierta';
  if(p.override==='closed'&&now<sc.close)return 'Votación cerrada por el admin';
  if(now<sc.open)return 'Las votaciones abren el 1 de noviembre';
  if(now<sc.close)return 'Votaciones abiertas hasta la noche del 6 de diciembre';
  if(now<sc.reveal2)return 'Votación cerrada. El 12 de diciembre por la mañana se desvela hasta el top 3';
  return 'Gala del 12 de diciembre en Casa Club';
}

/* ---------- Render ---------- */
function render(){
  const ae=document.activeElement;
  if(ae&&ae.closest&&ae.closest('#app')&&(ae.tagName==='INPUT'||ae.tagName==='SELECT')){S.pendingRender=true;return;}
  S.pendingRender=false;
  $('#status').textContent=statusText();
  $('#who').innerHTML=S.me?`<div>${esc(S.me.name)}</div><button data-act="logout">Salir</button>`:'';
  $('#tabs').innerHTML=[['vote','Votar'],['cands','Candidatos'],['rank','Clasificación'],['rules','Normas']]
    .map(([id,l])=>`<button data-tab="${id}" ${S.tab===id?'aria-current="page"':''}>${l}</button>`).join('');
  const app=$('#app');
  if(S.tab==='rules')app.innerHTML=viewRules();
  else if(!S.pub)app.innerHTML=S.loadError?`<div class="card"><h2>No se pudo cargar la gala</h2><p class="sub">Revisa tu conexión y recarga la página.</p></div>`:`<p class="empty">Cargando la gala…</p>`;
  else if(S.tab==='cands'){app.innerHTML=viewCandidates();loadPhotos();}
  else if(S.tab==='rank')app.innerHTML=viewRanking();
  else app.innerHTML=S.me?viewVote():viewLogin();
  renderSavebar();
}

function viewLogin(){
  const opts=`<option value="">Elige tu nombre</option>${sortedParts().map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}`;
  const login=`<div class="card">
    <h2>Entra para votar</h2>
    <p class="sub">Elige tu nombre y escribe el PIN que te ha llegado por correo.</p>
    <label for="lg-name">Quién eres</label>
    <select id="lg-name">${opts}</select>
    <label for="lg-pin">PIN</label>
    <input id="lg-pin" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="4 cifras">
    <p class="err" id="lg-err"></p>
    <button class="btn block" data-act="login">Entrar</button>
    <p style="margin:14px 0 0;text-align:center"><button class="linkbtn" data-act="show-req">${S.showReq?'Ya tengo mi PIN':'¿No tienes PIN o lo has perdido? Pídelo aquí'}</button></p>
  </div>`;
  if(!S.showReq)return login;
  const req=S.reqMsg?`<div class="card"><h2>PIN enviado</h2><p class="sub">${esc(S.reqMsg)}</p><button class="btn ghost" data-tab="rules">Mientras tanto, lee las normas</button></div>`
  :`<div class="card">
    <h2>Pide tu PIN</h2>
    <p class="sub">Escribe el correo que le diste al admin. Te mandamos el PIN al momento; si ya tenías uno, el anterior deja de valer.</p>
    <label for="rq-name">Quién eres</label>
    <select id="rq-name">${opts}</select>
    <label for="rq-email">Correo electrónico</label>
    <input id="rq-email" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.com">
    <p class="err" id="rq-err"></p>
    <div class="cheat" id="rq-cheat" role="alert" hidden></div>
    <button class="btn block" data-act="request-pin">Enviarme el PIN</button>
  </div>`;
  return login+req;
}

function ensureDraft(){
  if(S.draft&&S.dirty)return;
  const p=S.me?.ballot?.picks;
  S.draft={};CATS.forEach(c=>{S.draft[c.id]=[0,1,2].map(i=>p?.[c.id]?.[i]&&person(p[c.id][i])?p[c.id][i]:null);});
}
function viewRsvp(){
  const r=S.me.rsvp,past=Date.now()>=S.pub.schedule.gala;
  const g=r?r.going:null;
  const label=g===true?'Confirmado: vas a la comida':g===false?'Has dicho que no vas':'¿Vienes a la comida del 12 de diciembre?';
  return `<section class="rsvp ${g===true?'yes':g===false?'no':''}" aria-label="Asistencia a la comida">
    <div class="rsvp-text"><b>${label}</b><span>Comida de Navidad en Casa Club, sábado 12 de diciembre</span></div>
    ${past?'':`<div class="rsvp-btns" role="group" aria-label="¿Vas a la comida?">
      <button class="rsvp-btn ${g===true?'on':''}" data-act="rsvp" data-v="1" aria-pressed="${g===true}">✓ Voy</button>
      <button class="rsvp-btn ${g===false?'on':''}" data-act="rsvp" data-v="0" aria-pressed="${g===false}">✗ No voy</button></div>`}
  </section>`;
}
function viewVote(){
  ensureDraft();
  const open=S.pub.open,mine=S.me.ballot,now=Date.now();
  let head;
  if(!open&&now<S.pub.schedule.open&&S.pub.override!=='closed')head=`<div class="card"><h2>Aún no se vota</h2><p class="sub">Las votaciones abren el 1 de noviembre. Ve pensando: el periodo que cuenta empezó en la comida de Navidad del año pasado.</p><button class="btn ghost" data-tab="rules">Repasar las normas</button></div>`;
  else if(!open)head=`<div class="card"><h2>Votación cerrada</h2><p class="sub">${mine?'Tus votos cuentan. Sigue la gala en la clasificación.':'La votación se cerró antes de que votaras.'}</p></div>`;
  else head=`<p class="sub">En cada premio elige tres nombres: el primero suma 3 puntos, el segundo 2 y el tercero 1. No puedes votarte a ti mismo. Puedes cambiar tus votos hasta la noche del 6 de diciembre.</p>`;
  const others=sortedParts().filter(p=>p.id!==S.me.pid);
  return viewRsvp()+head+CATS.map(c=>{
    const d=S.draft[c.id];
    const slots=POINTS.map((pts,i)=>`<button class="slot ${d[i]?'filled':''}" data-act="unslot" data-cat="${c.id}" data-i="${i}" ${!open?'disabled':''} aria-label="${pts} puntos: ${d[i]?esc(nameOf(d[i]))+', toca para quitar':'vacío'}">
      <span class="pts">${pts}</span><span class="nm ${d[i]?'':'empty'}">${d[i]?esc(nameOf(d[i])):'puntos'}</span></button>`).join('');
    const chips=open?`<div class="chips">${others.map(p=>{const i=d.indexOf(p.id);return `<button class="chip ${i>=0?'on':''}" data-act="pick" data-cat="${c.id}" data-id="${esc(p.id)}" aria-pressed="${i>=0}">${esc(p.name)}${i>=0?`<span class="tag">${POINTS[i]} pts</span>`:''}</button>`}).join('')}</div>`:'';
    return `<section class="card award" style="--c:${c.c}"><h2><span class="icon" aria-hidden="true">${c.icon}</span>${c.name}</h2><p class="sub">${c.desc}</p><div class="slots">${slots}</div>${chips}</section>`;
  }).join('');
}
function renderSavebar(){
  let bar=$('#savebar');
  const show=S.tab==='vote'&&S.me&&S.pub?.open&&S.draft;
  if(!show){bar&&bar.remove();return;}
  if(!bar){bar=document.createElement('div');bar.id='savebar';bar.className='savebar';document.body.appendChild(bar);}
  const done=CATS.reduce((n,c)=>n+S.draft[c.id].filter(Boolean).length,0);
  const saved=!!S.me.ballot&&!S.dirty;
  const msg=saved?'Votos guardados. Puedes cambiarlos si quieres.':done<9?`Llevas ${done} de 9 votos`:'Todo listo para guardar';
  bar.innerHTML=`<div class="wrap"><span class="msg">${msg}</span><button class="btn" data-act="save" ${done<9||saved||S.saving?'disabled':''}>${S.saving?'Guardando…':'Guardar votos'}</button></div>`;
}

const initials=n=>n.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
function viewCandidates(){
  const list=sortedParts();
  const note=S.me?'':`<div class="card"><p class="sub" style="margin:0">Las fotos son privadas. <button class="linkbtn" data-tab="vote">Entra con tu PIN</button> para verlas.</p></div>`;
  return `<p class="sub">Los ${list.length} aspirantes de esta edición. Todos optan a los tres premios, para bien o para mal.</p>${note}
  <div class="cands">${list.map(p=>{const u=S.photos[p.id];return `<figure class="cand">
    <div class="ph"><span class="ini" aria-hidden="true">${esc(initials(p.name))}</span>${u?`<img src="${u}" alt="${esc(p.name)}">`:''}</div>
    <figcaption>${esc(p.name)}</figcaption></figure>`}).join('')}</div>`;
}
/* Las fotos se piden con el token de sesión: sin PIN no se pueden descargar */
async function loadPhotos(){
  if(!S.me||S.photosFor===S.token)return;
  S.photosFor=S.token;
  await Promise.all(parts().map(async p=>{
    try{
      const r=await fetch('/api/foto?id='+encodeURIComponent(p.id),{headers:{Authorization:'Bearer '+S.token}});
      if(r.ok)S.photos[p.id]=URL.createObjectURL(await r.blob());
    }catch(e){}
  }));
  if(S.tab==='cands')render();
}
function viewRanking(){
  const p=S.pub;
  const firstPaint=!S.seen;if(firstPaint)S.seen=new Set();
  const fresh=key=>{if(S.seen.has(key))return '';S.seen.add(key);return firstPaint?'':'fresh';};
  const intro=`<p class="sub">${p.voted} de ${p.total} han votado. La clasificación se mueve en directo, pero los nombres siguen en secreto hasta que toque desvelarlos.</p>`;
  return intro+CATS.map(c=>{
    const r=p.ranking[c.id],rows=r.rows,stage=r.stage;
    let extra='';
    if(stage===5&&rows[0]?.name)extra=`<div class="winner ${fresh(c.id+':win:'+rows[0].key)}"><div class="lbl">${c.name} 2026</div><div class="wn">${esc(rows[0].name)}</div><div class="lbl">${rows[0].pts} puntos</div></div>`;
    else if(stage>=1&&stage<5)extra=`<div class="finalists"><p>${r.hidden===1?'Solo queda el ganador':`Quedan ${r.hidden} por desvelar`}</p></div>`;
    const list=rows.length?`<ol class="rank">${rows.map(x=>`<li><span class="pos">${x.pos}</span><span>${x.name?`<span class="name ${fresh(c.id+':'+x.pos+':'+x.key)}">${esc(x.name)}</span>`:`<span class="hidden-name" style="--w:${70+(x.pos*37)%70}px" aria-label="Nombre oculto"></span>`}</span><span class="score">${x.pts} <small>pts</small></span></li>`).join('')}</ol>`
      :`<p class="empty">Todavía no hay votos en este premio.</p>`;
    return `<section class="card award" style="--c:${c.c}"><h2><span class="icon" aria-hidden="true">${c.icon}</span>${c.name}</h2>${extra}${list}</section>`;
  }).join('');
}

/* ---------- Acciones ---------- */
document.addEventListener('click',async ev=>{
  const tb=ev.target.closest('[data-tab]');
  if(tb){S.tab=tb.dataset.tab;render();window.scrollTo(0,0);return;}
  const el=ev.target.closest('[data-act]');if(!el)return;
  const act=el.dataset.act;
  if(act==='login'){
    const pid=$('#lg-name').value,pin=$('#lg-pin').value.trim(),err=$('#lg-err');
    if(!pid){err.textContent='Elige tu nombre.';return;}
    if(!/^\d{4}$/.test(pin)){err.textContent='El PIN tiene 4 cifras.';return;}
    el.disabled=true;
    try{const {token}=await api('login',{method:'POST',body:{pid,pin}});S.token=token;store(token);await loadMe();
      document.activeElement.blur();render();toast(`Hola, ${S.me.name}`);}
    catch(e){err.textContent=e.message;el.disabled=false;}
  }
  else if(act==='show-req'){S.showReq=!S.showReq;S.reqMsg=null;render();}
  else if(act==='request-pin'){
    const pid=$('#rq-name').value,email=$('#rq-email').value.trim(),err=$('#rq-err');
    if(!pid){err.textContent='Elige tu nombre.';return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.textContent='Escribe un correo válido, por ejemplo nombre@gmail.com.';return;}
    el.disabled=true;el.textContent='Enviando…';
    try{const r=await api('request-pin',{method:'POST',body:{pid,email}});S.reqMsg=r.message;document.activeElement.blur();render();}
    catch(e){
      el.disabled=false;el.textContent='Enviarme el PIN';
      if(e.data?.cheat){err.textContent='';const box=$('#rq-cheat');box.textContent=e.message;box.hidden=false;box.classList.remove('shake');void box.offsetWidth;box.classList.add('shake');}
      else err.textContent=e.message;
    }
  }
  else if(act==='logout'){Object.values(S.photos).forEach(u=>URL.revokeObjectURL(u));S.photos={};S.photosFor=null;S.token=null;S.me=null;S.draft=null;S.dirty=false;store(null);render();}
  else if(act==='pick'){
    const d=S.draft[el.dataset.cat],id=el.dataset.id,i=d.indexOf(id);
    if(i>=0)d[i]=null;else{const f=d.indexOf(null);if(f<0){toast('Ya tienes tres. Quita a uno primero.');return;}d[f]=id;}
    S.dirty=true;render();
  }
  else if(act==='rsvp'){
    const going=el.dataset.v==='1';if(S.me.rsvp?.going===going)return;
    el.closest('.rsvp-btns')?.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{const r=await api('rsvp',{method:'POST',body:{going}});S.me.rsvp=r.rsvp;toast(going?'¡Apuntado a la comida!':'Anotado: no vas a la comida');}
    catch(e){toast(e.message);}
    render();
  }
  else if(act==='unslot'){S.draft[el.dataset.cat][+el.dataset.i]=null;S.dirty=true;render();}
  else if(act==='save'){
    S.saving=true;renderSavebar();
    try{const r=await api('vote',{method:'POST',body:{picks:S.draft}});S.me.ballot=r.ballot;S.dirty=false;toast('Votos guardados');refresh();}
    catch(e){if(e.status===401){S.token=null;S.me=null;store(null);}toast(e.message);}
    S.saving=false;render();
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='lg-pin')$('[data-act="login"]').click();});
document.addEventListener('focusout',()=>setTimeout(()=>{if(S.pendingRender)render();},0));

/* ---------- Datos ---------- */
async function loadMe(){
  if(!S.token)return;
  try{S.me=await api('me');S.draft=null;S.dirty=false;}
  catch(e){if(e.status===401){S.token=null;store(null);}S.me=null;}
}
async function refresh(){
  try{S.pub=await api('public');S.loadError=false;}catch(e){if(!S.pub)S.loadError=true;}
  render();
}
(async()=>{
  S.token=store();
  render();
  await Promise.all([refresh(),loadMe()]);
  render();
  setInterval(()=>{if(!document.hidden)refresh();},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
