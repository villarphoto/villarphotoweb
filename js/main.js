const S={folders:[]};
let admin=false,edit=false,dirty=false,cur=null,A=null,ART=null,note='';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LOCAL=new Map(),url=id=>LOCAL.get(id)||id;
const uid=()=>Math.random().toString(36).slice(2,10);
$('#yr').textContent=new Date().getFullYear();
function card(f,i){
  const c=f.images[0],n=f.images.length;
  return `<div class="card" tabindex="0" data-open="${f.id}">${c?`<img loading="lazy" alt="${esc(f.name)}" src="${url(c.id)}">`:'<div class="ph">🏁</div>'}
  ${edit?`<div class="tools"><button data-ren="${f.id}">Renombrar</button><button data-del="${f.id}">Borrar</button></div>`:''}
  <div class="cap"><small>${String(i+1).padStart(2,'0')}</small><h3>${esc(f.name)}</h3><p>${n} foto${n==1?'':'s'}</p></div></div>`;
}
function hero(){const f=S.folders.find(x=>x.images.length);$('#hero').style.setProperty('--bgimg',f?`url(${url(f.images[0].id)})`:'none')}
function render(){
  const app=$('#app'),f=S.folders.find(x=>x.id===cur);
  if(!f){cur=null;
    app.innerHTML=S.folders.length?`<div class="grid b">${S.folders.map(card).join('')}</div>`:
      `<div class="empty">${admin?'Aún no hay carpetas. Pulsa «Editar portfolio» para crear la primera.':'Pronto subiré aquí mis mejores trabajos.'}</div>`;
  }else{
    app.innerHTML=`<button class="back" data-back>‹ Portfolio</button><h2>${esc(f.name)}</h2>
    ${f.images.length?`<div class="pics">${f.images.map((im,i)=>`<figure class="pic" data-img="${i}"><img loading="lazy" alt="" src="${url(im.id)}">${edit?`<div class="tools"><button data-cover="${i}">★</button><button data-rm="${i}">×</button></div>`:''}</figure>`).join('')}</div>`:`<div class="empty">${edit?'Arrastra aquí tus fotos o pulsa «Subir imágenes».':'Esta carpeta está vacía.'}</div>`}`;
  }
  hero();bar();
}
function bar(){
  let b=$('#bar');if(!admin){b&&b.remove();return}
  if(!b){b=document.createElement('div');b.id='bar';document.body.append(b)}
  const f=cur&&S.folders.find(x=>x.id===cur);
  b.innerHTML=`<button data-edit>${edit?'Salir de edición':'Editar portfolio'}</button>`+
   (edit?(f?`<label>Subir imágenes<input type="file" id="up" accept="image/*" multiple hidden></label>`:`<input type="text" id="nf" placeholder="Nueva carpeta" maxlength="40"><button data-new>Crear</button>`):'')+
   (dirty?`<button class="p" data-save>Guardar y publicar</button>`:'')+(note?`<span id="msg">${esc(note)}</span>`:'')+`<button data-cred>Acceso</button><button data-out>Salir</button>`;
}
function say(t){note=t;bar()}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-open],[data-back],[data-edit],[data-new],[data-save],[data-ren],[data-del],[data-rm],[data-cover],[data-img]');if(!t)return;
  const d=t.dataset;
  if('ren' in d){e.stopPropagation();const f=S.folders.find(x=>x.id===d.ren);dlg('Renombrar carpeta',f.name,v=>{f.name=v;dirty=true;render()},'Guardar');return}
  if('del' in d){e.stopPropagation();dlg('¿Borrar esta carpeta?',null,()=>{S.folders=S.folders.filter(x=>x.id!==d.del);if(cur===d.del)cur=null;dirty=true;render()},'Borrar');return}
  if('open' in d){cur=d.open;render();$('#portfolio').scrollIntoView();return}
  if('back' in d){cur=null;render();return}
  if('edit' in d){edit=!edit;render();return}
  if('new' in d){const v=$('#nf').value.trim();if(v){S.folders.push({id:uid(),name:v,images:[]});dirty=true;note='Carpeta «'+v+'» creada';render()}else say('Escribe un nombre para la carpeta');return}
  const f=S.folders.find(x=>x.id===cur);
  if('rm' in d){e.stopPropagation();f.images.splice(+d.rm,1);dirty=true;render();return}
  if('cover' in d){e.stopPropagation();const [im]=f.images.splice(+d.cover,1);f.images.unshift(im);dirty=true;render();return}
  if('img' in d){show(+d.img);return}
  if('save' in d)save();
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.open)e.target.click()});
document.addEventListener('change',async e=>{
  if(e.target.id!=='up')return;
  const f=S.folders.find(x=>x.id===cur),files=[...e.target.files];
  if(!A){say('La subida no está disponible aquí.');return}
  let n=0;
  for(const file of files){say(`Subiendo ${++n}/${files.length}…`);
    try{const r=await A.upload(file);f.images.push({id:r.id});dirty=true}catch(err){say('Error al subir '+file.name)}}
  say('');render();
});
async function save(){
 if(!TOKEN||!CFG){say('Vuelve a iniciar sesión para guardar.');return}
 const API=`https://api.github.com/repos/${CFG.repo}/contents/`,H={Authorization:'Bearer '+TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},JH={...H,'Content-Type':'application/json'},ref='?ref='+encodeURIComponent(CFG.br);
 const put=async(path,content,msg)=>{for(let t=0;t<3;t++){let sha;const g=await fetch(API+path+ref+'&_='+Date.now(),{headers:H,cache:'no-store'});if(g.ok)sha=(await g.json()).sha;
  const r=await fetch(API+path,{method:'PUT',headers:JH,cache:'no-store',body:JSON.stringify({message:msg,content,branch:CFG.br,sha})});
  if(r.ok)return;let m=r.status;try{m=(await r.json()).message}catch(e){}
  if(r.status===409&&t<2){await new Promise(k=>setTimeout(k,900));continue}throw new Error(m)}};
 const toB64=b=>new Promise((ok,ko)=>{const fr=new FileReader();fr.onload=()=>ok(String(fr.result).split(',')[1]);fr.onerror=ko;fr.readAsDataURL(b)});
 try{
  const up=[];S.folders.forEach(f=>f.images.forEach(im=>{if(PEND.has(im.id))up.push(im)}));let n=0;
  for(const im of up){say(`Subiendo foto ${++n}/${up.length}…`);const pd=PEND.get(im.id);await put(pd.path,await toB64(pd.b),'Añadir foto');LOCAL.set(pd.path,im.id);PEND.delete(im.id);im.id=pd.path}
  const now=new Set();S.folders.forEach(f=>f.images.forEach(im=>now.add(im.id)));
  for(const old of SAVED){if(!now.has(old)&&old.startsWith('assets/photos/')){const g=await fetch(API+old+ref+'&_='+Date.now(),{headers:H,cache:'no-store'});
   if(g.ok)await fetch(API+old,{method:'DELETE',headers:JH,body:JSON.stringify({message:'Eliminar foto',sha:(await g.json()).sha,branch:CFG.br})})}}
  say('Guardando carpetas…');
  const json=JSON.stringify({folders:S.folders.map(f=>({id:f.id,name:f.name,images:f.images.map(i=>({id:i.id}))}))},null,2);
  await put('data/portfolio.json',b64(te.encode(json)),'Actualizar portfolio');
  SAVED=now;dirty=false;render();say('Guardado. La web pública se actualiza en 1-2 minutos.')
 }catch(err){say('Error al guardar: '+(err&&err.message||err))}}
