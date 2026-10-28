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
  const ae=document.activeElement;if(S.data&&ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')&&ae.closest('#app'))return;
  if(!S.pass||!S.data){
    app.innerHTML=`<div class="card"><h2>Entrar como admin</h2><label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password"><p class="err" id="pw-err"></p><button class="btn block" data-act="enter">Entrar</button></div>`;return;
  }
  const d=S.data,nVotes=d.people.filter(p=>p.voted).length;
  const ob=(v,l)=>`<button class="btn small ${d.override===v?'':'ghost'}" data-act="override" data-v="${v}">${l}</button>`;
  const voting=`<section class="card"><h2>Votación</h2>
    <p class="meta">${d.open?'Abierta':'Cerrada'} ahora mismo, ${nVotes} de ${d.people.length} han votado. Por calendario se abre el 1 de noviembre y se cierra la noche del 6 de diciembre.</p>
    <div class="row" style="justify-content:flex-start;margin-top:10px">${ob('auto','Según calendario')}${ob('open','Forzar abierta')}${ob('closed','Forzar cerrada')}</div>
    <div class="voters">${d.people.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<span class="voter ${p.voted?'done':''}">${p.voted?'✓ ':''}${esc(p.name)}</span>`).join('')}</div></section>`;
  const yes=d.people.filter(p=>p.going===true),no=d.people.filter(p=>p.going===false),pend=d.people.filter(p=>p.going==null);
  const byName=a=>a.slice().sort((x,y)=>x.name.localeCompare(y.name,'es'));
  const rsvp=`<section class="card"><h2>Comida del 12 de diciembre</h2>
    <p class="meta">${yes.length} van, ${no.length} no van y ${pend.length} sin contestar.</p>
    <h3 style="margin-top:12px">Van</h3><div class="voters">${byName(yes).map(p=>`<span class="voter done">✓ ${esc(p.name)}</span>`).join('')||'<span class="meta">Nadie todavía</span>'}</div>
    <h3 style="margin-top:12px">No van</h3><div class="voters">${byName(no).map(p=>`<span class="voter">✗ ${esc(p.name)}</span>`).join('')||'<span class="meta">Nadie</span>'}</div>
    <h3 style="margin-top:12px">Sin contestar</h3><div class="voters">${byName(pend).map(p=>`<span class="voter">${esc(p.name)}</span>`).join('')||'<span class="meta">Han contestado todos</span>'}</div></section>`;
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
    <p class="sub">El PIN solo se envía a los correos que des de alta aquí. Nadie puede pedir el PIN de otro con un correo distinto. Si cambias el correo de alguien, su PIN anterior deja de valer.</p>
    ${(()=>{const n=d.people.filter(p=>p.email&&!p.pinSentAt).length;return n?`<p><button class="btn small" data-act="pin-all">Enviar PIN a los ${n} que aún no lo tienen</button></p>`:''})()}
    ${d.people.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<div class="req">
      <div><div class="name">${esc(p.name)}</div>
        <input type="email" data-email="${esc(p.id)}" value="${esc(p.email)}" placeholder="Sin correo" style="margin-top:6px">
        <div class="em">${p.pinSentAt?'PIN enviado el '+new Date(p.pinSentAt).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Sin PIN todavía'}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
        <button class="btn ghost small" data-act="email" data-id="${esc(p.id)}">Guardar correo</button>
        <button class="btn small" data-act="pin" data-id="${esc(p.id)}" ${p.email?'':'disabled'}>Enviar PIN nuevo</button></div></div>`).join('')}
  </section>`;
  const fmt=t=>new Date(t).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const cheats=d.cheats||[];
  const cheatCounts={};cheats.forEach(c=>{const k=c.culprit||'Desconocido';cheatCounts[k]=(cheatCounts[k]||0)+1;});
  const shame=`<section class="card"><h2>Intentos de trampa</h2>
    ${cheats.length?`<p class="sub">Gente que ha intentado pedir el PIN de otro con su propio correo. Si el correo está dado de alta, sabemos quién es.</p>
    <div class="voters" style="margin-bottom:10px">${Object.entries(cheatCounts).sort((a,b)=>b[1]-a[1]).map(([n,k])=>`<span class="voter" style="border-color:var(--danger);color:var(--danger)">${esc(n)} × ${k}</span>`).join('')}</div>
    ${cheats.map(c=>`<div class="req"><div><div class="name">${c.culprit?esc(c.culprit):'Desconocido'} <span class="meta">intentó pasar por</span> ${esc(c.as)}</div><div class="em">${esc(c.email)}, ${fmt(c.at)}</div></div></div>`).join('')}
    <p style="margin-top:10px"><button class="btn ghost small" data-act="clear-cheats">${S.armed==='clear-cheats'?'Toca otra vez para vaciar':'Vaciar la lista'}</button></p>`
    :'<p class="empty">Nadie ha intentado hacer trampas. De momento.</p>'}</section>`;
  const importer=`<section class="card"><h2>Importar correos</h2>
    <p class="sub">Pega una línea por persona con el nombre y el correo, separados por un tabulador, una coma o espacios. Puedes copiarlo tal cual de una hoja de cálculo. El nombre tiene que ser el que sale en la web.</p>
    <textarea id="imp" rows="8" placeholder="Civi&#9;civi@gmail.com&#10;Juanma&#9;juanma@gmail.com">${esc(S.imp||'')}</textarea>
    <p class="err" id="imp-err"></p>
    <button class="btn small" data-act="import">Guardar todos los correos</button></section>`;
  const danger=`<section class="card"><h3>Empezar de cero</h3><p class="meta">Borra todos los votos y vuelve a ocultar los premios. Útil si has hecho pruebas antes del 1 de noviembre. Los correos y PINs se mantienen.</p>
    <button class="btn danger small" data-act="wipe">${S.armed==='wipe'?'Toca otra vez para borrar':'Borrar todos los votos'}</button></section>`;
  app.innerHTML=voting+shame+rsvp+reveals+people+importer+danger;
}

document.addEventListener('click',async ev=>{
  const el=ev.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act;
  if(a!=='wipe'&&a!=='clear-cheats')S.armed=null;
  if(a==='enter'){
    const pw=$('#pw').value;if(!pw)return;S.pass=pw;
    try{S.data=await call({action:'status'});keep(pw);document.activeElement.blur();render();}
    catch(e){S.pass=null;$('#pw-err').textContent=e.message;}
  }
  else if(a==='override')act({action:'override',value:el.dataset.v},'Votación actualizada');
  else if(a==='stage')act({action:'stage',cat:el.dataset.cat},'Desvelado');
  else if(a==='back')act({action:'stage',cat:el.dataset.cat,dir:'back'},'Paso deshecho');
  else if(a==='clear-cheats'){
    if(S.armed!=='clear-cheats'){S.armed='clear-cheats';render();setTimeout(()=>{if(S.armed==='clear-cheats'){S.armed=null;render();}},4000);return;}
    S.armed=null;act({action:'clearCheats'},'Lista vaciada');
  }
  else if(a==='import'){
    const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
    const byName=new Map();S.data.people.forEach(p=>{byName.set(norm(p.name),p.id);byName.set(norm(p.id),p.id);});
    const entries=[],bad=[];
    $('#imp').value.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).forEach(line=>{
      const m=line.match(/^(.*?)[\s,;\t]+(\S+@\S+)$/);
      if(!m){if(!/correo|persona/i.test(line))bad.push(line);return;}
      const pid=byName.get(norm(m[1].replace(/[,;]+$/,'')));
      if(!pid){bad.push(m[1].trim());return;}
      entries.push({pid,email:m[2]});
    });
    if(bad.length){$('#imp-err').textContent='No reconozco a: '+bad.join(', ')+'. Usa el nombre exacto que sale en la web.';return;}
    if(!entries.length){$('#imp-err').textContent='No he encontrado ningún correo.';return;}
    document.activeElement.blur();
    S.imp='';act({action:'setEmails',entries},`${entries.length} correos guardados`);
  }
  else if(a==='email'){const v=document.querySelector(`[data-email="${el.dataset.id}"]`).value;document.activeElement.blur();act({action:'setEmail',pid:el.dataset.id,email:v},'Correo guardado');}
  else if(a==='pin'){el.textContent='Enviando…';act({action:'sendPin',pid:el.dataset.id},'PIN nuevo enviado');}
  else if(a==='pin-all'){
    if(S.busy)return;S.busy=true;
    const todo=S.data.people.filter(p=>p.email&&!p.pinSentAt);let ok=0,fail=[];
    for(const [i,p] of todo.entries()){
      el.textContent=`Enviando ${i+1} de ${todo.length}…`;
      try{S.data=await call({action:'sendPin',pid:p.id});ok++;}catch(e){fail.push(p.name);}
    }
    S.busy=false;render();
    toast(fail.length?`Enviados ${ok}. Fallaron: ${fail.join(', ')}`:`PIN enviado a ${ok} personas`);
  }
  else if(a==='wipe'){
    if(S.armed!=='wipe'){S.armed='wipe';render();setTimeout(()=>{if(S.armed==='wipe'){S.armed=null;render();}},4000);return;}
    S.armed=null;act({action:'wipe'},'Votos borrados');
  }
});
document.addEventListener('input',e=>{if(e.target.id==='imp')S.imp=e.target.value;});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pw')$('[data-act="enter"]').click();});
(async()=>{
  S.pass=kept();
  if(S.pass){try{S.data=await call({action:'status'});}catch(e){S.pass=null;keep(null);}}
  render();
  setInterval(()=>{if(S.pass&&!document.hidden&&!S.busy)call({action:'status'}).then(d=>{S.data=d;render();}).catch(()=>{});},20000);
})();
