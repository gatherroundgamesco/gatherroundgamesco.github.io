const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
$("#theme").onchange=()=>{$("#customBox").hidden=$("#theme").value!=="custom"};
$("#go").onclick=()=>{
 const mode=document.querySelector('input[name=mode]:checked').value,th=$("#theme").value,n=Math.min(30,Math.max(1,+$("#count").value||1));let h="";$("#msg").innerHTML="";
 if(mode==="bingo"){
  let words=th==="custom"?$("#custom").value.split("\n").map(s=>s.trim()).filter(Boolean):DATA.bingo[th];
  if(words.length<24){$("#msg").innerHTML=`<p class="panel error">Please enter at least 24 words (you have ${words.length}).</p>`;$("#custom").focus();return}
  for(let k=0;k<n;k++){const g=shuffle(words).slice(0,24);g.splice(12,0,"FREE");
   h+=`<div class="card"><h3>Bingo · card ${k+1}</h3><div class="grid head" aria-hidden="true">${"BINGO".split("").map(c=>`<div>${c}</div>`).join("")}</div><div class="grid" role="list" aria-label="Bingo card ${k+1}, 25 squares">${g.map(w=>`<div role="listitem">${esc(w)}</div>`).join("")}</div></div>`}
 } else {
  const qs=th==="custom"?DATA.trivia.tg:DATA.trivia[th],L="ABCD";
  h=`<div class="card"><h3>Party Trivia</h3><ol>${shuffle(qs).slice(0,10).map(q=>`<li><b>${esc(q[0])}</b><br>${q[1].map((o,i)=>`${L[i]}) ${esc(o)}`).join(" &nbsp; ")}<span hidden class="ans">${L[q[2]]}</span></li>`).join("")}</ol></div>`;
  h+=`<p class="no-print"><button type="button" onclick="document.querySelectorAll('.ans').forEach(a=>{a.hidden=!a.hidden;a.textContent=' ✓ '+a.textContent.replace(' ✓ ','')})">Show/hide answers</button></p>`;
 }
 $("#out").innerHTML=h;
};
$("#print").onclick=()=>window.print();
