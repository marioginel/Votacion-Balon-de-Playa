const CATS=[
  {id:'balon',name:'Balón de Oro',icon:'⚽',c:'var(--balon)'},
  {id:'mojon',name:'Mojón de Oro',icon:'💩',c:'var(--mojon)'},
  {id:'pony', name:'Pony de Oro', icon:'🐴',c:'var(--pony)'}
];
const STAGE_LABEL=['Nombres ocultos','Desvelados todos menos el top 7','Desvelados todos menos el top 3','3º revelado','2º revelado','Ganador revelado'];
const NEXT_ACTION=['Desvelar todo menos el top 7','Desvelar todo menos el top 3','Revelar el 3º','Revelar el 2º','Revelar al ganador'];
const PASS_KEY='premios-oro-admin';
const S={pass:null,data:null,armed:null,busy:false};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),3000);}
function keep(v){try{v===null?sessionStorage.removeItem(PASS_KEY):sessionStorage.setItem(PASS_KEY,v);}catch(e){}}
function kept(){try{return sessionStorage.getItem(PASS_KEY);}catch(e){return null}}

async function call(body){
  const r=await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json','x-admin-password':S.pass||''},body:JSON.stringify(body)});
  let d={};try{d=await r.json();}catch(e){}
  if(!r.ok){const e=new Error(d.error||'Algo ha fallado');e.status=r.status;throw e;}
  return d;
}
async function act(body,okMsg){
  if(S.busy)return;S.busy=true;
  try{S.data=await call(body);if(okMsg)toast(okMsg);}
  catch(e){if(e.status===401){S.pass=null;keep(null);}toast(e.message);}
  S.busy=false;render();
}

function render(){
  const app=$('#app');
  const ae=document.activeElement;if(S.data&&ae&&ae.tagName==='INPUT'&&ae.closest('#app'))return;
  if(!S.pass||!S.data){
    app.innerHTML=`<div class="card"><h2>Entrar como admin</h2><label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password"><p class="err" id="pw-err"></p><button class="btn block" data-act="enter">Entrar</button></div>`;return;
  }
  const d=S.data,nVotes=d.people.filter(p=>p.voted).length;
  const ob=(v,l)=>`<button class="btn small ${d.override===v?'':'ghost'}" data-act="override" data-v="${v}">${l}</button>`;
  const voting=`<section class="card"><h2>Votación</h2>
    <p class="meta">${d.open?'Abierta':'Cerrada'} ahora mismo, ${nVotes} de ${d.people.length} han votado. Por calendario se abre el 1 de noviembre y se cierra la noche del 6 de diciembre.</p>
    <div class="row" style="justify-content:flex-start;margin-top:10px">${ob('auto','Según calendario')}${ob('open','Forzar abierta')}${ob('closed','Forzar cerrada')}</div>
    <div class="voters">${d.people.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<span class="voter ${p.voted?'done':''}">${p.voted?'✓ ':''}${esc(p.name)}</span>`).join('')}</div></section>`;
  const reveals=CATS.map(c=>{
    const stage=d.stages[c.id],man=+(d.manual[c.id]||0);
    const bars=[1,2,3,4,5].map(i=>`<span class="${stage>=i?'on':''}"></span>`).join('');
    return `<section class="card award" style="--c:${c.c}"><h2><span class="icon" aria-hidden="true">${c.icon}</span>${c.name}</h2>
      <p class="meta">${STAGE_LABEL[stage]}. Los dos primeros pasos se hacen solos el 7 y el 12 de diciembre; los tres últimos los das tú en la gala.</p><div class="stages">${bars}</div>
      <div class="row">${stage<5?`<button class="btn" data-act="stage" data-cat="${c.id}" ${d.open?'disabled':''}>${NEXT_ACTION[stage]}</button>`:'<span class="meta">Premio entregado</span>'}
      ${man>d.autoStage&&man>0?`<button class="btn ghost small" data-act="back" data-cat="${c.id}">Deshacer paso</button>`:''}</div>
      ${d.open&&stage<5?'<p class="meta">Mientras la votación esté abierta no se puede desvelar nada.</p>':''}
      <details><summary>Ver clasificación real (spoiler)</summary><ol class="rank">${d.standings[c.id].map((x,i)=>`<li><span class="pos">${i+1}</span><span class="name">${esc(x.name)}</span><span class="score">${x.pts} <small>pts</small></span></li>`).join('')}</ol></details></section>`;
  }).join('');
  const people=`<section class="card"><h2>Participantes y correos</h2>
    <p class="sub">Cuando alguien pide su PIN, su correo queda guardado aquí y el PIN le llega solo. Si alguien registra un correo que no es suyo, cámbialo y pulsa «Enviar PIN nuevo».</p>
    ${d.people.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<div class="req">
      <div><div class="name">${esc(p.name)}</div>
        <input type="email" data-email="${esc(p.id)}" value="${esc(p.email)}" placeholder="Sin correo" style="margin-top:6px">
        <div class="em">${p.pinSentAt?'PIN enviado el '+new Date(p.pinSentAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Sin PIN todavía'}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="btn ghost small" data-act="email" data-id="${esc(p.id)}">Guardar correo</button>
        <button class="btn small" data-act="pin" data-id="${esc(p.id)}" ${p.email?'':'disabled'}>Enviar PIN nuevo</button></div></div>`).join('')}
  </section>`;
  const danger=`<section class="card"><h3>Empezar de cero</h3><p class="meta">Borra todos los votos y vuelve a ocultar los premios. Útil si has hecho pruebas antes del 1 de noviembre. Los correos y PINs se mantienen.</p>
    <button class="btn danger small" data-act="wipe">${S.armed==='wipe'?'Toca otra vez para borrar':'Borrar todos los votos'}</button></section>`;
  app.innerHTML=voting+reveals+people+danger;
}

document.addEventListener('click',async ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act;
  if(a!=='wipe')S.armed=null;
  if(a==='enter'){
    const pw=$('#pw').value;if(!pw)return;S.pass=pw;
    try{S.data=await call({action:'status'});keep(pw);document.activeElement.blur();render();}
    catch(e){S.pass=null;$('#pw-err').textContent=e.message;}
  }
  else if(a==='override')act({action:'override',value:el.dataset.v},'Votación actualizada');
  else if(a==='stage')act({action:'stage',cat:el.dataset.cat},'Desvelado');
  else if(a==='back')act({action:'stage',cat:el.dataset.cat,dir:'back'},'Paso deshecho');
  else if(a==='email'){const v=document.querySelector(`[data-email="${el.dataset.id}"]`).value;document.activeElement.blur();act({action:'setEmail',pid:el.dataset.id,email:v},'Correo guardado');}
  else if(a==='pin'){el.textContent='Enviando…';act({action:'sendPin',pid:el.dataset.id},'PIN nuevo enviado');}
  else if(a==='wipe'){
    if(S.armed!=='wipe'){S.armed='wipe';render();setTimeout(()=>{if(S.armed==='wipe'){S.armed=null;render();}},4000);return;}
    S.armed=null;act({action:'wipe'},'Votos borrados');
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pw')$('[data-act="enter"]').click();});
(async()=>{
  S.pass=kept();
  if(S.pass){try{S.data=await call({action:'status'});}catch(e){S.pass=null;keep(null);}}
  render();
  setInterval(()=>{if(S.pass&&!document.hidden&&!S.busy)call({action:'status'}).then(d=>{S.data=d;render();}).catch(()=>{});},20000);
})();