let li=0;const lb=$('#lb');
function show(i){const f=S.folders.find(x=>x.id===cur);if(!f)return;li=(i+f.images.length)%f.images.length;lb.querySelector('img').src=url(f.images[li].id);lb.classList.add('on')}
lb.querySelector('.c').onclick=()=>lb.classList.remove('on');
lb.querySelector('.l').onclick=()=>show(li-1);lb.querySelector('.r').onclick=()=>show(li+1);
lb.onclick=e=>{if(e.target===lb)lb.classList.remove('on')};
addEventListener('keydown',e=>{if(!lb.classList.contains('on'))return;if(e.key==='Escape')lb.classList.remove('on');if(e.key==='ArrowLeft')show(li-1);if(e.key==='ArrowRight')show(li+1)});
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
render();
let CFG=null,TOKEN='',mode='login',SAVED=new Set();
const PEND=new Map(),E=id=>document.getElementById(id),te=new TextEncoder(),td=new TextDecoder();
const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode(...u.subarray(i,i+8192));return btoa(s)},unb=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
const slug=t=>(t||'fotos').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'fotos';
async function key(p,salt){const k=await crypto.subtle.importKey('raw',te.encode(p),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:200000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(p,t){const s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));return{s:b64(s),iv:b64(iv),ct:b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(p,s),te.encode(t))))}}
async function unseal(p,c){return td.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb(c.iv)},await key(p,unb(c.s)),unb(c.ct)))}
async function shrink(file){const bm=await createImageBitmap(file),k=Math.min(1,2400/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/jpeg',.88))}
A={upload:async file=>{const b=await shrink(file),u=URL.createObjectURL(b),f=S.folders.find(x=>x.id===cur);PEND.set(u,{b,path:`assets/photos/${slug(f&&f.name)}/${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}.jpg`});return{id:u}}};
function lmodal(m){mode=m;const sh=(i,v)=>{E(i).hidden=!v},full=m!=='login';
 E('lt').textContent={login:'Acceso de administrador',setup:'Configurar acceso',change:'Cambiar acceso'}[m];
 E('lh').textContent={login:'',setup:'Conecta tu repositorio de GitHub y crea tu usuario y contraseña. El token se guarda cifrado solo en este navegador.',change:'Deja en blanco lo que no quieras cambiar.'}[m];
 ['lr','lbr','lk','ln','lp2'].forEach(i=>sh(i,full));sh('lp',m!=='setup');sh('lrs',m==='login'&&!!CFG);
 document.querySelector('[data-lg]').textContent=m==='login'?'Entrar':'Guardar';
 E('lp').placeholder=m==='change'?'Contraseña actual':'Contraseña';E('ln').placeholder=m==='change'?'Nueva contraseña (opcional)':'Contraseña nueva (mín. 8 caracteres)';E('lk').placeholder=m==='change'?'Token nuevo (opcional)':'Token de GitHub';
 E('lu').value=CFG&&m!=='setup'?CFG.u:'';E('lr').value=CFG&&m==='change'?CFG.repo:'';E('lbr').value=CFG&&m==='change'?CFG.br:'main';
 ['lp','ln','lp2','lk'].forEach(i=>{E(i).value=''});E('le').textContent='';E('login').classList.add('on');E('lu').focus()}
async function lgo(){const g=i=>E(i).value.trim(),u=g('lu'),p=E('lp').value,n=E('ln').value,r2=E('lp2').value,err=t=>{E('le').textContent=t};
 if(!(window.crypto&&crypto.subtle))return err('Este navegador no permite cifrar. Usa la web en https (GitHub Pages) o en localhost.');
 try{
  if(mode==='login'){if(!CFG)return err('Aún no hay acceso configurado.');if(u!==CFG.u)return err('Usuario o contraseña incorrectos.');
   try{TOKEN=await unseal(p,CFG)}catch(e){return err('Usuario o contraseña incorrectos.')}}
  else{
   if(mode==='change'){try{TOKEN=await unseal(p,CFG)}catch(e){return err('La contraseña actual no es correcta.')}}
   const repo=g('lr'),br=g('lbr')||'main',tk=g('lk')||(mode==='change'?TOKEN:'');
   if(!/^[\w.-]+\/[\w.-]+$/.test(repo))return err('Escribe el repositorio como usuario/repositorio.');
   if(!tk)return err('Pega tu token de GitHub.');
   if(u.length<3)return err('El usuario debe tener al menos 3 caracteres.');
   let pw=p;if(mode==='setup'||n){if(n.length<8)return err('La contraseña debe tener al menos 8 caracteres.');if(n!==r2)return err('Las contraseñas no coinciden.');pw=n}
   E('le').textContent='Comprobando con GitHub…';
   const t=await fetch('https://api.github.com/repos/'+repo,{headers:{Authorization:'Bearer '+tk,Accept:'application/vnd.github+json'}});
   if(!t.ok)return err('GitHub no acepta ese token o repositorio ('+t.status+').');
   const j=await t.json();if(j.permissions&&j.permissions.push===false)return err('El token no puede escribir. Activa «Contents: Read and write».');
   TOKEN=tk;CFG={u,repo,br,...await seal(pw,tk)};
   try{localStorage.setItem('vp_admin',JSON.stringify(CFG))}catch(e){return err('No se pudo guardar el acceso en este navegador.')}}
  admin=true;E('login').classList.remove('on');render()}catch(e){err('No se pudo completar la operación.')}}
document.addEventListener('click',e=>{const t=e.target.closest('#adm-link,[data-cred],[data-out],[data-lg],[data-lc],[data-rs]');if(!t)return;e.preventDefault();const d=t.dataset;
 if(t.id==='adm-link'){if(admin)return;lmodal(CFG?'login':'setup')}
 else if('cred' in d)lmodal('change');else if('rs' in d)lmodal('setup');
 else if('out' in d){admin=false;edit=false;TOKEN='';render()}
 else if('lg' in d)lgo();else E('login').classList.remove('on')});
['lu','lp','ln','lp2','lk','lr','lbr'].forEach(i=>E(i).addEventListener('keydown',e=>{if(e.key==='Enter')lgo()}));
(()=>{const app=E('app');
 async function upl(files){const f=S.folders.find(x=>x.id===cur);if(!edit||!f)return;
  files=[...files].filter(x=>x.type.startsWith('image/'));let n=0;
  for(const file of files){say(`Preparando ${++n}/${files.length}…`);try{const r=await A.upload(file);f.images.push({id:r.id});dirty=true}catch(err){say('Error con '+file.name)}}
  say('');render()}
 ['dragenter','dragover'].forEach(t=>app.addEventListener(t,e=>{if(!edit||!cur)return;e.preventDefault();app.classList.add('dz')}));
 ['dragleave','drop'].forEach(t=>app.addEventListener(t,()=>app.classList.remove('dz')));
 app.addEventListener('drop',e=>{if(!edit||!cur)return;e.preventDefault();upl(e.dataTransfer.files)})})();
(async()=>{
 E('adm-link').hidden=false;try{CFG=JSON.parse(localStorage.getItem('vp_admin')||'null')}catch(e){}
 try{const r=await fetch('data/portfolio.json?v='+Date.now());if(r.ok){const j=await r.json();S.folders=j.folders||[]}}catch(e){}
 S.folders.forEach(f=>f.images.forEach(i=>SAVED.add(i.id)));render()})();

(()=>{const h=$('#hero .stick'),lg=h.querySelector('.lg'),pg=$('#pg');
 const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
 addEventListener('scroll',()=>{const m=document.documentElement.scrollHeight-innerHeight;pg.style.width=(m>0?scrollY/m*100:0)+'%'},{passive:true});
 if(rm)return;
 h.addEventListener('pointermove',e=>{const r=h.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
  h.style.setProperty('--mx',x*100+'%');h.style.setProperty('--my',y*100+'%');
  lg.style.transform=`translate(${(x-.5)*22}px,${(y-.5)*16}px) rotate(${(x-.5)*2}deg)`});
 h.addEventListener('pointerleave',()=>{lg.style.transform=''});
 const app=$('#app');
 app.addEventListener('pointermove',e=>{const c=e.target.closest('.card');if(!c||e.pointerType==='touch')return;
  const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  c.style.transform=`perspective(900px) rotateY(${x*3}deg) rotateX(${-y*3}deg) translateY(-6px)`});
 app.addEventListener('pointerout',e=>{const c=e.target.closest&&e.target.closest('.card');if(c)c.style.transform=''});
})();

(()=>{const R=document.documentElement,hero=$('#hero'),pin=$('#sobre'),ws=[...document.querySelectorAll('.w')],nav=$('.nav'),tk=$('.tick'),hc=$('.hc'),h2=$('.hc2');
 const cl=v=>Math.min(1,Math.max(0,v));let q=0;
 function f(){q=0;const y=scrollY,m=R.scrollHeight-innerHeight,hp=cl(y/Math.max(1,hero.offsetHeight-innerHeight));
  R.style.setProperty('--sp',(m>0?y/m:0).toFixed(4));R.style.setProperty('--hp',hp.toFixed(4));
  const t=tk.getBoundingClientRect();R.style.setProperty('--tp',cl((innerHeight-t.top)/(innerHeight+t.height)).toFixed(4));
  const b=pin.getBoundingClientRect(),p=cl(-b.top/Math.max(1,b.height-innerHeight)),n=Math.round(cl(p*1.2)*ws.length);ws.forEach((w,i)=>w.classList.toggle('on',i<n));
  nav.classList.toggle('sm',y>40);}
 addEventListener('scroll',()=>{q||(q=requestAnimationFrame(f))},{passive:true});addEventListener('resize',f);f();
 const lk=[...document.querySelectorAll('.nav li a')];
 const o=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)lk.forEach(a=>a.classList.toggle('act',a.getAttribute('href')==='#'+x.target.id))}),{rootMargin:'-45% 0px -50% 0px'});
 ['portfolio','sobre','servicios'].forEach(i=>o.observe($('#'+i)));
})();

