// Bracket core: pure logic, no DOM. Works in the browser and in Node.
// Every format compiles to a list of matches; each slot is {seed:i} or {from:matchId, take:"W"|"L"}.
// Picks are stored as {matchId: seedNumber}. Seeds (1-based) keep duplicate names distinct. Byes (null) auto-advance.
(function(root){
const MAX_ENTRIES=256, RR_MAX=64, MAX_NAME=80, MAX_TITLE=100, FORMATS=["single","double","rr"];
function nextPow2(n){let p=1;while(p<n)p*=2;return p}
function seedOrder(size){let o=[1];while(o.length<size){const m=o.length*2+1;o=o.flatMap(s=>[s,m-s])}return o}

// One name: NFC, control and zero-width characters removed, trimmed. Newlines inside a name become spaces.
function cleanName(x){return String(x??"").normalize("NFC").replace(/[\r\n\t]+/g," ").replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200d\u2060\ufeff]/g,"").trim()}
// Turn raw textarea text into a clean entrant list. Returns {entries, warnings, error}.
function parseEntries(text){
  const raw=String(text??"").split(/\r?\n/).map(cleanName).filter(Boolean);
  const warnings=[]; let cut=0;
  const entries=raw.map(s=>{const a=Array.from(s); if(a.length>MAX_NAME){cut++;return a.slice(0,MAX_NAME).join("")} return s});
  if(cut) warnings.push(cut+" long "+(cut===1?"entry was":"entries were")+" shortened to "+MAX_NAME+" characters.");
  const seen={},dups=new Set(); entries.forEach(e=>{const k=e.toLocaleLowerCase(); if(seen[k])dups.add(e); seen[k]=1});
  if(dups.size) warnings.push("Duplicate names ("+[...dups].slice(0,5).join(", ")+(dups.size>5?", …":"")+") are kept as separate entries; seed numbers tell them apart.");
  if(entries.length>MAX_ENTRIES) return {entries,warnings,error:"Too many entries: "+entries.length+". The limit is "+MAX_ENTRIES+"."};
  if(entries.length===0) return {entries,warnings,error:"Add at least 2 entries, one per line."};
  if(entries.length===1) return {entries,warnings,error:"Only 1 entry. Add at least one more to make a bracket."};
  return {entries,warnings};
}

function buildSingle(n){
  const size=nextPow2(n), order=seedOrder(size), M=[]; let prev=[];
  for(let i=0;i<size;i+=2){const id="W1-"+(i/2+1);M.push({id,sec:"W",round:1,a:{seed:order[i]},b:{seed:order[i+1]}});prev.push(id)}
  let r=2; while(prev.length>1){const cur=[];for(let i=0;i<prev.length;i+=2){const id="W"+r+"-"+(i/2+1);M.push({id,sec:"W",round:r,a:{from:prev[i],take:"W"},b:{from:prev[i+1],take:"W"}});cur.push(id)}prev=cur;r++}
  return {format:"single",size,matches:M,final:prev[0]};
}
function buildDouble(n){
  const se=buildSingle(Math.max(n,3)), size=se.size, k=Math.log2(size), M=se.matches.slice();
  const wb=r=>M.filter(m=>m.sec==="W"&&m.round===r).map(m=>m.id);
  let lr=1, prevL=[]; const w1=wb(1);
  for(let i=0;i<w1.length;i+=2){const id="L1-"+(i/2+1);M.push({id,sec:"L",round:1,a:{from:w1[i],take:"L"},b:{from:w1[i+1],take:"L"}});prevL.push(id)}
  for(let r=2;r<=k;r++){
    lr++; const drops=wb(r).slice().reverse(), cur=[];
    prevL.forEach((p,i)=>{const id="L"+lr+"-"+(i+1);M.push({id,sec:"L",round:lr,a:{from:p,take:"W"},b:{from:drops[i],take:"L"}});cur.push(id)});
    prevL=cur;
    if(r<k){lr++;const c2=[];for(let i=0;i<prevL.length;i+=2){const id="L"+lr+"-"+(i/2+1);M.push({id,sec:"L",round:lr,a:{from:prevL[i],take:"W"},b:{from:prevL[i+1],take:"W"}});c2.push(id)}prevL=c2}
  }
  M.push({id:"GF",sec:"G",round:1,a:{from:se.final,take:"W"},b:{from:prevL[0],take:"W"}});
  M.push({id:"GF2",sec:"G",round:2,a:{from:"GF",take:"W"},b:{from:"GF",take:"L"},resetOnly:true});
  return {format:"double",size,matches:M,final:"GF2"};
}
function build(format,n){
  if(!FORMATS.includes(format)) return {error:"Unknown format."};
  if(!(n>=2)) return {error:"Need at least 2 entries."};
  if(n>MAX_ENTRIES) return {error:"The limit is "+MAX_ENTRIES+" entries."};
  if(format==="double"&&n<3) return {error:"Double elimination needs at least 3 entries. With 2, use single elimination."};
  if(format==="rr") return {error:"Round robin has no bracket; use roundRobin()."};
  return format==="double"?buildDouble(n):buildSingle(n);
}

