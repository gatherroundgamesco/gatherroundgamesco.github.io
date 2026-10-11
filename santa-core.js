// Secret Santa draw: no email, exclusions, wish lists. Pure functions, run in the browser and in node.
// MAX_PEOPLE keeps the draw fast and the page usable; raise only with tests.
var SANTA_MAX_PEOPLE = 500;

function santaShuffle(a, rng){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t;} return a; }
function santaKey(s){ return String(s).normalize("NFC").trim().toLowerCase(); }

// Validate a list of names. Returns {error} or {people} (trimmed, NFC-normalized).
function validatePeople(people){
  if(!Array.isArray(people)) return {error:"Names must be a list."};
  const out=[], seen=new Map();
  for(const raw of people){
    const name=String(raw==null?"":raw).normalize("NFC").trim();
    if(!name) return {error:"One of the names is empty. Remove blank names and try again."};
    const k=santaKey(name);
    if(seen.has(k)) return {error:`"${name}" is listed twice. Give each person a unique name (add an initial, e.g. "Sam K").`};
    seen.set(k,name); out.push(name);
  }
  if(out.length<3) return {error:"Need at least 3 people."};
  if(out.length>SANTA_MAX_PEOPLE) return {error:`Too many people (max ${SANTA_MAX_PEOPLE}).`};
  return {people:out};
}

// Bipartite matching helpers over index graphs. adj[g] = allowed recipient indexes for giver g.
function santaAdj(people, ok){ return people.map(g=>people.map((r,j)=>ok(g,r)?j:-1).filter(j=>j>=0)); }
// Find an augmenting path from giver u (iterative DFS). Skips recipients where blockedR[v] is set.
function santaAugment(u, adj, mg, mr, blockedR){
  const n=adj.length, seen=new Uint8Array(n), stack=[[u,0]], via=[];
  while(stack.length){ const top=stack[stack.length-1], g=top[0], list=adj[g]; let pushed=false;
    while(top[1]<list.length){ const v=list[top[1]++]; if(seen[v]||(blockedR&&blockedR[v])) continue; seen[v]=1;
      if(mr[v]<0){ via.push(v); // unwind: path givers are stack entries, recipients in via
        for(let k=stack.length-1;k>=0;k--){ const gg=stack[k][0], vv=via[k]; mr[vv]=gg; mg[gg]=vv; }
        return true; }
      via.push(v); stack.push([mr[v],0]); pushed=true; break; }
    if(!pushed){ stack.pop(); via.pop(); } }
  return false;
}
function santaMatch(adj){ const n=adj.length, mg=new Int32Array(n).fill(-1), mr=new Int32Array(n).fill(-1);
  for(let i=0;i<n;i++) if(!santaAugment(i,adj,mg,mr,null)) return null; return {mg,mr}; }
// Exact feasibility check: a valid draw exists iff the giver->allowed-recipient graph has a perfect matching.
function santaFeasible(people, ok){ return !!santaMatch(santaAdj(people,ok)); }
// Matching-guided draw: givers in random order; each tries its allowed recipients in random order and keeps
// a pick only if the remaining givers can still be perfectly matched (checked incrementally by one augmenting path).
function santaGuided(people, ok, rng){
  const n=people.length, adj=santaAdj(people,ok), m=santaMatch(adj); if(!m) return null;
  const {mg,mr}=m, fixedR=new Uint8Array(n), res={};
  for(const g of santaShuffle([...Array(n).keys()],rng)){
    let done=false;
    for(const r of santaShuffle(adj[g],rng)){
      if(fixedR[r]) continue;
      if(mg[g]===r){ done=true; }
      else { const h=mr[r], old=mg[g], smg=mg.slice(), smr=mr.slice();
        // g takes r; h (r's current giver) must find another way to a recipient, ending at g's freed one.
        mg[g]=r; mr[r]=g; mr[old]=-1; mg[h]=-1; fixedR[r]=1;
        if(santaAugment(h,adj,mg,mr,fixedR)) done=true; else { mg.set(smg); mr.set(smr); fixedR[r]=0; }
      }
      if(done){ fixedR[r]=1; res[people[g]]=people[r]; break; }
    }
    if(!done) return null; // cannot happen while a perfect matching exists
  }
  return res;
}

function drawSanta(people, exclusions, rng){
  rng=rng||Math.random;
  const v=validatePeople(people); if(v.error) return {error:v.error, field:"names"};
  people=v.people; const n=people.length;
  const byKey=new Map(people.map(p=>[santaKey(p),p]));
  const bad=new Set(), E=m=>({error:m, field:"exclusions"});
  for(const pair of (exclusions||[])){
    if(!Array.isArray(pair)||pair.length!==2) return E("Each exclusion needs exactly two names.");
    const a=byKey.get(santaKey(pair[0])), b=byKey.get(santaKey(pair[1]));
    if(!a||!b) return E(`Exclusion "${pair[0]} - ${pair[1]}" uses a name that isn't in the list.`);
    if(a===b) return E(`Exclusion "${pair[0]} - ${pair[1]}" pairs a person with themselves.`);
    bad.add(a+"\u0000"+b); bad.add(b+"\u0000"+a);
  }
  const ok=(g,r)=>g!==r&&!bad.has(g+"\u0000"+r);
  for(const g of people) if(!people.some(r=>ok(g,r))) return E(`${g} is excluded from everyone, so no draw is possible. Remove one of their exclusions.`);
  if(!santaFeasible(people,ok)) return E("No valid draw with these exclusions. Remove one exclusion and try again.");
  // Uniform draw: rejection sampling over uniformly random permutations. Every valid assignment is equally likely.
  // Without exclusions about 1 in e shuffles is accepted, so this is fast for any n.
  for(let t=0;t<2000;t++){ // P(no accept in 2000) is negligible unless exclusions are very tight; then the fallback runs
    const perm=santaShuffle(people,rng); let good=true;
    for(let i=0;i<n;i++) if(!ok(people[i],perm[i])){good=false;break}
    if(good){ const res={}; people.forEach((g,i)=>res[g]=perm[i]); return {pairs:res, uniform:true}; }
  }
  // Fallback for tight exclusion sets: matching-guided draw. Valid every time and polynomial
  // (an incremental augmenting-path check per pick), but not exactly uniform.
  const pairs=santaGuided(people,ok,rng); if(pairs) return {pairs, uniform:false};
  return E("No valid draw with these exclusions. Remove one exclusion and try again.");
}

// Encode a reveal so the link itself carries it (no server, no email).
// SCRAMBLED, NOT ENCRYPTED: anyone with the link (or who knows this code) can decode it. See the FAQ on santa.html.
function encodeReveal(obj){ const s=unescape(encodeURIComponent(JSON.stringify(obj))); const b=(typeof btoa!=="undefined")?btoa(s):Buffer.from(s,"binary").toString("base64"); return b.split("").reverse().join("").replace(/\+/g,"-").replace(/\//g,"_"); }
// Accepts both the URL-safe form and older links made with + and /.
function decodeReveal(s){ const b=String(s).replace(/-/g,"+").replace(/_/g,"/").split("").reverse().join(""); const bin=(typeof atob!=="undefined")?atob(b):Buffer.from(b,"base64").toString("binary"); return JSON.parse(decodeURIComponent(escape(bin))); }
if(typeof module!=="undefined") module.exports={drawSanta,santaFeasible,validatePeople,encodeReveal,decodeReveal,SANTA_MAX_PEOPLE};