(()=>{const R=document.documentElement,hs=$('#disciplinas'),cl=v=>Math.min(1,Math.max(0,v));let q=0;
 const f=()=>{q=0;if(!hs)return;const b=hs.getBoundingClientRect();R.style.setProperty('--xp',(-cl(-b.top/Math.max(1,b.height-innerHeight))).toFixed(4))};
 addEventListener('scroll',()=>{q||(q=requestAnimationFrame(f))},{passive:true});addEventListener('resize',f);f();
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 document.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;document.querySelectorAll('.btn').forEach(b=>{const r=b.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
  b.style.transform=Math.hypot(dx,dy)<0?`translate(${dx*.22}px,${dy*.3}px)`:''})});
})();

(()=>{const R=document.documentElement,af=$('#af'),fl=$('#fl'),hud=$('#hud'),rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(rm)return;
 let tx=-99,ty=-99,x=tx,y=ty,fr=0,last='';
 addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;tx=e.clientX;ty=e.clientY;af.classList.add('vis');af.classList.toggle('lock',!!e.target.closest('a,button,label,.card,.pic,.pn,.sv,.chip'))});
 document.addEventListener('pointerleave',()=>af.classList.remove('vis'));
 addEventListener('pointerdown',e=>{if(e.target.closest('#bar,#lb,.tools,input,#intro'))return;fl.classList.remove('on');void fl.offsetWidth;fl.classList.add('on');fr++});
 const SH=['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60'];let ly=scrollY,v=0;
 (function loop(){const sy=scrollY,d=Math.abs(sy-ly);ly=sy;v+=(Math.min(1,d/50)-v)*.14;if(v<.003)v=0;R.style.setProperty('--v',v.toFixed(3));
  x+=(tx-x)*.28;y+=(ty-y)*.28;af.style.transform=`translate(${x}px,${y}px)`;
  const m=R.scrollHeight-innerHeight,p=m>0?sy/m:0,t=`<b>●</b> ${SH[Math.min(7,Math.floor(p*8))]} · f/2.8 · ISO 400 · #${String(fr).padStart(4,'0')}`;
  if(t!==last){hud.innerHTML=t;last=t}requestAnimationFrame(loop)})();
})();

function dlg(title,val,ok,label){const D=E('dlg'),i=E('di');E('dt').textContent=title;i.hidden=val===null;i.value=val||'';
 E('dm').textContent=val===null?'Se quitará la carpeta y sus fotos del portfolio.':'';E('dok').textContent=label||'Guardar';D.classList.add('on');
 const done=()=>{D.classList.remove('on');E('dok').onclick=E('dcx').onclick=i.onkeydown=null};
 E('dcx').onclick=done;E('dok').onclick=()=>{const v=i.value.trim();if(val!==null&&!v)return;done();ok(v)};
 i.onkeydown=ev=>{if(ev.key==='Enter')E('dok').click();if(ev.key==='Escape')done()};if(!i.hidden)setTimeout(()=>{i.focus();i.select()},30)}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='nf'){e.preventDefault();const b=document.querySelector('[data-new]');if(b)b.click()}});