function resolve(br, entrants, winners){
  const byId={}, out={}; br.matches.forEach(m=>byId[m.id]=m);
  const slot=s=>{ if(s.seed!==undefined) return s.seed<=entrants.length?s.seed:null;
    const r=res(s.from); return r? (s.take==="W"?r.winner:r.loser) : undefined; };
  function res(id){ if(id in out) return out[id]; const m=byId[id]; const a=slot(m.a), b=slot(m.b);
    const st={a,b,winner:undefined,loser:undefined,ready:false,skip:false};
    if(m.resetOnly){ const gf=res("GF"); const lbChamp=gf&&gf.b;
      if(!gf||gf.winner===undefined){out[id]=st;return st}
      if(gf.winner!==lbChamp||lbChamp===null){st.skip=true;st.winner=gf.winner;st.loser=gf.loser;out[id]=st;return st} }
    if(a===undefined||b===undefined){out[id]=st;return st}
    if(a===null||b===null){st.winner=a===null?b:a;st.loser=null;st.auto=true;out[id]=st;return st}
    st.ready=true; const w=winners[id];
    if(w===a||w===b){st.winner=w;st.loser=w===a?b:a}
    out[id]=st; return st; }
  br.matches.forEach(m=>res(m.id)); return out;
}
function nameOf(entrants,seed){return seed==null?seed:entrants[seed-1]}
function champion(br,entrants,winners){const r=resolve(br,entrants,winners)[br.final];return r&&r.winner!==undefined&&r.winner!==null?r.winner:undefined}
function pick(br,entrants,winners,id,seed){const w=Object.assign({},winners);w[id]=Number(seed);
  for(let pass=0;pass<=br.matches.length;pass++){const R=resolve(br,entrants,w);let changed=false;
    for(const k of Object.keys(w)){const r=R[k];if(!r||!r.ready||(w[k]!==r.a&&w[k]!==r.b)){delete w[k];changed=true}}
    if(!changed)break}
  return w;}
// Matches the user can still decide, in play order.
function openMatches(br,R){return br.matches.filter(m=>R[m.id].ready&&R[m.id].winner===undefined&&!R[m.id].skip)}

// Round robin (circle method). Byes are null, never a string, so an entry named "(bye)" is safe.
function roundRobin(entrants){
  if(entrants.length<2) return {error:"Need at least 2 entries."};
  if(entrants.length>RR_MAX) return {error:"Round robin is limited to "+RR_MAX+" entries ("+entrants.length+" given), because everyone plays everyone. Use single or double elimination for bigger groups."};
  const t=entrants.map((_,i)=>i+1); if(t.length%2) t.push(null);
  const n=t.length, rounds=[]; let arr=t.slice();
  for(let r=0;r<n-1;r++){const games=[];for(let i=0;i<n/2;i++){const a=arr[i],b=arr[n-1-i];games.push(a===null?[b,null]:[a,b])}
    rounds.push(games); arr=[arr[0],arr[n-1],...arr.slice(1,n-1)];}
  return {rounds};
}

