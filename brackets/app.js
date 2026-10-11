(function(){
const C=window.Bracket,$=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEY="boa_saves_v1",LONG_LINK=8000;let B=null,dirty=false;
Object.entries(C.TEMPLATES).forEach(([k,v])=>$("#tpl").insertAdjacentHTML("beforeend",`<option value="${k}">${esc(v.t)}</option>`));
$("#tpl").onchange=()=>{const v=C.TEMPLATES[$("#tpl").value];if(v){$("#title").value=v.t;$("#ent").value=v.e.join("\n")}};
const fmt=()=>document.querySelector('input[name=f]:checked').value;
const setFmt=f=>{const r=document.querySelector(`input[name=f][value="${C.FORMATS.includes(f)?f:"single"}"]`);r.checked=true};
const msg=t=>{$("#msg").textContent=t||""}, warn=t=>{$("#warn").textContent=t||""}, say=t=>{const s=$("#status");s.textContent="";setTimeout(()=>s.textContent=t,30)};
function make(ev){ev&&ev.preventDefault();const p=C.parseEntries($("#ent").value);warn(p.warnings.join(" "));
 if(p.error){msg(p.error);$("#ent").setAttribute("aria-invalid","true");$("#ent").focus();return}
 const f=fmt();if(f==="double"&&p.entries.length<3){msg("Double elimination needs at least 3 entries. With 2, use single elimination.");return}
 if(f==="rr"&&p.entries.length>C.RR_MAX){msg(C.roundRobin(p.entries).error);$("#ent").focus();return}
 $("#ent").removeAttribute("aria-invalid");msg("");
 B={t:$("#title").value.trim().slice(0,100)||"Bracket",f,e:p.entries,w:{}};dirty=false;if(!draw())return;
 say("Bracket ready: "+p.entries.length+" entries."+(f==="rr"?"":" Choose a winner in each match."));$("#out").focus()}
function slotHtml(m,s,x){const n=C.nameOf(B.e,x);
 if(x===undefined) return `<div class="slot tbd">To be decided</div>`;
 if(x===null) return `<div class="slot bye">Bye</div>`;
 const label=`${esc(n)} <span class="seed">(seed ${x})</span>`, win=s.winner===x;
 if(s.ready) return `<button type="button" class="slot${win?" win":""}" data-m="${m.id}" data-v="${x}" aria-pressed="${win}">${label}</button>`;
 return `<div class="slot${win?" win":""}">${label}${s.auto?' <span class="small">advances on a bye</span>':""}</div>`}
function col(br,R,sec){const rounds={};br.matches.filter(m=>m.sec===sec).forEach(m=>(rounds[m.round]=rounds[m.round]||[]).push(m));
 const total=Object.keys(rounds).length;
 return Object.entries(rounds).map(([r,ms])=>{const name=C.roundName(sec,+r,total);
  return `<ul class="round" aria-label="${esc(name)}"><li><h4>${esc(name)}</h4></li>${ms.map(m=>{const s=R[m.id];if(m.resetOnly&&s.skip)return `<li class="m"><div class="mid">${m.id}</div><div class="slot tbd">Not needed</div></li>`;
   return `<li class="m" role="group" aria-label="Match ${m.id}"><div class="mid" aria-hidden="true">${m.id}</div>${slotHtml(m,s,s.a)}${slotHtml(m,s,s.b)}</li>`}).join("")}</ul>`}).join("")}
function draw(focusId){const o=$("#out");if(!B){o.innerHTML="";return false}
 const link="#b="+encodeURIComponent(C.encodeState(B));history.replaceState(null,"",link);
 let h=`<div class="ptitle">${esc(B.t)}</div><h2 class="no-print">${esc(B.t)}</h2>`;
 if(B.f==="rr"){const r=C.roundRobin(B.e);if(r.error){o.innerHTML="";msg(r.error);return false}
  h+=r.rounds.map((g,i)=>`<h3>Round ${i+1}</h3><table><caption class="sr-only">Round ${i+1} games</caption><thead><tr><th scope="col">Entry</th><th scope="col">Opponent</th><th scope="col">Result</th></tr></thead><tbody>${g.map(([a,b])=>`<tr><td>${esc(C.nameOf(B.e,a))} <span class="seed">(${a})</span></td><td>${b===null?'<span class="bye">Bye (sits out)</span>':esc(C.nameOf(B.e,b))+` <span class="seed">(${b})</span>`}</td><td>&nbsp;</td></tr>`).join("")}</tbody></table>`).join("");}
 else{const br=C.build(B.f,B.e.length);if(br.error){o.innerHTML="";msg(br.error);return false}
  const R=C.resolve(br,B.e,B.w),ch=C.champion(br,B.e,B.w);
  h+=`<div class="sect"><h3>${B.f==="double"?"Winners bracket":"Bracket"}</h3><div class="bracket" tabindex="0" aria-label="Bracket, scrolls sideways">${col(br,R,"W")}</div></div>`;
  if(B.f==="double")h+=`<div class="sect"><h3>Losers bracket</h3><div class="bracket" tabindex="0" aria-label="Losers bracket, scrolls sideways">${col(br,R,"L")}</div></div><div class="sect"><h3>Finals</h3><div class="bracket">${col(br,R,"G")}</div></div>`;
  h+=`<p>Champion: <span class="champ">${esc(ch==null?"Not decided yet":C.nameOf(B.e,ch))}</span></p>`;}
 h+=`<div class="pfoot">Made free with Bracket of Anything · no betting, just fun</div>`;
 o.innerHTML=h;
 if(link.length>LONG_LINK) warn(($("#warn").textContent?$("#warn").textContent+" ":"")+"This share link is very long; some chat apps may cut it off. Saving on this device or printing is more reliable.");
 if(focusId){const f=o.querySelector(`[data-m="${focusId}"]`);f&&f.focus()}
 return true}
$("#out").addEventListener("click",ev=>{const d=ev.target.closest("button[data-m]");if(!d||!B)return;
 const br=C.build(B.f,B.e.length);B.w=C.pick(br,B.e,B.w,d.dataset.m,d.dataset.v);dirty=true;draw(d.dataset.m);
 const ch=C.champion(br,B.e,B.w),name=C.nameOf(B.e,+d.dataset.v);say(ch!=null?"Champion: "+C.nameOf(B.e,ch)+"!":name+" advances from match "+d.dataset.m+".")});
// Null-prototype map so titles like "__proto__" or "constructor" are ordinary keys.
function saves(){const m=Object.create(null);try{const s=JSON.parse(localStorage.getItem(KEY)||"{}");if(s&&typeof s==="object"&&!Array.isArray(s))for(const k of Object.keys(s))m[k]=s[k]}catch(e){}return m}
function refreshSaves(){const s=saves(),k=Object.keys(s);$("#saves").innerHTML=k.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")||"<option value=''>(none)</option>"}
$("#save").onclick=()=>{if(!B)return msg("Make a bracket first.");const s=saves();const name=C.uniqueName(B.t,s);
 if(name!==B.t){B.t=name;$("#title").value=name;draw()}s[name]=B;
 try{localStorage.setItem(KEY,JSON.stringify(s));dirty=false;refreshSaves();msg("");say("Saved \""+name+"\" on this device.")}catch(e){msg("Couldn't save (storage is full or blocked in this browser).")}};
function loadState(st,warnings){B=st;dirty=false;msg("");warn((warnings||[]).join(" "));$("#title").value=B.t;$("#ent").value=B.e.join("\n");setFmt(B.f);draw()}
$("#load").onclick=()=>{const k=$("#saves").value,raw=saves()[k];if(!raw)return;
 if(B&&dirty&&Object.keys(B.w).length&&!confirm("Your current bracket has picks that aren't saved. Replace it with \""+k+"\"?"))return;
 try{const d=C.decodeStateInfo(C.encodeState(raw));loadState(d.state,d.warnings);say("Loaded \""+k+"\".")}catch(e){msg("That save is damaged.")}};
$("#del").onclick=()=>{const k=$("#saves").value;if(!k)return;if(!confirm("Delete \""+k+"\" from this device?"))return;const s=saves();delete s[k];try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}refreshSaves();say("Deleted.")};
$("#setup").addEventListener("submit",make);
$("#print").onclick=()=>window.print();
$("#share").onclick=()=>{if(!B)return msg("Make a bracket first.");const done=()=>say("Share link copied. It contains the whole bracket.");
 if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(done,()=>msg("Couldn't copy. Copy the address from your browser's address bar."));else msg("Copy the address from your browser's address bar.")};
try{refreshSaves()}catch(e){}
if(location.hash.startsWith("#b=")){try{const d=C.decodeStateInfo(decodeURIComponent(location.hash.slice(3)));loadState(d.state,d.warnings)}catch(e){msg("That share link is broken or incomplete.")}}
})();