const TEMPLATES={
  "halloween-candy":{t:"Best Halloween Candy",e:["Peanut butter cups","Chocolate bars","Candy corn","Gummy worms","Lollipops","Caramel apples","Sour candy","Mini pretzels"]},
  "thanksgiving-sides":{t:"Thanksgiving Side Dish Showdown",e:["Stuffing","Mashed potatoes","Cranberry sauce","Green bean casserole","Mac and cheese","Rolls","Sweet potatoes","Corn"]},
  "office-snacks":{t:"Office Snack Bracket",e:["Popcorn","Trail mix","Granola bars","Pretzels","Fruit","Cookies","Chips","Cheese crackers","Dark chocolate","Veggie sticks"]},
  "christmas-cookies":{t:"Best Christmas Cookie",e:["Sugar cookies","Gingerbread","Snickerdoodles","Shortbread","Peanut butter blossoms","Thumbprints","Biscotti","Chocolate crinkles"]},
  "holiday-movies":{t:"Best Holiday Movie Genre",e:["Animated classic","Romantic comedy","Family adventure","Musical","Black-and-white classic","Stop-motion","Comedy","Feel-good drama"]},
  "holiday-songs":{t:"Best Holiday Song Style",e:["Classic crooner","Choir carol","Pop hit","Rock version","Jazz standard","Kids' sing-along","Instrumental","Novelty song"]},
  "fall-activities":{t:"Best Fall Activity",e:["Apple picking","Hayride","Pumpkin carving","Corn maze","Leaf peeping","Bonfire","Baking pies","Cider tasting"]},
  "breakfast":{t:"Breakfast Food Bracket",e:["Pancakes","Waffles","Bagels","Eggs and toast","Oatmeal","Breakfast tacos","Cereal","French toast","Smoothie"]},
  "board-games":{t:"Best Board Game Type",e:["Strategy","Party","Co-op","Trivia","Word games","Deck building","Classic family","Dexterity"]},
  "vacation":{t:"Dream Vacation Spot",e:["Beach","Mountains","Big city","National park","Cruise","Countryside","Island","Road trip"]},
  "pizza-toppings":{t:"Best Pizza Topping",e:["Pepperoni","Mushrooms","Sausage","Olives","Pineapple","Onions","Peppers","Extra cheese","Bacon","Spinach","Jalapeños","Tomatoes"]},
  "90s-cartoons":{t:"Best '90s Cartoon Type",e:["Saturday morning","After-school","Superhero","Talking animals","Sketch comedy","Monster of the week","Educational","Anime import"]},
  "coffee-drinks":{t:"Coffee Shop Drink",e:["Latte","Cappuccino","Cold brew","Mocha","Americano","Chai latte","Flat white","Hot chocolate"]},
  "ice-cream":{t:"Best Ice Cream Flavor",e:["Vanilla","Chocolate","Strawberry","Mint chip","Cookie dough","Rocky road","Butter pecan","Pistachio"]},
  "resolutions":{t:"New Year's Resolution",e:["Exercise more","Read more","Save money","Learn a skill","Travel","Sleep better","Cook at home","Call family more"]}
};
function b64enc(s){return typeof btoa!=="undefined"?btoa(unescape(encodeURIComponent(s))):Buffer.from(s,"utf8").toString("base64")}
function b64dec(s){return typeof atob!=="undefined"?decodeURIComponent(escape(atob(s))):Buffer.from(s,"base64").toString("utf8")}
function encodeState(o){return b64enc(JSON.stringify(o))}
// Share links are untrusted input. decodeStateInfo returns {state, warnings} or throws.
// Entries get the same clean-up as typed entries (parseEntries); anything cut or removed is reported.
function decodeStateInfo(s){
  const o=JSON.parse(b64dec(String(s)));
  if(!o||typeof o!=="object"||!Array.isArray(o.e)) throw new Error("bad link");
  if(!FORMATS.includes(o.f)) throw new Error("bad format");
  const strs=o.e.filter(x=>typeof x==="string").map(cleanName);
  const dropped=o.e.length-strs.filter(Boolean).length;
  const p=parseEntries(strs.join("\n")), warnings=p.warnings.slice();
  let e=p.entries;
  if(e.length>MAX_ENTRIES){warnings.push("This share link had "+e.length+" entries; only the first "+MAX_ENTRIES+" are shown.");e=e.slice(0,MAX_ENTRIES)}
  if(dropped>0) warnings.push(dropped+" empty or invalid "+(dropped===1?"entry was":"entries were")+" removed from this link"+(o.w&&Object.keys(o.w).length?", so the saved picks were cleared":"")+".");
  if(e.length<2) throw new Error("too few entries");
  const w={}; if(!dropped&&o.w&&typeof o.w==="object") for(const [k,v] of Object.entries(o.w)){if(/^(W|L)\d+-\d+$|^GF2?$/.test(k)&&Number.isInteger(v)&&v>=1&&v<=e.length)w[k]=v}
  const t=typeof o.t==="string"?Array.from(cleanName(o.t)).slice(0,MAX_TITLE).join("")||"Bracket":"Bracket";
  return {state:{t,f:o.f,e,w},warnings};
}
function decodeState(s){return decodeStateInfo(s).state}
function uniqueName(title,existing){const base=(title||"Untitled").trim()||"Untitled";if(!Object.prototype.hasOwnProperty.call(existing,base))return base;let i=2;while(Object.prototype.hasOwnProperty.call(existing,base+" ("+i+")"))i++;return base+" ("+i+")"}
function roundName(sec,round,total){
  if(sec==="G") return round===1?"Grand final":"Reset final (only if needed)";
  if(sec==="L") return "Losers round "+round;
  const left=total-round; return left===0?"Final":left===1?"Semifinals":left===2?"Quarterfinals":"Round "+round;
}
const api={MAX_ENTRIES,RR_MAX,cleanName,decodeStateInfo,MAX_NAME,FORMATS,parseEntries,nextPow2,seedOrder,build,buildSingle,buildDouble,resolve,nameOf,champion,pick,openMatches,roundRobin,TEMPLATES,encodeState,decodeState,uniqueName,roundName};
if(typeof module!=="undefined"&&module.exports) module.exports=api; else root.Bracket=api;
})(this);
