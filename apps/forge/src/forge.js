// Forge Remake: the whole editor, moved from the single-file prototype (artifact v7).
// It will be split into modules (packages/formats first) step by step.
"use strict";
// =============================================================== constants
const WU = 1024;
const ENVS = [
  {name:"Water", col:17, wall:[96,118,134], floor:[70,84,96], ceil:[110,124,136], panel:[150,170,186]},
  {name:"Lava", col:18, wall:[132,96,70], floor:[92,68,54], ceil:[118,98,84], panel:[196,120,60]},
  {name:"Sewage", col:19, wall:[96,112,84], floor:[70,78,60], ceil:[104,112,96], panel:[150,168,100]},
  {name:"Jjaro", col:20, wall:[180,170,140], floor:[120,128,118], ceil:[190,184,160], panel:[90,170,170]},
  {name:"Pfhor", col:21, wall:[104,86,124], floor:[70,60,86], ceil:[116,100,134], panel:[170,110,200]},
];
const LANDSCAPES = ["Daytime","Night","Moon","Outer space"];
const POLY_TYPES = [
  [0,"Normal"],[1,"Item impassable"],[2,"Monster impassable"],[3,"Hill (King of the Hill)"],[4,"Base (team)"],[5,"Door or lift (platform)"],[6,"Light on trigger"],[7,"Platform on trigger"],[8,"Light off trigger"],[9,"Platform off trigger"],
  [10,"Teleporter"],[11,"Zone border"],[12,"Goal"],[13,"Visible monster trigger"],[14,"Invisible monster trigger"],
  [15,"Dual monster trigger"],[16,"Item trigger"],[17,"Must be explored"],[18,"Automatic exit"],[19,"Minor ouch"],
  [20,"Major ouch"],[21,"Glue"],[22,"Glue trigger"],[23,"Superglue"]];
const TYPE_NAME = Object.fromEntries(POLY_TYPES);
const PERM_LABEL = {4:"Team", 6:"Light #", 7:"Platform polygon #", 8:"Light #", 9:"Platform polygon #", 10:"Target polygon # (−1 − n = level n)", 18:"Level #"};
const MONSTERS = [
  ["Marine","Marine"],["TickEnergy","Tick (energy)"],["TickOxygen","Tick (oxygen)"],["TickKamikaze","Tick (kamikaze)"],
  ["CompilerMinor","S'pht compiler (minor)"],["CompilerMajor","S'pht compiler (major)"],["CompilerMinorInvisible","Compiler, invisible (minor)"],["CompilerMajorInvisible","Compiler, invisible (major)"],
  ["FighterMinor","Pfhor fighter (minor)"],["FighterMajor","Pfhor fighter (major)"],["FighterMinorProjectile","Fighter, staff shot (minor)"],["FighterMajorProjectile","Fighter, staff shot (major)"],
  ["BobCrew","Bob (crew)"],["BobScience","Bob (science)"],["BobSecurity","Bob (security)"],["BobAssimilated","Bob (assimilated)"],
  ["DroneMinor","Drone (minor)"],["DroneMajor","Drone (major)"],["BigDroneMinor","Big drone (minor)"],["BigDroneMajor","Big drone (major)"],["DronePossessed","Possessed drone"],
  ["CyborgMinor","Cyborg (minor)"],["CyborgMajor","Cyborg (major)"],["FlameCyborgMinor","Flame cyborg (minor)"],["FlameCyborgMajor","Flame cyborg (major)"],
  ["EnforcerMinor","Enforcer (minor)"],["EnforcerMajor","Enforcer (major)"],["HunterMinor","Hunter (minor)"],["HunterMajor","Hunter (major)"],
  ["TrooperMinor","Trooper (minor)"],["TrooperMajor","Trooper (major)"],["MotherOfAllCyborgs","Mother of all cyborgs"],["MotherOfAllHunters","Mother of all hunters"],
  ["SewageYeti","Sewage yeti"],["WaterYeti","Water yeti"],["LavaYeti","Lava yeti"],["DefenderMinor","Defender (minor)"],["DefenderMajor","Defender (major)"],
  ["JuggernautMinor","Juggernaut (minor)"],["JuggernautMajor","Juggernaut (major)"],["TinyFighter","Tiny fighter"],["TinyBob","Tiny Bob"],["TinyYeti","Tiny yeti"],
  ["FusionBobCrew","Fusion Bob (crew)"],["FusionBobScience","Fusion Bob (science)"],["FusionBobSecurity","Fusion Bob (security)"],["FusionBobAssimilated","Fusion Bob (assimilated)"]];
const ITEMS = [
  ["Fists","Fists"],["Magnum","Magnum pistol"],["MagnumMagazine","Magnum magazine"],["FusionPistol","Fusion pistol"],["FusionBattery","Fusion battery"],
  ["AssaultRifle","MA-75 assault rifle"],["AssaultRifleMagazine","MA-75 magazine"],["AssaultGrenades","MA-75 grenades"],["RocketLauncher","SPNKR rocket launcher"],["Rockets","SPNKR rockets"],
  ["Invisibility","Invisibility"],["Invincibility","Invincibility"],["Infravision","Infravision"],["AlienWeapon","Alien weapon"],["AlienAmmo","Alien ammo"],
  ["Flamethrower","TOZT flamethrower"],["NapalmCanister","Napalm canister"],["Extravision","Extravision"],["Oxygen","Oxygen charge"],
  ["Shield1x","1x shield"],["Shield2x","2x shield"],["Shield3x","3x shield"],["Shotgun","WSTE-M shotgun"],["ShotgunShells","Shotgun shells"],
  ["SphtKey","S'pht door key"],["UplinkChip","Uplink chip"],["BallLightBlue","Ball (light blue)"],["BallRed","Ball (red)"],["BallViolet","Ball (violet)"],
  ["BallYellow","Ball (yellow)"],["BallBrown","Ball (brown)"],["BallOrange","Ball (orange)"],["BallBlue","Ball (blue)"],["BallGreen","Ball (green)"],
  ["SMG","KKV-7 SMG"],["SMGAmmo","SMG ammo"]];
const OBJ_KINDS = [[3,"Player start"],[0,"Monster"],[2,"Item"],[1,"Scenery"],[4,"Goal flag"],[5,"Sound"]];
const KIND_NAME = Object.fromEntries(OBJ_KINDS);
const GAME_TYPES = [[1,"Solo"],[2,"Co-op"],[4,"Carnage"],[8,"Kill the man with the ball"],[16,"King of the hill"],[32,"Defense"],[64,"Rugby"],[128,"Capture the flag"]];
const ENV_FLAGS = [[1,"Vacuum"],[2,"Magnetic"],[4,"Rebellion"],[8,"Low gravity"]];
const MISSIONS = [[1,"Extermination"],[2,"Exploration"],[4,"Retrieval"],[8,"Repair"],[16,"Rescue"]];
const M1_COMPAT = [[0x0200,"M1 monster activation range"],[0x0400,"M1 weapons"],[0x0010,"M1 glue polygons"],[0x0020,"Floor is lava (M1 ouch)"],[0x0040,"M1 rebellion"],[0x0080,"Landscape picks music"],[0x0100,"Terminals stop time"]];
const MON_FLAGS = [[1,"Teleports in"],[2,"From ceiling"],[4,"Blind"],[8,"Deaf"],[16,"Floats / teleports out"],[32,"Network only"]];
const GRIDS = [[64,"1/16 WU"],[128,"1/8 WU"],[256,"1/4 WU"],[512,"1/2 WU"],[1024,"1 WU"]];
const MAXC = 32000;

// =============================================================== document model
// Points, lines and polygons reference each other by object, so edits never need reindexing.
let pidSeq = 1;
const GAMES = {
  m1:{name:"Marathon", short:"Marathon", dataVersion:1, note:"Saved in the Durandal/Infinity format with Marathon 1 compatibility flags, the way Aleph One's Marathon scenario expects."},
  m2:{name:"Marathon 2: Durandal", short:"Durandal", dataVersion:1, note:"Durandal maps also play in Infinity."},
  inf:{name:"Marathon Infinity", short:"Infinity", dataVersion:1, note:"Infinity-format map for Aleph One's Infinity scenario."}};
const GAME_IDS=["m1","m2","inf"];
const M1_ENV_NAMES=["Wall set 1","Wall set 2","Wall set 3","Wall set 4","Wall set 5"];
function envName(game,e){return game==="m1"?M1_ENV_NAMES[e]:(ENVS[e]||ENVS[0]).name;}
function envOptions(game){ // environments with wall textures for this game (from its Shapes file when loaded)
  const s=typeof shapesFor==="function"?shapesFor(game):null;let codes;
  if(s&&!s.fallback){codes=[0,1,2,3,4].filter(e=>{const c=s.st.parsed.cols[17+e];try{return c&&decodeCollection(c).type===1;}catch(_){return false;}});}
  if(!codes||!codes.length)codes=game==="m1"?[0,1,2]:game==="m2"?[0,1,2,4]:[0,1,2,3,4];
  return codes.map(e=>[e,envName(game,e)]);}
const M1_FLAGS=0x0200|0x0400; // default compatibility flags for Marathon 1 maps
function newDoc(game="inf"){ return {pts:[],lines:[],polys:[],objs:[],sides:new Map(),terms:[],notes:[],lights:null,ambi:null,bonk:null,physics:{mode:"none"},placement:null,
  info:{name:"Untitled Level",game,env:0,landscape:0,entry:1|2,mission:0,envFlags:game==="m1"?M1_FLAGS:0}}; }
let doc = newDoc();
const P = (x,y)=>({id:pidSeq++, x:Math.round(x), y:Math.round(y)});
function polyDefaults(){ return {floor:0, ceil:WU, light:100, type:0, perm:0, ftex:texDefault("floor"), ctex:texDefault("ceil"), wtex:texDefault("wall"), fox:0, foy:0, cox:0, coy:0, fxfer:0, cxfer:0}; }
// Painted wall textures live per polygon side, keyed by the side's direction (a→b, clockwise around its polygon).
// Each side may hold a "full", "upper" and "lower" texture {b, ox, oy}; unpainted parts use the polygon's wall bitmap.
const sideKey=(a,b)=>a.id+">"+b.id;
function sideGet(a,b){return doc.sides.get(sideKey(a,b));}
function sideSet(a,b,part,t){const k=sideKey(a,b);const s=doc.sides.get(k)||{};if(t)s[part]=t;else delete s[part];if(Object.keys(s).length)doc.sides.set(k,s);else doc.sides.delete(k);}
function cloneSide(s){return s?JSON.parse(JSON.stringify(s)):s;}

function serialize(d=doc){
  const idx = new Map(d.pts.map((p,i)=>[p,i]));const byId=new Map(d.pts.map((p,i)=>[p.id,i]));
  const sides=[];for(const [k,v] of d.sides){const [a,b]=k.split(">").map(Number);if(byId.has(a)&&byId.has(b))sides.push([byId.get(a),byId.get(b),v]);}
  return JSON.stringify({format:"forge-remake",version:3,info:d.info,
    pts:d.pts.map(p=>[p.x,p.y]),
    lines:d.lines.map(l=>[idx.get(l.a),idx.get(l.b),l.solid?1:0]),
    polys:d.polys.map(q=>{const {verts,...rest}=q;return {...rest,verts:verts.map(v=>idx.get(v))};}),
    sides,objs:d.objs,placement:d.placement||null,terms:d.terms||[],notes:d.notes||[],lights:d.lights||null,ambi:d.ambi||null,bonk:d.bonk||null,physics:d.physics||{mode:"none"}});
}
function deserialize(s){
  const o = typeof s==="string" ? JSON.parse(s) : s;
  const d = newDoc((o.info&&o.info.game)||"inf");
  Object.assign(d.info, o.info||{});
  if(!GAMES[d.info.game])d.info.game="inf";
  d.pts = (o.pts||[]).map(([x,y])=>P(x,y));
  d.lines = (o.lines||[]).filter(l=>d.pts[l[0]]&&d.pts[l[1]]&&l[0]!==l[1]).map(([a,b,s])=>({a:d.pts[a],b:d.pts[b],solid:!!s}));
  d.polys = (o.polys||[]).filter(q=>q.verts&&q.verts.length>=3&&q.verts.every(i=>d.pts[i])).map(q=>{const r={...polyDefaults(),...q,verts:q.verts.map(i=>d.pts[i])};for(const k of ["flight","clight","fli","cli"])if(r[k]==null)delete r[k];return r;});
  for(const [a,b,v] of (o.sides||[]))if(d.pts[a]&&d.pts[b])d.sides.set(d.pts[a].id+">"+d.pts[b].id,v);
  d.objs = (o.objs||[]).map(x=>({kind:3,sub:0,x:0,y:0,z:0,facing:0,flags:0,...x}));
  for(const k of ["placement","terms","notes","lights","ambi","bonk","physics"])if(o[k]!=null)d[k]=o[k];
  return d;
}
// Light indexes kept from an imported map stop applying once a surface's light is edited here.
function clearPolyLightIdx(q){delete q.fli;delete q.cli;for(let k=0;k<q.verts.length;k++){const s=sideGet(q.verts[k],q.verts[(k+1)%q.verts.length]);if(s)for(const part of ["full","upper","lower","trans"])if(s[part]&&s[part].light==null)delete s[part].li;}}
// Polygon numbers stored in teleporters, platform triggers and platform switches follow polygons when others are deleted.
let lastPolys=null;
function remapPolyRefs(){
  if(!lastPolys){lastPolys=doc.polys.slice();return;}
  const same=lastPolys.length<=doc.polys.length&&lastPolys.every((q,i)=>doc.polys[i]===q);
  if(!same){const now=new Map(doc.polys.map((q,i)=>[q,i]));const map=lastPolys.map(q=>now.has(q)?now.get(q):-1);
    const fix=v=>v>=0&&v<map.length?map[v]:v;
    for(const q of doc.polys)if([7,9,10].includes(q.type))q.perm=fix(q.perm);
    for(const s of doc.sides.values())if(s.panel&&panelKeyOf(s.panel.type)==="platform")s.panel.perm=fix(s.panel.perm);}
  lastPolys=doc.polys.slice();
}
function resetPolyRefs(){lastPolys=doc.polys.slice();}

// =============================================================== geometry helpers
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hyp=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
function segT(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy;return L?((p.x-a.x)*dx+(p.y-a.y)*dy)/L:0;}
function distSeg(p,a,b){const t=clamp(segT(p,a,b),0,1);return Math.hypot(p.x-(a.x+t*(b.x-a.x)),p.y-(a.y+t*(b.y-a.y)));}
function signedArea(vs){let s=0;for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];s+=a.x*b.y-b.x*a.y;}return s/2;}
function centroid(vs){let x=0,y=0;for(const v of vs){x+=v.x;y+=v.y;}return {x:x/vs.length,y:y/vs.length};}
function pointInPoly(p,vs){let c=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const a=vs[i],b=vs[j];
  if(((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x))c=!c;}return c;}
function isConvex(vs){ // vertices clockwise on screen (y down) => cross products >= 0
  const n=vs.length;
  for(let i=0;i<n;i++){const a=vs[i],b=vs[(i+1)%n],c=vs[(i+2)%n];
    const d1x=b.x-a.x,d1y=b.y-a.y,d2x=c.x-b.x,d2y=c.y-b.y;
    const cr=d1x*d2y-d1y*d2x, m=Math.hypot(d1x,d1y)*Math.hypot(d2x,d2y);
    if(m>0 && cr/m < -0.003) return false;}
  return true;
}
function segIntersect(p,q,a,b){
  const rx=q.x-p.x,ry=q.y-p.y,sx=b.x-a.x,sy=b.y-a.y,den=rx*sy-ry*sx;
  if(Math.abs(den)<1e-9) return null;
  const t=((a.x-p.x)*sy-(a.y-p.y)*sx)/den, u=((a.x-p.x)*ry-(a.y-p.y)*rx)/den;
  if(t>1e-6&&t<1-1e-6&&u>1e-6&&u<1-1e-6) return {x:p.x+t*rx,y:p.y+t*ry,t};
  return null;
}
function convexOverlap(A,B,eps=4){ // separating axis test with a small tolerance so touching edges don't count
  for(const poly of [A,B]) for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];const nx=-(b.y-a.y),ny=b.x-a.x,len=Math.hypot(nx,ny);if(!len)continue;
    let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;
    for(const v of A){const d=(v.x*nx+v.y*ny)/len;amin=Math.min(amin,d);amax=Math.max(amax,d);}
    for(const v of B){const d=(v.x*nx+v.y*ny)/len;bmin=Math.min(bmin,d);bmax=Math.max(bmax,d);}
    if(amax<=bmin+eps||bmax<=amin+eps) return false;
  }
  return true;
}
function polyHasEdge(q,a,b){const n=q.verts.length;for(let i=0;i<n;i++){const u=q.verts[i],v=q.verts[(i+1)%n];if((u===a&&v===b)||(u===b&&v===a))return true;}return false;}
function findLine(a,b){for(const l of doc.lines)if((l.a===a&&l.b===b)||(l.a===b&&l.b===a))return l;return null;}
function lineOwners(l){return doc.polys.filter(q=>polyHasEdge(q,l.a,l.b));}
function polyAtPoint(p){for(let i=doc.polys.length-1;i>=0;i--)if(pointInPoly(p,doc.polys[i].verts))return doc.polys[i];return null;}

// =============================================================== editing operations
function splitLine(l,x,y){
  const r=P(x,y);doc.pts.push(r);
  const A=l.a,B=l.b;l.b=r;doc.lines.push({a:r,b:B,solid:l.solid});
  for(const [u,v] of [[A,B],[B,A]]){const s=doc.sides.get(sideKey(u,v));if(s){doc.sides.delete(sideKey(u,v));doc.sides.set(sideKey(u,r),cloneSide(s));
    const s2=cloneSide(s);const len=hyp(u.x,u.y,r.x,r.y);for(const t of Object.values(s2))t.ox=(t.ox||0)+Math.round(len);doc.sides.set(sideKey(r,v),s2);}}
  for(const q of doc.polys){const n=q.verts.length;for(let i=0;i<n;i++){const u=q.verts[i],v=q.verts[(i+1)%n];
    if((u===A&&v===B)||(u===B&&v===A)){q.verts.splice(i+1,0,r);break;}}}
  return r;
}
function addPointAt(x,y,tol=1){
  x=Math.round(clamp(x,-MAXC,MAXC));y=Math.round(clamp(y,-MAXC,MAXC));
  let best=null,bd=tol;for(const p of doc.pts){const d=hyp(p.x,p.y,x,y);if(d<=bd){bd=d;best=p;}}
  if(best)return best;
  for(const l of doc.lines){if(distSeg({x,y},l.a,l.b)<=tol){const t=segT({x,y},l.a,l.b);if(t>0&&t<1)return splitLine(l,x,y);}}
  const p=P(x,y);doc.pts.push(p);return p;
}
function addSegment(p,q){
  if(p===q)return [p];
  for(const l of [...doc.lines]){
    if(l.a===p||l.b===p||l.a===q||l.b===q)continue;
    const I=segIntersect(p,q,l.a,l.b);if(!I)continue;
    const ix=Math.round(I.x),iy=Math.round(I.y);
    if(hyp(ix,iy,l.a.x,l.a.y)<1.5||hyp(ix,iy,l.b.x,l.b.y)<1.5)continue;
    splitLine(l,ix,iy);
  }
  const on=[];
  for(const r of doc.pts){if(r===p||r===q)continue;if(distSeg(r,p,q)<=1.01){const t=segT(r,p,q);if(t>1e-6&&t<1-1e-6)on.push([t,r]);}}
  on.sort((a,b)=>a[0]-b[0]);
  const chain=[p,...on.map(o=>o[1]),q];
  for(let i=0;i<chain.length-1;i++){if(!findLine(chain[i],chain[i+1]))doc.lines.push({a:chain[i],b:chain[i+1],solid:false});}
  return chain;
}
function neighborPoly(ring){for(const q of doc.polys){for(let i=0;i<ring.length;i++){if(polyHasEdge(q,ring[i],ring[(i+1)%ring.length]))return q;}}return null;}
function sameRing(q,ring){if(q.verts.length!==ring.length)return false;const s=new Set(q.verts);return ring.every(v=>s.has(v));}
function makePolygonFromPoints(ps,props){
  let ring=[];
  for(let i=0;i<ps.length;i++){const chain=addSegment(ps[i],ps[(i+1)%ps.length]);ring.push(...chain.slice(0,-1));}
  ring=ring.filter((v,i)=>v!==ring[(i+1)%ring.length]);
  if(ring.length<3||new Set(ring).size!==ring.length)return null;
  if(signedArea(ring)<0)ring.reverse();
  if(Math.abs(signedArea(ring))<64)return null;
  const dup=doc.polys.find(q=>sameRing(q,ring));if(dup)return dup;
  const nb=neighborPoly(ring);
  const base=nb?{floor:nb.floor,ceil:nb.ceil,light:nb.light,ftex:nb.ftex,ctex:nb.ctex,wtex:nb.wtex}:{};
  const poly={...polyDefaults(),...base,...(props||{}),verts:ring};
  doc.polys.push(poly);return poly;
}
function makePolygonFromCoords(cs,props){return makePolygonFromPoints(cs.map(c=>addPointAt(c.x,c.y,1)),props);}
function adjacency(){const m=new Map();const add=(a,b)=>{if(!m.has(a))m.set(a,[]);m.get(a).push(b);};
  for(const l of doc.lines){add(l.a,l.b);add(l.b,l.a);}return m;}
function traceFace(u,v,adj){
  const ring=[u];let prev=u,cur=v;
  for(let s=0;s<200;s++){
    if(cur===u)return ring;
    ring.push(cur);
    const nb=adj.get(cur)||[];const back=Math.atan2(prev.y-cur.y,prev.x-cur.x);
    let best=null,bd=Infinity;
    for(const w of nb){if(w===prev&&nb.length>1)continue;let d=Math.atan2(w.y-cur.y,w.x-cur.x)-back;
      while(d<=1e-9)d+=Math.PI*2;while(d>Math.PI*2)d-=Math.PI*2;if(d<bd){bd=d;best=w;}}
    if(!best)return null;prev=cur;cur=best;
  }
  return null;
}
function fillAt(x,y){
  const pt={x,y};
  if(polyAtPoint(pt))return {err:"That spot is already part of a polygon."};
  const cands=doc.lines.map(l=>[distSeg(pt,l.a,l.b),l]).sort((a,b)=>a[0]-b[0]).slice(0,8);
  const adj=adjacency();let best=null;
  for(const [,l] of cands)for(const [u,v] of [[l.a,l.b],[l.b,l.a]]){
    const ring=traceFace(u,v,adj);if(!ring||ring.length<3||new Set(ring).size!==ring.length)continue;
    if(!pointInPoly(pt,ring))continue;const A=Math.abs(signedArea(ring));
    if(!best||A<best.A)best={ring,A};
  }
  if(!best)return {err:"No closed loop of lines surrounds that spot."};
  let ring=best.ring;if(signedArea(ring)<0)ring=[...ring].reverse();
  if(doc.polys.find(q=>sameRing(q,ring)))return {err:"That loop is already a polygon."};
  const nb=neighborPoly(ring);
  const base=nb?{floor:nb.floor,ceil:nb.ceil,light:nb.light,ftex:nb.ftex,ctex:nb.ctex,wtex:nb.wtex}:{floor:opts.newFloor,ceil:opts.newCeil};
  const poly={...polyDefaults(),...base,verts:ring};doc.polys.push(poly);
  return {poly};
}
function deletePoint(p){doc.lines=doc.lines.filter(l=>l.a!==p&&l.b!==p);doc.polys=doc.polys.filter(q=>!q.verts.includes(p));doc.pts=doc.pts.filter(x=>x!==p);}
function deleteLine(l){doc.polys=doc.polys.filter(q=>!polyHasEdge(q,l.a,l.b));doc.lines=doc.lines.filter(x=>x!==l);pruneLonePoints();}
function deletePoly(q,withEdges){
  doc.polys=doc.polys.filter(x=>x!==q);
  if(withEdges){for(let i=0;i<q.verts.length;i++){const l=findLine(q.verts[i],q.verts[(i+1)%q.verts.length]);if(l&&lineOwners(l).length===0)doc.lines=doc.lines.filter(x=>x!==l);}pruneLonePoints();}
}
function pruneLonePoints(){const used=new Set();for(const l of doc.lines){used.add(l.a);used.add(l.b);}for(const q of doc.polys)for(const v of q.verts)used.add(v);doc.pts=doc.pts.filter(p=>used.has(p));}
function mergePoint(a,b){
  if(a===b)return;
  for(const [k,v] of [...doc.sides]){const [x,y]=k.split(">").map(Number);if(x===a.id||y===a.id){doc.sides.delete(k);const nx=x===a.id?b.id:x,ny=y===a.id?b.id:y;if(nx!==ny)doc.sides.set(nx+">"+ny,v);}}
  for(const l of doc.lines){if(l.a===a)l.a=b;if(l.b===a)l.b=b;}
  const seen=new Set();doc.lines=doc.lines.filter(l=>{if(l.a===l.b)return false;const k=Math.min(l.a.id,l.b.id)+"-"+Math.max(l.a.id,l.b.id);if(seen.has(k))return false;seen.add(k);return true;});
  for(const q of doc.polys){q.verts=q.verts.map(v=>v===a?b:v);q.verts=q.verts.filter((v,i)=>v!==q.verts[(i+1)%q.verts.length]);}
  doc.polys=doc.polys.filter(q=>q.verts.length>=3&&new Set(q.verts).size===q.verts.length);
  doc.pts=doc.pts.filter(p=>p!==a);
}
function splitPolygon(q){
  const n=q.verts.length;if(n<=8)return [q];
  const k=Math.floor(n/2);let best=null;
  for(let i=0;i<n;i++){const r1=[],r2=[];for(let j=0;j<=k;j++)r1.push(q.verts[(i+j)%n]);for(let j=k;j<=n;j++)r2.push(q.verts[(i+j)%n]);
    const s=Math.min(Math.abs(signedArea(r1)),Math.abs(signedArea(r2)));if(!best||s>best.s)best={s,r1,r2};}
  if(!best||best.s<64)return [q];
  if(!findLine(best.r1[0],best.r1[best.r1.length-1]))doc.lines.push({a:best.r1[0],b:best.r1[best.r1.length-1],solid:false});
  q.verts=best.r1;const q2={...q,verts:best.r2};doc.polys.push(q2);
  return [...splitPolygon(q),...splitPolygon(q2)];
}

// =============================================================== undo
let undoStack=[],redoStack=[];
function pushUndo(){undoStack.push(serialize());if(undoStack.length>150)undoStack.shift();redoStack.length=0;}
function undo(){if(!undoStack.length)return;redoStack.push(serialize());doc=deserialize(undoStack.pop());afterLoad("Undone.");}
function redo(){if(!redoStack.length)return;undoStack.push(serialize());doc=deserialize(redoStack.pop());afterLoad("Redone.");}
function afterLoad(msg){sel={kind:null,items:[]};chain=[];resetPolyRefs();changed();if(msg)status(msg);}

// =============================================================== UI state
let sel={kind:null,items:[]};
let tool="select";
let chain=[]; // in-progress line drawing
const opts={snap:true,grid:128,viewMode:"draw",showValues:true,autoFill:true,newFloor:0,newCeil:WU,objKind:0,objSub:8,objItem:5,uiStyle:"modern"};
const view={cx:4*WU,cy:0,scale:42/WU};
let cursorW={x:0,y:0};
let hover=null;
let issues=[];

function loadPrefs(){try{const s=JSON.parse(localStorage.getItem("forge-remake-prefs")||"{}");Object.assign(opts,s);}catch(e){}}
function savePrefs(){try{localStorage.setItem("forge-remake-prefs",JSON.stringify({snap:opts.snap,grid:opts.grid,showValues:opts.showValues,autoFill:opts.autoFill,uiStyle:opts.uiStyle}));}catch(e){}}
let autosaveTimer=null;
function autosave(){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>{try{localStorage.setItem("forge-remake-doc",serialize());}catch(e){}},400);}

// =============================================================== validation
function validate(){
  const out=[];const lowPolys=[],crossed=[];
  doc.polys.forEach((q,i)=>{
    const lab=`Polygon ${i}`;
    if(q.verts.length>8)out.push({lv:"error",title:`${lab} has ${q.verts.length} corners`,detail:"Marathon allows 8 at most. Split it into smaller pieces.",target:{kind:"poly",items:[q]},fix:{label:"Split",fn:()=>splitPolygon(q)}});
    if(!isConvex(q.verts))out.push({lv:"error",title:`${lab} is concave`,detail:"Every polygon must be convex. Add a line to cut it in two, then fill each half.",target:{kind:"poly",items:[q]}});
    if(q.ceil<q.floor)out.push({lv:"warn",title:`${lab}: ceiling below floor`,detail:`Floor ${fmt(q.floor)}, ceiling ${fmt(q.ceil)}.`,target:{kind:"poly",items:[q]},fix:{label:"Swap",fn:()=>{const t=q.floor;q.floor=q.ceil;q.ceil=t;}}});
    else if(q.ceil-q.floor<0.8*WU&&q.ceil>q.floor&&q.type!==5)lowPolys.push(q);
    for(let k=0;k<q.verts.length;k++){if(!findLine(q.verts[k],q.verts[(k+1)%q.verts.length])){out.push({lv:"warn",title:`${lab} has an edge with no line`,detail:"A line will be added on export.",target:{kind:"poly",items:[q]},fix:{label:"Add line",fn:()=>{for(let j=0;j<q.verts.length;j++){const a=q.verts[j],b=q.verts[(j+1)%q.verts.length];if(!findLine(a,b))doc.lines.push({a,b,solid:false});}}}});break;}}
    if(q.type===10&&q.perm>=0&&!doc.polys[q.perm])out.push({lv:"warn",title:`${lab}: teleporter has no target`,detail:"Set the target polygon number in the inspector.",target:{kind:"poly",items:[q]}});
  });
  // lines shared by more than two polygons, or same side twice
  const sideUse=new Map();
  doc.polys.forEach((q,i)=>{for(let k=0;k<q.verts.length;k++){const a=q.verts[k],b=q.verts[(k+1)%q.verts.length];const key=a.id+">"+b.id;if(sideUse.has(key))out.push({lv:"error",title:`Polygons ${sideUse.get(key)} and ${i} overlap`,detail:"Two polygons claim the same side of a line. Delete one.",target:{kind:"poly",items:[q,doc.polys[sideUse.get(key)]]}});else sideUse.set(key,i);}});
  // crossing lines
  const L=doc.lines;const bb=L.map(l=>[Math.min(l.a.x,l.b.x),Math.max(l.a.x,l.b.x),Math.min(l.a.y,l.b.y),Math.max(l.a.y,l.b.y)]);
  let crossings=0;
  for(let i=0;i<L.length&&crossings<2000;i++)for(let j=i+1;j<L.length;j++){
    const A=bb[i],B=bb[j];if(A[1]<B[0]||B[1]<A[0]||A[3]<B[2]||B[3]<A[2])continue;
    const a=L[i],b=L[j];if(a.a===b.a||a.a===b.b||a.b===b.a||a.b===b.b)continue;
    if(segIntersect(a.a,a.b,b.a,b.b)){crossings++;crossed.push(a,b);}
  }
  if(lowPolys.length)out.push({lv:"warn",title:lowPolys.length===1?`Polygon ${doc.polys.indexOf(lowPolys[0])} is too low to stand in`:`${lowPolys.length} polygons are too low to stand in`,detail:"Under 0.8 WU of headroom. Fine for vents, ledges and closed doors; otherwise raise the ceiling.",target:{kind:"poly",items:lowPolys}});
  if(crossed.length)out.push({lv:"warn",title:crossed.length===2?"Two lines cross":`${crossed.length/2}${crossings>=2000?"+":""} pairs of lines cross`,detail:"Fine if it's deliberate overlapping space (Bungie's maps do this). If not, split or remove one.",target:{kind:"line",items:[...new Set(crossed)]}});
  const orphan=doc.lines.filter(l=>lineOwners(l).length===0);
  if(orphan.length)out.push({lv:"warn",title:`${orphan.length} line${orphan.length>1?"s":""} not part of any polygon`,detail:"Unused lines are left out of the exported map.",target:{kind:"line",items:orphan},fix:{label:"Remove",fn:()=>{doc.lines=doc.lines.filter(l=>!orphan.includes(l));pruneLonePoints();}}});
  const players=doc.objs.filter(o=>o.kind===3);
  if(doc.polys.length&&!players.length&&(doc.info.entry&1))out.push({lv:"error",title:"No player start",detail:"Solo levels need at least one player start.",fix:{label:"Add one",fn:()=>{const c=centroid(doc.polys[0].verts);doc.objs.push({kind:3,sub:0,x:Math.round(c.x),y:Math.round(c.y),z:0,facing:0,flags:0});}}});
  if(doc.polys.length&&(doc.info.entry&4)&&players.length<2)out.push({lv:"warn",title:"Carnage maps want several starts",detail:`This level has ${players.length} player start${players.length===1?"":"s"}; 4 or more spread out works best.`});
  doc.objs.forEach((o,i)=>{if(!polyAtPoint(o))out.push({lv:"error",title:`${KIND_NAME[o.kind]} is outside the map`,detail:"Objects must sit inside a polygon.",target:{kind:"obj",items:[o]},fix:{label:"Delete",fn:()=>{doc.objs=doc.objs.filter(x=>x!==o);}}});});
  if(doc.info.game!=="inf"&&doc.objs.some(o=>o.kind===2&&(o.sub===34||o.sub===35)))out.push({lv:"warn",title:"SMG items only exist in Infinity",detail:`This is a ${GAMES[doc.info.game].short} level; the KKV-7 and its ammo won't appear.`});
  if(!envOptions(doc.info.game).some(o=>o[0]===doc.info.env))out.push({lv:"error",title:`${GAMES[doc.info.game].short} has no ${envName(doc.info.game,doc.info.env)} textures`,detail:"Pick another environment in the Level tab.",fix:{label:"Switch",fn:()=>{doc.info.env=envOptions(doc.info.game)[0][0];patternCache.clear();}}});
  (doc.terms||[]).forEach((t,i)=>{const r=compileTerminal(t.script);if(r.errs.length)out.push({lv:"error",title:`Terminal ${i} has a problem`,detail:r.errs[0],fix:{label:"Edit",fn:()=>setTimeout(()=>openTerminals(i),0)}});
    for(const id of r.picts||[])if(id&&!pictureById(id))out.push({lv:"warn",title:`Terminal ${i} shows picture ${id}, which isn't in the scenario`,detail:"Add it in Pictures (Levels tab), or the game shows nothing there."});});
  for(const [k,sd] of doc.sides){if(!sd.panel)continue;const key=panelKeyOf(sd.panel.type);
    if(key==="terminal"&&sd.panel.perm>=(doc.terms||[]).length)out.push({lv:"warn",title:`A terminal panel uses terminal ${sd.panel.perm}, which doesn't exist`,detail:`This level has ${(doc.terms||[]).length} terminal${(doc.terms||[]).length===1?"":"s"}. Add one in the Level tab.`});
    if(key==="platform"&&sd.panel.perm>=0){const q=doc.polys[sd.panel.perm];if(!q||q.type!==5)out.push({lv:"warn",title:`A platform switch points at polygon ${sd.panel.perm}, which isn't a door or lift`,detail:"Right-click the switch in 3D and set the right polygon number."});}}
  extractionIssues(out);
  if(!doc.polys.length)out.push({lv:"warn",title:"The level is empty",detail:"Draw a room with the Room tool, or use Generate."});
  return out;
}

// =============================================================== Extraction map conventions (MAP_CONVENTIONS.md, draft v0.1)
// Labels are ordinary map annotations (NOTE chunk). Aleph One's Lua reads them with Annotations(),
// and each one knows the polygon it sits in, so the label's anchor point must be inside walkable floor.
const GEN_VERSION="0.2"; // 0.2: textures from curated palettes
const LABELS=[["EXTRACT","Possible extraction point","#2fa860"],["LOOT","Loot cache spot","#d8a020"],["LOOT FAR","High-tier loot spot","#e0702a"],["CHIP","Data chip spot","#2aa8c8"],["SPAWN","Monster wave spawn point","#d8452f"],["NOSPAWN","Keep clear (safe room, drop zone)","#8a8a8a"]];
const LABEL_WORDS=new Set(["EXTRACT","LOOT","CHIP","SPAWN","NOSPAWN"]);
function parseLabel(text){const w=String(text||"").trim().split(/\s+/);return LABEL_WORDS.has(w[0])?{key:w[0],args:w.slice(1)}:null;}
function labelInfo(text){const L=parseLabel(text);if(!L)return null;const name=L.key==="LOOT"&&L.args[0]==="FAR"?"LOOT FAR":L.key;return LABELS.find(l=>l[0]===name);}
function nearLabel(text){const t=String(text||"").trim();return !parseLabel(t)&&LABEL_WORDS.has((t.split(/\s+/)[0]||"").toUpperCase());}
const isGenNote=nt=>/^GEN\s/.test(String(nt.text||"").trim());
const isLabelKey=(nt,key)=>{const L=parseLabel(nt.text);return !!L&&L.key===key;};
function walkable(q){return !!q&&q.type!==5&&!q.media&&q.type!==19&&q.type!==20;}
// Walking graph: neighbouring polygons connect when the shared line isn't solid, the step up is at most 0.3 WU
// and there's 0.75 WU of headroom through the opening. Doors/lifts always connect; teleporters jump to their target.
function walkGraph(){
  const STEP=0.3*WU,HEAD=0.75*WU;const edges=new Map();
  for(const q of doc.polys)for(let k=0;k<q.verts.length;k++){const a=q.verts[k],b=q.verts[(k+1)%q.verts.length];const key=Math.min(a.id,b.id)+"-"+Math.max(a.id,b.id);let e=edges.get(key);if(!e)edges.set(key,e=[]);e.push(q);}
  const solid=new Set(doc.lines.filter(l=>l.solid).map(l=>Math.min(l.a.id,l.b.id)+"-"+Math.max(l.a.id,l.b.id)));
  const adj=new Map(doc.polys.map(q=>[q,[]]));const cen=new Map(doc.polys.map(q=>[q,centroid(q.verts)]));
  const can=(A,B)=>A.type===5||B.type===5||(B.floor-A.floor<=STEP&&Math.min(A.ceil,B.ceil)-Math.max(A.floor,B.floor)>=HEAD);
  for(const [key,ps] of edges){if(ps.length!==2||solid.has(key))continue;const [A,B]=ps;const ca=cen.get(A),cb=cen.get(B),d=hyp(ca.x,ca.y,cb.x,cb.y);
    if(can(A,B))adj.get(A).push([B,d]);if(can(B,A))adj.get(B).push([A,d]);}
  for(const q of doc.polys)if(q.type===10&&doc.polys[q.perm])adj.get(q).push([doc.polys[q.perm],0]);
  return adj;
}
function walkDistances(starts){ // Dijkstra over polygon centroids; Map(poly → walking distance in map units)
  const adj=walkGraph(),dist=new Map(),heap=[];
  const push=(q,d)=>{heap.push([d,q]);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  for(const s of starts)push(s,0);
  while(heap.length){const [d,q]=pop();if(dist.has(q))continue;dist.set(q,d);for(const [n,w] of adj.get(q)||[])if(!dist.has(n))push(n,d+w);}
  return dist;
}
function startPolys(){return [...new Set(doc.objs.filter(o=>o.kind===3).map(o=>polyAtPoint(o)).filter(Boolean))];}
function addCoopStarts(n=4){ // more player starts around the first one, inside the same polygon
  const first=doc.objs.find(o=>o.kind===3);if(!first)return 0;const q=polyAtPoint(first);let added=0;
  const have=()=>doc.objs.filter(o=>o.kind===3).length;
  for(const r of [0.5,0.35,0.75,0.25])for(let a=0;a<8&&have()<n;a++){const ang=a*Math.PI/4;const p={x:Math.round(first.x+Math.cos(ang)*r*WU),y:Math.round(first.y+Math.sin(ang)*r*WU)};
    if(polyAtPoint(p)!==q||doc.objs.some(o=>o.kind===3&&hyp(o.x,o.y,p.x,p.y)<0.3*WU))continue;doc.objs.push({kind:3,sub:0,x:p.x,y:p.y,z:0,facing:first.facing,flags:0});added++;}
  return added;
}
// Place labels the map is missing. Uses walking distance from the player starts so everything placed is reachable.
function autoLabels({full=false,seed=1}={}){
  const R=mulberry(seed);const notes=doc.notes||(doc.notes=[]);
  const starts=startPolys();if(!starts.length)return 0;
  const dist=walkDistances(starts);let far=0;for(const v of dist.values())far=Math.max(far,v);
  const used=new Set(notes.filter(n=>parseLabel(n.text)).map(n=>polyAtPoint(n)));
  const area=q=>Math.abs(signedArea(q.verts))/WU/WU;
  const spots=()=>notes.filter(n=>parseLabel(n.text));
  const crowded=q=>{const c=centroid(q.verts);return spots().some(n=>hyp(n.x,n.y,c.x,c.y)<2.5*WU);}; // keep tags from piling up in split rooms
  const cand=()=>doc.polys.filter(q=>walkable(q)&&dist.has(q)&&!used.has(q)&&!starts.includes(q)&&area(q)>=1&&q.ceil-q.floor>=0.8*WU&&!crowded(q));
  const cen=q=>centroid(q.verts);
  let placed=0;const put=(q,text)=>{const c=cen(q);notes.push({type:0,x:Math.round(c.x),y:Math.round(c.y),text});used.add(q);placed++;};
  const has=key=>notes.some(n=>isLabelKey(n,key));
  // EXTRACT: far from the starts, and spread apart from each other
  const ex=notes.filter(n=>isLabelKey(n,"EXTRACT")).map(n=>polyAtPoint(n)).filter(Boolean);
  while(ex.length<2){const cs=cand().filter(q=>dist.get(q)>=far*0.5);if(!cs.length)break;
    let best=null,bs=-1;for(const q of cs){const c=cen(q);let s=dist.get(q);for(const e of ex){const ce=cen(e);s=Math.min(s,hyp(c.x,c.y,ce.x,ce.y));}if(s>bs){bs=s;best=q;}}
    put(best,"EXTRACT");ex.push(best);}
  if(!full)return placed;
  if(!has("NOSPAWN"))for(const q of starts)if(walkable(q)){const c=cen(q);notes.push({type:0,x:Math.round(c.x),y:Math.round(c.y),text:"NOSPAWN"});used.add(q);placed++;}
  const n=cand().length;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  if(!notes.some(x=>{const L=parseLabel(x.text);return L&&L.key==="LOOT"&&L.args[0]==="FAR";})){const cs=cand().sort((a,b)=>dist.get(b)-dist.get(a)).slice(0,Math.max(2,Math.ceil(n*0.3)));shuffle(cs).slice(0,n>12?2:1).forEach(q=>put(q,"LOOT FAR"));}
  if(!has("CHIP")){const cs=cand().filter(q=>dist.get(q)>=far*0.35);shuffle(cs).slice(0,n>12?2:1).forEach(q=>put(q,"CHIP"));}
  if(!has("SPAWN")){const cs=cand().filter(q=>dist.get(q)>=far*0.3);shuffle(cs).slice(0,Math.max(2,Math.round(n*0.12))).forEach(q=>put(q,"SPAWN"));}
  if(!notes.some(x=>{const L=parseLabel(x.text);return L&&L.key==="LOOT"&&L.args[0]!=="FAR";})){shuffle(cand()).slice(0,Math.max(2,Math.round(n*0.2))).forEach(q=>put(q,"LOOT"));}
  return placed;
}
function setGenNote(seed,size,extra=""){ // "GEN seed=123456 gen=0.1 size=medium", near the top-left of the first start room
  doc.notes=(doc.notes||[]).filter(n=>!isGenNote(n));
  const q=startPolys()[0]||doc.polys[0];if(!q)return;const c=centroid(q.verts);
  const v=q.verts.reduce((a,b)=>a.x+a.y<=b.x+b.y?a:b);
  doc.notes.push({type:0,x:Math.round(v.x+(c.x-v.x)*0.2),y:Math.round(v.y+(c.y-v.y)*0.2),text:`GEN seed=${seed} gen=${GEN_VERSION} size=${size}${extra}`});
}
function extractionIssues(out){
  const notes=doc.notes||[];const labelled=notes.filter(n=>parseLabel(n.text));
  for(const nt of notes)if(nearLabel(nt.text))out.push({lv:"warn",title:`“${nt.text.trim()}” looks like a label but isn't uppercase`,detail:"Extraction only reads UPPERCASE labels.",target:{kind:"note",items:[nt]},fix:{label:"Uppercase",fn:()=>{nt.text=nt.text.trim().toUpperCase();}}});
  const outside=labelled.filter(n=>!polyAtPoint(n)),wet=labelled.filter(n=>{const q=polyAtPoint(n);return q&&!walkable(q);});
  if(outside.length)out.push({lv:"warn",title:`${outside.length} label${outside.length>1?"s are":" is"} outside the map`,detail:"A label must sit inside the polygon it refers to.",target:{kind:"note",items:outside}});
  if(wet.length)out.push({lv:"warn",title:`${wet.length} label${wet.length>1?"s are":" is"} on a door, lift, liquid or damage floor`,detail:"Labels need ordinary walkable floor. Move them onto a normal polygon.",target:{kind:"note",items:wet}});
  if(!(doc.info.extraction||labelled.length)||!doc.polys.length)return;
  const tag=" (Extraction)";
  if(!(doc.info.entry&2))out.push({lv:"warn",title:"Co-op isn't one of the game types"+tag,detail:"Extraction maps need Co-op ticked so they show up for co-op hosting.",fix:{label:"Tick Co-op",fn:()=>{doc.info.entry|=2;}}});
  const players=doc.objs.filter(o=>o.kind===3);
  if(players.length&&players.length<4)out.push({lv:"warn",title:`${players.length} player start${players.length>1?"s":""}; 4 or more is better for co-op`+tag,detail:"Each player in the squad gets their own start.",fix:{label:"Add starts",fn:()=>addCoopStarts(4)}});
  if(!doc.objs.some(o=>o.kind===0))out.push({lv:"warn",title:"No monsters placed"+tag,detail:"Extraction takes its wave monster types from the monsters placed on the map."});
  const starts=startPolys();if(!starts.length)return;
  const dist=walkDistances(starts);let far=0;for(const v of dist.values())far=Math.max(far,v);
  const ex=labelled.filter(n=>isLabelKey(n,"EXTRACT"));
  if(ex.length<2)out.push({lv:"warn",title:(ex.length?"Only one EXTRACT label":"No EXTRACT labels")+tag,detail:"Place at least 2, well away from the player starts. Without any, Extraction falls back to automatic placement.",fix:{label:"Place for me",fn:()=>autoLabels({full:false})}});
  const unreach=labelled.filter(n=>{const q=polyAtPoint(n);return q&&!dist.has(q);});
  if(unreach.length)out.push({lv:"warn",title:`${unreach.length} label${unreach.length>1?"s":""} can't be reached on foot`+tag,detail:"Walking from the player starts: steps up to 0.3 WU and 0.75 WU of headroom; doors, lifts and teleporters count, solid lines block.",target:{kind:"note",items:unreach}});
  const near=Math.min(far*0.6,Math.max(6*WU,far*0.4));
  const close=ex.filter(n=>{const q=polyAtPoint(n),d=q?dist.get(q):undefined;return d!=null&&d<near;});
  if(close.length)out.push({lv:"warn",title:`${close.length===1?"An EXTRACT is":close.length+" EXTRACTs are"} close to the player starts`+tag,detail:`Aim for at least ${(near/WU).toFixed(1)} WU of walking from the starts on this level.`,target:{kind:"note",items:close}});
}

// =============================================================== binary writer
class BW{constructor(){this.buf=new Uint8Array(1024);this.n=0;}
  ensure(k){if(this.n+k>this.buf.length){const b=new Uint8Array(Math.max(this.buf.length*2,this.n+k));b.set(this.buf);this.buf=b;}}
  u8(v){this.ensure(1);this.buf[this.n++]=v&255;}
  i16(v){v=Math.round(v);this.ensure(2);const x=v&0xffff;this.buf[this.n++]=x>>8;this.buf[this.n++]=x&255;}
  i32(v){this.ensure(4);const x=v>>>0;this.buf[this.n++]=x>>>24;this.buf[this.n++]=(x>>>16)&255;this.buf[this.n++]=(x>>>8)&255;this.buf[this.n++]=x&255;}
  zeros(k){this.ensure(k);for(let i=0;i<k;i++)this.buf[this.n++]=0;}
  bytes(b){this.ensure(b.length);this.buf.set(b,this.n);this.n+=b.length;}
  str(s,len){const enc=[...s].map(c=>{const k=c.charCodeAt(0);return k<128?k:63;}).slice(0,len-1);this.bytes(enc);this.zeros(len-enc.length);}
  fixed(v){this.i32(Math.round(v*65536));}
  out(){return this.buf.slice(0,this.n);}}
const CRC_T=(()=>{const t=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?(c>>>1)^0xedb88320:c>>>1;t[i]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=CRC_T[(c^b[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const tag=s=>((s.charCodeAt(0)<<24)|(s.charCodeAt(1)<<16)|(s.charCodeAt(2)<<8)|s.charCodeAt(3))>>>0;

// =============================================================== file formats: text, resource forks, MacBinary, PICT, terminals, physics
const b64enc=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);};
const b64dec=s=>{const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;};
const MACROMAN_HI="ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ";
const MACROMAN_REV=new Map([...MACROMAN_HI].map((c,i)=>[c,128+i]));
function macDecode(u8){let s="";for(const c of u8)s+=c<128?String.fromCharCode(c):MACROMAN_HI[c-128];return s;}
function macEncode(str){const out=[];for(const ch of str){const c=ch.charCodeAt(0);if(c<128)out.push(c);else out.push(MACROMAN_REV.get(ch)??63);}return new Uint8Array(out);}
// ---- Mac resource forks
function parseResourceFork(buf){
  const dv=new DataView(buf);const dOff=dv.getUint32(0),mOff=dv.getUint32(4);
  const tl=mOff+dv.getUint16(mOff+24),nl=mOff+dv.getUint16(mOff+26);const nT=dv.getInt16(tl)+1;const out=[];
  for(let i=0;i<nT&&i<500;i++){const e=tl+2+i*8;const type=macDecode(new Uint8Array(buf,e,4));const cnt=dv.getInt16(e+4)+1,ref=tl+dv.getUint16(e+6);
    for(let j=0;j<cnt;j++){const r=ref+j*12;const id=dv.getInt16(r),noff=dv.getInt16(r+2);const off=dv.getUint32(r+4)&0xffffff;const at=dOff+off;const len=dv.getUint32(at);
      let name="";if(noff!==-1){const n=nl+noff;name=macDecode(new Uint8Array(buf,n+1,dv.getUint8(n)));}
      out.push({type,id,name,data:new Uint8Array(buf.slice(at+4,at+4+len))});}}
  return out;
}
function buildResourceFork(resources){
  const data=new BW();const offs=[];
  for(const r of resources){offs.push(data.n);data.i32(r.data.length);data.bytes(r.data);}
  const dataBytes=data.out();const types=[...new Set(resources.map(r=>r.type))];
  const nRes=resources.length,nT=types.length;const refStart=2+8*nT;const nameListOff=28+refStart+12*nRes;
  const names=new BW();const nameOff=resources.map(r=>{if(!r.name)return -1;const o=names.n;const b=macEncode(r.name).slice(0,255);names.u8(b.length);names.bytes(b);return o;});
  const map=new BW();const dataOff=256,mapOff=256+dataBytes.length,mapLen=nameListOff+names.n;
  map.i32(dataOff);map.i32(mapOff);map.i32(dataBytes.length);map.i32(mapLen);map.zeros(4+2+2);map.i16(28);map.i16(nameListOff);
  map.i16(nT-1);let refPos=refStart;const order=[];
  for(const t of types){const rs=resources.map((r,i)=>[r,i]).filter(([r])=>r.type===t);map.bytes(macEncode(t));map.i16(rs.length-1);map.i16(refPos);refPos+=12*rs.length;order.push(...rs);}
  for(const [r,i] of order){map.i16(r.id);map.i16(nameOff[i]);map.i32(offs[i]&0xffffff);map.i32(0);}
  map.bytes(names.out());
  const out=new BW();out.i32(dataOff);out.i32(mapOff);out.i32(dataBytes.length);out.i32(mapLen);out.zeros(240);out.bytes(dataBytes);out.bytes(map.out());
  return out.out();
}
function macBinary(name,type,creator,dataFork,rsrcFork){
  const h=new Uint8Array(128);const nm=macEncode(name).slice(0,63);h[1]=nm.length;h.set(nm,2);h.set(macEncode(type),65);h.set(macEncode(creator),69);
  const dv=new DataView(h.buffer);dv.setUint32(83,dataFork.length);dv.setUint32(87,rsrcFork?rsrcFork.length:0);
  const t=Math.floor(Date.now()/1000)+2082844800;dv.setUint32(91,t>>>0);dv.setUint32(95,t>>>0);h[122]=129;h[123]=129;dv.setUint16(124,crc16mb(h));
  const pad=n=>Math.ceil(n/128)*128;const out=new Uint8Array(128+pad(dataFork.length)+(rsrcFork?pad(rsrcFork.length):0));
  out.set(h,0);out.set(dataFork,128);if(rsrcFork)out.set(rsrcFork,128+pad(dataFork.length));return out;
}
// ---- PICT pictures (decode QuickDraw PICT v2 as Aleph One does; encode 32-bit PackBits)
function unpackBits(u,p,inLen,n){const out=new Uint8Array(n);let o=0;const end=p+inLen;while(o<n&&p<end){const c=u[p++];if(c<128){for(let k=0;k<=c&&o<n;k++)out[o++]=u[p++];}else if(c>128){const v=u[p++];for(let k=0;k<257-c&&o<n;k++)out[o++]=v;}}return out;}
function unpackWords(u,p,inLen,n){const out=new Uint8Array(n*2);let o=0;const end=p+inLen;while(o<n*2&&p<end){const c=u[p++];if(c<128){for(let k=0;k<=c&&o<n*2;k++){out[o++]=u[p++];out[o++]=u[p++];}}else if(c>128){const a=u[p++],b=u[p++];for(let k=0;k<257-c&&o<n*2;k++){out[o++]=a;out[o++]=b;}}}return out;}
function decodePict(u){
  const dv=new DataView(u.buffer,u.byteOffset,u.byteLength);let p=10;
  if(dv.getUint16(p)===0x0011&&dv.getUint16(p+2)===0x02ff)p+=4;else throw new Error("not a version 2 picture");
  for(let guard=0;guard<10000&&p<u.length-1;guard++){
    if(p&1)p++;const op=dv.getUint16(p);p+=2;
    if(op===0x00ff)break;
    if(op===0x0c00){p+=24;continue;}
    if([0x0000,0x001e,0x001c,0x0038,0x0039,0x003a,0x003b,0x003c,0x02ff].includes(op))continue;
    if(op===0x0001){p+=dv.getUint16(p);continue;}
    if(op===0x00a0){p+=2;continue;}
    if(op===0x00a1){p+=2;p+=2+dv.getUint16(p);continue;}
    if([0x0003,0x0004,0x0005,0x0008,0x000d,0x0015,0x0016,0x0023].includes(op)){p+=2;continue;}
    if([0x0006,0x0007,0x000b,0x000c,0x000e,0x000f,0x0021].includes(op)){p+=4;continue;}
    if([0x001a,0x001b,0x001d,0x001f,0x0022].includes(op)){p+=6;continue;}
    if([0x0002,0x0009,0x000a,0x0010,0x0020,0x0030,0x0031,0x0032,0x0033,0x0034].includes(op)){p+=8;continue;}
    if(op===0x8200){const size=dv.getUint32(p);const start=p+4;for(let k=start;k<start+size-1;k++){if(u[k]===0xff&&u[k+1]===0xd8)return {jpeg:u.slice(k,start+size)};}throw new Error("no JPEG data");}
    if(op===0x0098||op===0x0099||op===0x009a||op===0x009b){
      if(op>=0x009a)p+=4;
      let rb=dv.getUint16(p);const isPix=!!(rb&0x8000);rb&=0x3fff;const top=dv.getInt16(p+2),left=dv.getInt16(p+4),h=dv.getInt16(p+6)-top,w=dv.getInt16(p+8)-left;p+=10;
      let packType=0,pix=1;let clut=null;
      let cmpCount=3;if(isPix){packType=dv.getUint16(p+2);pix=dv.getUint16(p+18);cmpCount=dv.getUint16(p+20);p+=36;}
      if(isPix&&(op===0x0098||op===0x0099)){const flags=dv.getUint16(p+4);const n=dv.getUint16(p+6)+1;p+=8;clut=new Uint8Array(256*3);
        for(let i=0;i<n;i++){let v=dv.getUint16(p)&255;if(flags&0x8000)v=i;clut[v*3]=u[p+2];clut[v*3+1]=u[p+4];clut[v*3+2]=u[p+6];p+=8;}}
      else if(!isPix){clut=new Uint8Array(256*3).fill(0);clut.set([255,255,255],0);}
      p+=18;
      if(op===0x0099||op===0x009b)p+=dv.getUint16(p);
      const rgba=new Uint8ClampedArray(w*h*4);
      if((pix===16||pix===32)&&packType===0)packType=pix===16?3:4;
      for(let y=0;y<h;y++){
        let row;
        if(rb<8){row=u.subarray(p,p+rb);p+=rb;}
        else if(packType===1){row=u.subarray(p,p+rb);p+=rb;}
        else{let n;if(rb>250){n=dv.getUint16(p);p+=2;}else{n=u[p];p+=1;}
          if(pix===16)row=unpackWords(u,p,n,w);else row=unpackBits(u,p,n,rb);p+=n;}
        for(let x=0;x<w;x++){const o=(y*w+x)*4;let r=0,g=0,b=0;
          if(pix<=8){const per=8/pix;const byte=row[Math.floor(x/per)];const idx=(byte>>((per-1-x%per)*pix))&((1<<pix)-1);r=clut[idx*3];g=clut[idx*3+1];b=clut[idx*3+2];}
          else if(pix===16){const v=(row[2*x]<<8)|row[2*x+1];r=(v>>10&31)*255/31;g=(v>>5&31)*255/31;b=(v&31)*255/31;}
          else{if(packType===4){const c=cmpCount===4?1:0;r=row[(c)*w+x];g=row[(c+1)*w+x];b=row[(c+2)*w+x];}else{r=row[4*x+1];g=row[4*x+2];b=row[4*x+3];}}
          rgba[o]=r;rgba[o+1]=g;rgba[o+2]=b;rgba[o+3]=255;}
      }
      return {w,h,rgba};
    }
    throw new Error("unsupported picture opcode "+op.toString(16));
  }
  throw new Error("picture has no image");
}
const pictCanvasCache=new Map();
async function pictToCanvas(pic){ // pic: {id, data(Uint8Array)}
  const key=pic.data;if(pictCanvasCache.has(key))return pictCanvasCache.get(key);
  let cv=null;
  try{const d=decodePict(pic.data);cv=document.createElement("canvas");
    if(d.jpeg){const bmp=await createImageBitmap(new Blob([d.jpeg],{type:"image/jpeg"}));cv.width=bmp.width;cv.height=bmp.height;cv.getContext("2d").drawImage(bmp,0,0);}
    else{cv.width=d.w;cv.height=d.h;cv.getContext("2d").putImageData(new ImageData(d.rgba,d.w,d.h),0,0);}}
  catch(e){cv=null;}
  pictCanvasCache.set(key,cv);return cv;
}
function packBits(row){const out=[];let i=0;const n=row.length;
  while(i<n){let j=i;while(j<n-1&&j-i<127&&row[j]===row[j+1])j++;
    if(j>i){out.push(257-(j-i+1),row[i]);i=j+1;continue;}
    let k=i;const lit=[];while(k<n&&lit.length<128&&!(k<n-2&&row[k]===row[k+1]&&row[k]===row[k+2])){lit.push(row[k]);k++;}
    if(!lit.length){lit.push(row[k]);k++;}
    out.push(lit.length-1,...lit);i=k;}
  return out;}
function encodePict(imageData){
  const {width:w,height:h,data}=imageData;const rb=w*4;const body=new BW();
  body.i16(0);body.i16(0);body.i16(0);body.i16(h);body.i16(w); // picSize placeholder + frame
  body.i16(0x0011);body.i16(0x02ff);
  body.i16(0x0c00);body.i16(-2);body.i16(0);body.i32(0x00480000);body.i32(0x00480000);body.i16(0);body.i16(0);body.i16(h);body.i16(w);body.i32(0);
  body.i16(0x001e);
  body.i16(0x0001);body.i16(10);body.i16(0);body.i16(0);body.i16(h);body.i16(w);
  body.i16(0x009a);body.i32(0xff);body.i16(0x8000|rb);body.i16(0);body.i16(0);body.i16(h);body.i16(w);
  body.i16(0);body.i16(4);body.i32(0);body.i32(0x00480000);body.i32(0x00480000);body.i16(16);body.i16(32);body.i16(3);body.i16(8);body.i32(0);body.i32(0);body.i32(0);
  body.i16(0);body.i16(0);body.i16(h);body.i16(w);body.i16(0);body.i16(0);body.i16(h);body.i16(w);body.i16(0);
  const comp=new Uint8Array(w*3);let start=body.n;
  for(let y=0;y<h;y++){for(let x=0;x<w;x++){const o=(y*w+x)*4;comp[x]=data[o];comp[w+x]=data[o+1];comp[2*w+x]=data[o+2];}
    const pk=packBits(comp);if(rb>250)body.i16(pk.length);else body.u8(pk.length);body.bytes(new Uint8Array(pk));}
  if((body.n-start)&1)body.u8(0);
  body.i16(0x00ff);const out=body.out();out[0]=(out.length>>8)&255;out[1]=out.length&255;return out;
}
// ---- Terminals (Marathon 2/Infinity terminal text, compiled the way Bungie's tools did)
const TERM_GROUPS=["LOGON","UNFINISHED","SUCCESS","FAILURE","INFORMATION","END","INTERLEVEL TELEPORT","INTRALEVEL TELEPORT","CHECKPOINT","SOUND","MOVIE","TRACK","PICT","LOGOFF","CAMERA","STATIC","TAG"];
const TERM_HAS_NUM=new Set([0,6,7,8,9,10,11,12,13,14,15,16]);
function parseTerminalChunk(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);const out=[];let p=0;
  while(p+10<=u8.length){const tot=dv.getUint16(p),flags=dv.getUint16(p+2),lpp=dv.getInt16(p+4),gc=dv.getUint16(p+6),fc=dv.getUint16(p+8);if(!tot)break;
    let q=p+10;const groups=[];for(let i=0;i<gc;i++){groups.push({flags:dv.getInt16(q),type:dv.getInt16(q+2),perm:dv.getInt16(q+4),start:dv.getInt16(q+6),length:dv.getInt16(q+8)});q+=12;}
    const fonts=[];for(let i=0;i<fc;i++){fonts.push({index:dv.getInt16(q),face:dv.getInt16(q+2),color:dv.getInt16(q+4)});q+=6;}
    const text=u8.slice(q,p+tot);
    if(flags&1){let i=0;const n=text.length;for(let k=0;k<Math.floor(n/4);k++){text[i+2]^=0xfe;text[i+3]^=0xed;i+=4;}for(let k=0;k<n%4;k++){text[i]^=0xfe;i++;}}
    out.push({script:decompileTerminal(groups,fonts,text)});p+=tot;}
  return out;
}
function decompileTerminal(groups,fonts,text){
  const lines=[];
  for(const g of groups){
    let head="#"+(TERM_GROUPS[g.type]||"INFORMATION");if(TERM_HAS_NUM.has(g.type))head+=" "+g.perm;
    if((g.type===12||g.type===8)&&(g.flags&1))head+=" RIGHT";if((g.type===12||g.type===8)&&(g.flags&2))head+=" CENTER";
    lines.push(head);
    if(g.length>0){let s="";let face=0,color=0;const fs=fonts.filter(f=>f.index>=g.start&&f.index<g.start+g.length);let fi=0;
      for(let i=g.start;i<g.start+g.length&&i<text.length;i++){
        while(fi<fs.length&&fs[fi].index<=i){const f=fs[fi++];
          for(const [bit,on,off] of [[1,"$B","$b"],[2,"$I","$i"],[4,"$U","$u"]])if((f.face&bit)!==(face&bit))s+=(f.face&bit)?on:off;
          if(f.color!==color)s+="$C"+f.color;face=f.face;color=f.color;}
        const c=text[i];if(c===0)continue;s+=c===13?"\n":macDecode([c]);}
      s=s.replace(/\n$/,"");if(s.length)lines.push(...s.split("\n").map(l=>l.startsWith("#")||l.startsWith(";")?" "+l:l));}
  }
  return lines.join("\n");
}
function wrapCount(str,cpl){let n=0;for(const para of str.split("\r")){n++;let cur=0;for(const w of para.split(" ")){if(cur&&cur+1+w.length>cpl){n++;cur=w.length;}else cur+=(cur?1:0)+w.length;}}return n;}
function compileTerminal(script){
  const groups=[],fonts=[],out=[];let cur=null;const errs=[];
  const lines=String(script||"").replace(/\r\n?/g,"\n").split("\n");
  const finish=()=>{if(!cur)return;cur.length=out.length-cur.start;out.push(0);groups.push(cur);cur=null;};
  lines.forEach((line,ln)=>{
    if(line.startsWith(";"))return;
    if(line.startsWith("#")){finish();const m=line.slice(1).trim().toUpperCase().replace(/\s+/g," ");
      let type=TERM_GROUPS.findIndex(n=>m===n||m.startsWith(n+" "));
      if(type<0){errs.push(`Line ${ln+1}: unknown command "${line.trim()}".`);type=4;}
      const rest=m.slice(TERM_GROUPS[type].length).trim().split(" ");let perm=0,flags=0;
      if(TERM_HAS_NUM.has(type)){perm=parseInt(rest[0]);if(!Number.isFinite(perm)){errs.push(`Line ${ln+1}: #${TERM_GROUPS[type]} needs a number.`);perm=0;}}
      if(rest.includes("RIGHT"))flags|=1;if(rest.includes("CENTER"))flags|=2;
      cur={flags,type,perm,start:out.length,face:0,color:0};
      if(fonts.length&&(fonts[fonts.length-1].face||fonts[fonts.length-1].color))fonts.push({index:out.length,face:0,color:0});
      return;}
    if(!cur){cur={flags:0,type:4,perm:0,start:out.length,face:0,color:0};}
    let i=0;const s=line.replace(/^ (?=[#;])/,"");
    while(i<s.length){const ch=s[i];
      if(ch==="$"&&i+1<s.length){const c=s[i+1];let used=2;let f=cur.face,col=cur.color;
        if(c==="B")f|=1;else if(c==="b")f&=~1;else if(c==="I")f|=2;else if(c==="i")f&=~2;else if(c==="U")f|=4;else if(c==="u")f&=~4;
        else if(c==="C"&&/[0-7]/.test(s[i+2]||"")){col=+s[i+2];used=3;}else used=0;
        if(used){cur.face=f;cur.color=col;const last=fonts[fonts.length-1];if(last&&last.index===out.length){last.face=f;last.color=col;}else fonts.push({index:out.length,face:f,color:col});i+=used;continue;}}
      out.push(...macEncode(ch));i++;}
    out.push(13);
  });
  finish();
  if(!groups.length)return {bytes:null,errs:errs.concat(["The terminal is empty."]),groups:0};
  const text=new Uint8Array(out);
  const maxLines=g=>{if([0,13,6,7,9,16,10,11,14,15,5].includes(g.type))return 1;if([1,2,3].includes(g.type))return 0;
    const str=macDecode(text.subarray(g.start,g.start+g.length));return wrapCount(str.replace(/\r$/,""),g.type===4?90:48);};
  const w=new BW();const tot=10+groups.length*12+fonts.length*6+text.length;
  w.i16(tot);w.i16(0);w.i16(22);w.i16(groups.length);w.i16(fonts.length);
  for(const g of groups){w.i16(g.flags);w.i16(g.type);w.i16(g.perm);w.i16(g.start);w.i16(g.length);w.i16(maxLines(g));}
  for(const f of fonts){w.i16(f.index);w.i16(f.face);w.i16(f.color);}
  w.bytes(text);
  return {bytes:w.out(),errs,groups:groups.length,picts:groups.filter(g=>g.type===12||g.type===0||g.type===13).map(g=>g.perm)};
}
const PHYSICS_TAGS=["MNpx","FXpx","PRpx","PXpx","WPpx"];

// =============================================================== export to Aleph One (.sceA)
const lightIndex=pct=>clamp(Math.round((100-pct)/5),0,20);
const PLAT_DEFAULT=()=>({type:0,speed:34,delay:120,min:-1,max:-1,flags:(1<<1)|(1<<3)|(1<<5)|(1<<7)|(1<<13)|(1<<14)|(1<<15)|(1<<26),tag:0});
function buildMapChunks(d=doc){
  const polys=d.polys, env=ENVS[d.info.env]||ENVS[0];
  const shape=(b,col,clut)=>(((clut|0)&7)<<13)|(((col??env.col)&31)<<8)|(clamp(b|0,0,255));
  const lightBase=d.lights?d.lights.length:0;
  let needStd=!d.lights;
  const lidx=(pct,li)=>{if(li!=null&&li<lightBase)return li;needStd=true;return lightBase+lightIndex(pct);};
  const pts=[],pIdx=new Map();
  for(const q of polys)for(const v of q.verts)if(!pIdx.has(v)){pIdx.set(v,pts.length);pts.push(v);}
  const lmap=new Map();for(const l of d.lines)lmap.set(Math.min(l.a.id,l.b.id)+"-"+Math.max(l.a.id,l.b.id),l);
  const L=[],lIdx=new Map();
  function lineFor(a,b){const k=Math.min(a.id,b.id)+"-"+Math.max(a.id,b.id);let l=lmap.get(k);if(!l){l={a,b,solid:false};lmap.set(k,l);}
    if(!lIdx.has(l)){lIdx.set(l,L.length);L.push({l,cw:-1,ccw:-1,cws:-1,ccws:-1});}return L[lIdx.get(l)];}
  const polyEdges=polys.map((q,i)=>q.verts.map((v,k)=>{const w=q.verts[(k+1)%q.verts.length];const e=lineFor(v,w);if(e.l.a===v)e.cw=i;else e.ccw=i;return e;}));
  // sides, following Forge/Weland "pave" rules; sides with a transparent texture or a control panel are always kept
  const sides=[];
  const PI=platformInfo(d);
  const effP=q=>q.type===5&&PI.get(q)?{floor:PI.get(q).minF,ceil:PI.get(q).maxC}:q, effO=q=>q.type===5&&PI.get(q)?{floor:PI.get(q).maxF,ceil:PI.get(q).minC}:q;
  function sideType(p,o){if(!o)return 0;p=effP(p);o=effO(o);if(o.floor>=p.ceil||o.ceil<=p.floor)return 0;const lo=o.floor>p.floor,hi=o.ceil<p.ceil;return lo&&hi?4:hi?1:lo?2:0;}
  function newSide(pi,e,o,s){const p=polys[pi];const t=sideType(p,o);
    const def={b:p.wtex,ox:0,oy:0};const visible=!o||t!==0||o.floor>=p.ceil||o.ceil<=p.floor;
    const prim=!visible?null:t===0?(s.full||s.upper||s.lower||def):t===2?(s.lower||s.full||def):(s.upper||s.full||def);
    const sec=t===4?(s.lower||s.full||def):null;const tr=s.trans||null;
    const lt=x=>x?lidx(x.light??p.light,x.li):lidx(p.light,p.fli);const pn=s.panel;
    sides.push({t,poly:pi,line:lIdx.get(e.l),tex:prim?shape(prim.b,prim.col,prim.clut):0xffff,x:prim?prim.ox|0:0,y:prim?prim.oy|0:0,xf:prim?prim.xfer|0:0,
      tex2:sec?shape(sec.b,sec.col,sec.clut):0xffff,x2:sec?sec.ox|0:0,y2:sec?sec.oy|0:0,xf2:sec?sec.xfer|0:0,
      tex3:tr?shape(tr.b,tr.col,tr.clut):0xffff,x3:tr?tr.ox|0:0,y3:tr?tr.oy|0:0,xf3:tr?tr.xfer|0:0,
      light:lt(prim),light2:lt(sec||prim),light3:lt(tr||prim),
      flags:pn?(0x02|(pn.flags&0x7d)):0,cpType:pn?pn.type:0,cpPerm:pn?pn.perm|0:0});return sides.length-1;}
  L.forEach(e=>{const A=polys[e.cw],B=polys[e.ccw];
    const sa=d.sides.get(sideKey(e.l.a,e.l.b))||{},sb=d.sides.get(sideKey(e.l.b,e.l.a))||{};
    if(A&&(!B||A.floor<B.floor||A.ceil>B.ceil||A.type===5||B.type===5||sa.trans||sa.panel))e.cws=newSide(e.cw,e,B,sa);
    if(B&&(!A||B.floor<A.floor||B.ceil>A.ceil||A.type===5||B.type===5||sb.trans||sb.panel))e.ccws=newSide(e.ccw,e,A,sb);});
  const chunks=[];
  let w=new BW();for(const p of pts){w.i16(clamp(p.x,-32768,32767));w.i16(clamp(p.y,-32768,32767));}chunks.push(["PNTS",w.out()]);
  w=new BW();
  for(const e of L){const A=polys[e.cw],B=polys[e.ccw];
    let flags;
    if(!A||!B)flags=0x4000;
    else if(e.l.solid)flags=0x4000|0x2000;
    else if(A.type!==5&&B.type!==5&&Math.min(A.ceil,B.ceil)<=Math.max(A.floor,B.floor))flags=0x4000;
    else flags=0x2000;
    const hf=A&&B?Math.max(A.floor,B.floor):(A||B).floor, lc=A&&B?Math.min(A.ceil,B.ceil):(A||B).ceil;
    w.i16(pIdx.get(e.l.a));w.i16(pIdx.get(e.l.b));w.i16(flags);w.i16(Math.min(32767,Math.round(hyp(e.l.a.x,e.l.a.y,e.l.b.x,e.l.b.y))));
    w.i16(hf);w.i16(lc);w.i16(e.cws);w.i16(e.ccws);w.i16(e.cw);w.i16(e.ccw);w.zeros(12);}
  chunks.push(["LINS",w.out()]);
  w=new BW();
  for(const s of sides){w.i16(s.t);w.i16(s.flags);w.i16(s.x);w.i16(s.y);w.i16(s.tex);w.i16(s.x2);w.i16(s.y2);w.i16(s.tex2);w.i16(s.x3);w.i16(s.y3);w.i16(s.tex3);
    w.zeros(16);w.i16(s.cpType);w.i16(s.cpPerm);w.i16(s.xf);w.i16(s.xf2);w.i16(s.xf3);w.i16(s.poly);w.i16(s.line);w.i16(s.light);w.i16(s.light2);w.i16(s.light3);w.i32(0);w.zeros(2);}
  chunks.push(["SIDS",w.out()]);
  // liquids: identical settings share one media record, as Bungie's maps do
  const media=[],mediaKey=new Map();
  const mediaOf=q=>{if(!q.media)return -1;const m=q.media;const k=JSON.stringify([m.type,m.low,m.high,m.dir,m.speed,m.flags,m.li]);if(!mediaKey.has(k)){mediaKey.set(k,media.length);media.push(m);}return mediaKey.get(k);};
  const plats=[];
  w=new BW();
  polys.forEach((q,i)=>{const n=q.verts.length,edges=polyEdges[i];
    let perm=q.type===5?plats.length:[0,1,2,3,11,12,13,14,15,16,17,19,20,21,22,23].includes(q.type)?(q.perm??-1):(q.perm|0);
    if(q.type===5)plats.push({...PLAT_DEFAULT(),...(q.plat||{}),poly:i});
    const mi=mediaOf(q);
    w.i16(q.type);w.i16(0);w.i16(perm);w.i16(n);
    for(let k=0;k<8;k++)w.i16(k<n?pIdx.get(q.verts[k]):-1);
    for(let k=0;k<8;k++)w.i16(k<n?lIdx.get(edges[k].l):-1);
    w.i16(shape(q.ftex,q.fcol,q.fclut));w.i16(shape(q.ctex,q.ccol,q.cclut));w.i16(q.floor);w.i16(q.ceil);w.i16(lidx(q.flight??q.light,q.fli));w.i16(lidx(q.clight??q.light,q.cli));
    w.i32(0);w.i16(-1);w.i16(-1);w.i16(-1);w.i16(-1);w.i16(q.fxfer|0);w.i16(q.cxfer|0);
    for(let k=0;k<8;k++){if(k>=n){w.i16(-1);continue;}const e=edges[k];w.i16(e.cw===i?e.ccw:e.cw);}
    w.i16(-1);w.i16(-1);const c=centroid(q.verts);w.i16(c.x);w.i16(c.y);
    for(let k=0;k<8;k++){if(k>=n){w.i16(-1);continue;}const e=edges[k];w.i16(e.cw===i?e.cws:e.ccws);}
    w.i16(q.fox|0);w.i16(q.foy|0);w.i16(q.cox|0);w.i16(q.coy|0);
    w.i16(mi);w.i16(mi>=0?(q.media.mli!=null&&q.media.mli<lightBase?q.media.mli:lidx(q.flight??q.light,q.fli)):0);
    w.i16(-1);w.i16(q.amb??-1);w.i16(q.rnd??-1);w.zeros(2);});
  chunks.push(["POLY",w.out()]);
  // lights: the imported map's own table (switches, strobes and tides keep working) + Forge's 21-step table
  w=new BW();
  if(media.some(m=>!(m.li!=null&&m.li<lightBase)))needStd=true;
  if(d.lights)for(const raw of d.lights)w.bytes(b64dec(raw));
  if(needStd)for(let i=0;i<=20;i++){const I=(20-i)/20;w.i16(0);w.i16(3);w.i16(0);for(let f=0;f<6;f++){w.i16(0);w.i16(30);w.i16(0);w.fixed(I);w.fixed(0);}w.i16(0);w.zeros(8);}
  chunks.push(["LITE",w.out()]);
  w=new BW();for(const nt of d.notes||[]){const q=polyAtPointIn(d,nt);w.i16(nt.type|0);w.i16(nt.x);w.i16(nt.y);w.i16(q?polys.indexOf(q):-1);w.str(nt.text||"",64);}
  chunks.push(["NOTE",w.out()]);
  w=new BW();let dropped=0;
  for(const o of d.objs){const q=polyAtPointIn(d,o);if(!q){dropped++;continue;}
    const facing=o.kind===5?(o.sub2|0):Math.round((((o.facing%360)+360)%360)*512/360)%512;
    w.i16(o.kind);w.i16(o.sub|0);w.i16(facing);w.i16(polys.indexOf(q));w.i16(o.x);w.i16(o.y);w.i16(o.z|0);w.i16(o.flags|0);}
  chunks.push(["OBJS",w.out()]);
  w=new BW();w.i16(d.info.env);w.i16(0);w.i16(d.info.landscape);w.i16(d.info.mission);w.i16(d.info.envFlags);w.zeros(8);w.str(d.info.name||"Untitled Level",66);w.i32(d.info.entry||1);
  chunks.push(["Minf",w.out()]);
  // plac: spawn table. Aleph One only drops placed items/monsters up to each type's initial count,
  // so (like Forge) the initial count is the number placed; other settings are kept from imported maps.
  w=new BW();const cnt={0:new Array(64).fill(0),2:new Array(64).fill(0)};
  for(const o of d.objs)if((o.kind===0||o.kind===2)&&o.sub>=0&&o.sub<64&&polyAtPointIn(d,o))cnt[o.kind][o.sub]++;
  const pl=d.placement||{};
  for(const [kind,key] of [[2,"items"],[0,"monsters"]])for(let i=0;i<64;i++){const r=(pl[key]&&pl[key][i])||[0,0,0,0,0,0];
    w.i16(r[0]);w.i16(Math.max(cnt[kind][i],(r[0]&1)?r[1]:0));w.i16(r[2]);w.i16(r[3]);w.i16(r[4]);w.i16(r[5]);}
  chunks.push(["plac",w.out()]);
  w=new BW();for(const pf of plats){w.i16(pf.type);w.i16(pf.speed);w.i16(pf.delay);w.i16(pf.max);w.i16(pf.min);w.i32(pf.flags>>>0);w.i16(pf.poly);w.i16(pf.tag|0);w.zeros(14);}
  chunks.push(["plat",w.out()]);
  w=new BW();for(const m of media){w.i16(m.type|0);w.i16(m.flags|0);w.i16(m.li!=null&&m.li<lightBase?m.li:lightBase);w.i16(Math.round(((m.dir||0)%360+360)%360*512/360)%512);w.i16(m.speed|0);w.i16(m.low);w.i16(m.high);w.zeros(6);w.fixed(m.minLight||0);w.i16(0);w.i16(0);w.zeros(4);}
  chunks.push(["medi",w.out()]);
  chunks.push(["ambi",d.ambi?b64dec(d.ambi):new Uint8Array(0)]);
  chunks.push(["bonk",d.bonk?b64dec(d.bonk):new Uint8Array(0)]);
  const termErrs=[];
  if(d.terms&&d.terms.length){const parts=[];d.terms.forEach((t,i)=>{const r=compileTerminal(t.script);if(r.errs.length)termErrs.push(`Terminal ${i}: ${r.errs[0]}`);if(r.bytes)parts.push(r.bytes);});
    const tot=parts.reduce((n,b)=>n+b.length,0);const u=new Uint8Array(tot);let o=0;for(const b of parts){u.set(b,o);o+=b.length;}chunks.push(["term",u]);}
  const phys=physicsChunksFor(d);for(const t of PHYSICS_TAGS)if(phys[t])chunks.push([t,phys[t]]);
  return {chunks,stats:{points:pts.length,lines:L.length,sides:sides.length,polys:polys.length,objects:d.objs.length-dropped,dropped,platforms:plats.length,liquids:media.length,terminals:(d.terms||[]).length,physics:!!phys.MNpx,termErrs}};
}
// Platform travel limits, computed the way Aleph One does (calculate_platform_extrema)
function platformInfo(d=doc){
  const out=new Map();const owner=new Map();d.polys.forEach(q=>q.verts.forEach((v,k)=>owner.set(sideKey(v,q.verts[(k+1)%q.verts.length]),q)));
  for(const q of d.polys){if(q.type!==5)continue;const pf={...PLAT_DEFAULT(),...(q.plat||{})};const F=pf.flags>>>0,has=b=>!!(F&(1<<b));
    let loF=q.floor,hiF=q.floor,loC=q.ceil,hiC=q.ceil;
    q.verts.forEach((v,k)=>{const o=owner.get(sideKey(q.verts[(k+1)%q.verts.length],v));if(o){loF=Math.min(loF,o.floor);hiF=Math.max(hiF,o.floor);loC=Math.min(loC,o.ceil);hiC=Math.max(hiC,o.ceil);}});
    if(has(5)){if(q.ceil>hiF)hiF=q.ceil;if(q.floor<loC)loC=q.floor;}
    const lo=pf.min,hi=pf.max;let r;
    if(has(6)&&has(7)){const minF=lo===-1?loF:lo,maxC=hi===-1?hiC:hi;const mid=Math.round((minF+maxC)/2);r={minF,maxC,maxF:mid,minC:mid};}
    else if(has(6)){if(has(17)){if(q.floor<loF||has(5))loF=q.floor;else hiF=q.floor;}r={minF:lo===-1?loF:lo,maxF:hi===-1?hiF:hi,minC:q.ceil,maxC:q.ceil};}
    else if(has(7)){if(has(17)){if(q.ceil>hiC||has(5))hiC=q.ceil;else loC=q.ceil;}r={minC:lo===-1?loC:lo,maxC:hi===-1?hiC:hi,minF:q.floor,maxF:q.floor};}
    else r={minF:q.floor,maxF:q.floor,minC:q.ceil,maxC:q.ceil};
    const ext=has(1);r.floor=has(6)?(ext?r.maxF:r.minF):q.floor;r.ceil=has(7)?(ext?r.minC:r.maxC):q.ceil;
    out.set(q,r);}
  return out;
}
function polyAtPointIn(d,p){for(let i=d.polys.length-1;i>=0;i--)if(pointInPoly(p,d.polys[i].verts))return d.polys[i];return null;}
function physicsChunksFor(d){
  const ph=d.physics||{mode:"none"};const out={};
  if(ph.mode==="keep"&&ph.keep)for(const t of PHYSICS_TAGS)if(ph.keep[t])out[t]=b64dec(ph.keep[t]);
  if(ph.mode==="lib"&&typeof scenario!=="undefined"){const lib=(scenario.physicsLib||[]).find(x=>x.name===ph.lib);if(lib)for(const t of PHYSICS_TAGS)if(lib.chunks[t])out[t]=b64dec(lib.chunks[t]);}
  return out;
}
function buildWadFile(chunks,name,dataVersion=1){
  const entry=new BW();let off=0;
  chunks.forEach(([t,data],i)=>{entry.i32(tag(t));const last=i===chunks.length-1;entry.i32(last?0:off+16+data.length);entry.i32(data.length);entry.i32(0);entry.bytes(data);off+=16+data.length;});
  const body=entry.out();
  const w=new BW();
  w.i16(2);w.i16(dataVersion);w.str(name,64);w.i32(0);w.i32(128+body.length);w.i16(1);w.i16(0);w.i16(16);w.i16(10);w.i32(0);w.zeros(40);
  w.bytes(body);w.i32(128);w.i32(body.length);w.i16(0);
  const file=w.out();const c=crc32(file);file[68]=c>>>24;file[69]=(c>>>16)&255;file[70]=(c>>>8)&255;file[71]=c&255;
  return file;
}
function zipFiles(files){ // stored (uncompressed) zip
  const parts=[],central=[];let off=0;
  const le16=v=>[v&255,(v>>8)&255],le32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  for(const f of files){const name=new TextEncoder().encode(f.name),c=crc32(f.data);
    const hdr=new Uint8Array([...le32(0x04034b50),...le16(20),...le16(0),...le16(0),...le16(0),...le16(0x21),...le32(c),...le32(f.data.length),...le32(f.data.length),...le16(name.length),...le16(0)]);
    parts.push(hdr,name,f.data);
    central.push(new Uint8Array([...le32(0x02014b50),...le16(20),...le16(20),...le16(0),...le16(0),...le16(0),...le16(0x21),...le32(c),...le32(f.data.length),...le32(f.data.length),...le16(name.length),...le16(0),...le16(0),...le16(0),...le16(0),...le32(0),...le32(off)]),name);
    off+=hdr.length+name.length+f.data.length;}
  const cd=central.reduce((s,b)=>s+b.length,0);
  const end=new Uint8Array([...le32(0x06054b50),...le16(0),...le16(0),...le16(files.length),...le16(files.length),...le32(cd),...le32(off),...le16(0)]);
  const all=[...parts,...central,end];const out=new Uint8Array(all.reduce((s,b)=>s+b.length,0));let p=0;for(const b of all){out.set(b,p);p+=b.length;}
  return out;
}
const safeName=s=>(s||"Untitled Level").replace(/[^A-Za-z0-9 _'-]+/g,"").trim().slice(0,40)||"Untitled Level";

// =============================================================== import Marathon map files
function parseWad(buf){
  let u=new Uint8Array(buf),dv=new DataView(buf);
  let base=0,rsrc=null;
  if(u.length>128&&u[0]===0&&u[1]>0&&u[1]<64&&u[74]===0&&u[82]===0){const dlen=dv.getUint32(83),rlen=dv.getUint32(87);
    if(dlen>0&&128+dlen<=u.length){base=128;if(rlen){const rs=128+Math.ceil(dlen/128)*128;if(rs+rlen<=u.length)rsrc=buf.slice(rs,rs+rlen);}}} // MacBinary
  else{const m=dv.getUint32(0);if(m===0x00051600){const un=unwrapMacFile(buf);if(un.data){rsrc=un.rsrc;buf=un.data;u=new Uint8Array(buf);dv=new DataView(buf);}}}
  const ver=dv.getInt16(base),dataVer=dv.getInt16(base+2);
  const dirOff=dv.getInt32(base+72),count=dv.getInt16(base+76),appSize=dv.getInt16(base+78),entryHdr=dv.getInt16(base+80),dirBase=dv.getInt16(base+82);
  if(ver<2||entryHdr!==16||dirBase!==10||dataVer<1)throw new Error(dataVer===0||ver<2?"This looks like an original Marathon 1 map file, which can't be opened yet. Marathon 1 maps saved in the Durandal/Infinity format open fine.":"This isn't a Marathon map file.");
  const levels=[];
  for(let i=0;i<count;i++){const at=base+dirOff+i*(10+appSize);const off=dv.getInt32(at),idx=dv.getInt16(at+8);
    const chunks={};let pos=base+off,guard=0;
    while(guard++<200){const t=macDecode(u.subarray(pos,pos+4));const next=dv.getInt32(pos+4),len=dv.getInt32(pos+8);
      chunks[t]=new DataView(buf,pos+16,len);if(next<=0)break;pos=base+off+next;}
    let name=`Level ${idx}`;if(chunks.Minf){const b=new Uint8Array(chunks.Minf.buffer,chunks.Minf.byteOffset+18,66);const z=b.indexOf(0);const s=macDecode(b.subarray(0,z<0?66:z));if(s)name=s;}
    levels.push({index:idx,name,chunks,dataVer});}
  levels.sort((a,b)=>a.index-b.index);
  const pictures=[],extraRes=[];if(rsrc){try{for(const r of parseResourceFork(rsrc)){if(r.type==="PICT")pictures.push({id:r.id,name:r.name,data:r.data});else if(r.type==="clut")extraRes.push(r);}}catch(e){}}
  return {levels,dataVer,pictures,extraRes,name:macDecode(u.subarray(base+4,base+68)).replace(/\0.*$/,"")};
}
const bytesOf=dv=>new Uint8Array(dv.buffer,dv.byteOffset,dv.byteLength).slice();
function levelToDoc(lv){
  const c=lv.chunks,notes=[];
  let env=0,envFlags=0;if(c.Minf&&c.Minf.byteLength>=88){env=clamp(c.Minf.getInt16(0),0,4);envFlags=c.Minf.getInt16(8)&0xffff;}
  const game=(envFlags&0x06f0)?"m1":"inf"; // Infinity's own Map.sceA uses data version 1, so the version can't tell M2 from Infinity
  const d=newDoc(game);
  const envCol=17+env;
  // textures from other collections (landscapes, other wall sets) are kept with their collection number
  const texInfo=t=>{if(t===0xffff)return null;const r={b:t&255};const col=(t>>8)&31,clut=(t>>13)&7;if(col!==envCol)r.col=col;if(clut)r.clut=clut;return r;};
  const pts=[];
  if(c.PNTS&&c.PNTS.byteLength){for(let o=0;o+4<=c.PNTS.byteLength;o+=4)pts.push(P(c.PNTS.getInt16(o),c.PNTS.getInt16(o+2)));}
  else if(c.EPNT){for(let o=0;o+16<=c.EPNT.byteLength;o+=16)pts.push(P(c.EPNT.getInt16(o+6),c.EPNT.getInt16(o+8)));}
  d.pts=pts;
  const lines=[];if(c.LINS)for(let o=0;o+32<=c.LINS.byteLength;o+=32){const a=c.LINS.getInt16(o),b=c.LINS.getInt16(o+2),f=c.LINS.getUint16(o+4);
    lines.push({a:pts[a],b:pts[b],flags:f,cws:c.LINS.getInt16(o+12),ccws:c.LINS.getInt16(o+14),cw:c.LINS.getInt16(o+16),ccw:c.LINS.getInt16(o+18)});}
  d.lines=lines.filter(l=>l.a&&l.b).map(l=>({a:l.a,b:l.b,solid:l.cw>=0&&l.ccw>=0&&!!(l.flags&0x4000)&&!!(l.flags&0x2000)}));
  const lights=[];if(c.LITE){d.lights=[];for(let o=0;o+100<=c.LITE.byteLength;o+=100){lights.push(Math.round(clamp(c.LITE.getInt32(o+12)/65536,0,1)*100));d.lights.push(b64enc(bytesOf(new DataView(c.LITE.buffer,c.LITE.byteOffset+o,100))));}}
  const pct=i=>lights[i]??100;
  const SD=[];if(c.SIDS)for(let o=0;o+64<=c.SIDS.byteLength;o+=64){const v=c.SIDS;
    SD.push({type:v.getInt16(o),flags:v.getUint16(o+2),cpType:v.getInt16(o+38),cpPerm:v.getInt16(o+40),
      p:{x:v.getInt16(o+4),y:v.getInt16(o+6),t:v.getUint16(o+8),xf:v.getInt16(o+42),l:v.getInt16(o+52)},
      s:{x:v.getInt16(o+10),y:v.getInt16(o+12),t:v.getUint16(o+14),xf:v.getInt16(o+44),l:v.getInt16(o+54)},
      tr:{x:v.getInt16(o+16),y:v.getInt16(o+18),t:v.getUint16(o+20),xf:v.getInt16(o+46),l:v.getInt16(o+56)},poly:v.getInt16(o+48),line:v.getInt16(o+50)});}
  // doors and lifts: editor-side static data, or the "compiled" dynamic records in Bungie's preprocessed maps
  const platBy=new Map();
  if(c.plat&&c.plat.byteLength)for(let o=0;o+32<=c.plat.byteLength;o+=32){const v=c.plat;platBy.set(v.getInt16(o+14),{type:v.getInt16(o),speed:v.getInt16(o+2),delay:v.getInt16(o+4),max:v.getInt16(o+6),min:v.getInt16(o+8),flags:v.getUint32(o+10),tag:v.getInt16(o+16)});}
  else if(c.PLAT)for(let o=0;o+140<=c.PLAT.byteLength;o+=140){const v=c.PLAT;const F=v.getUint32(o+2);const both=(F&(1<<6))&&(F&(1<<7));
    const mnF=v.getInt16(o+10),mxF=v.getInt16(o+12),mnC=v.getInt16(o+14),mxC=v.getInt16(o+16);
    const [min,max]=both?[mnF,mxC]:(F&(1<<6))?[mnF,mxF]:(F&(1<<7))?[mnC,mxC]:[-1,-1];
    platBy.set(v.getInt16(o+18),{type:v.getInt16(o),speed:v.getInt16(o+6),delay:v.getInt16(o+8),min,max,flags:F,tag:v.getInt16(o+94)});}
  const MD=[];if(c.medi)for(let o=0;o+32<=c.medi.byteLength;o+=32){const v=c.medi;MD.push({type:v.getInt16(o),flags:v.getUint16(o+2),li:v.getInt16(o+4),dir:Math.round(v.getInt16(o+6)*360/512),speed:v.getInt16(o+8),low:v.getInt16(o+10),high:v.getInt16(o+12),minLight:v.getInt32(o+20)/65536});}
  if(c.ambi&&c.ambi.byteLength)d.ambi=b64enc(bytesOf(c.ambi));
  if(c.bonk&&c.bonk.byteLength)d.bonk=b64enc(bytesOf(c.bonk));
  const fileToDoc={};
  if(c.POLY)for(let o=0,i=0;o+128<=c.POLY.byteLength;o+=128,i++){const v=c.POLY;const n=v.getUint16(o+6);
    const type=v.getInt16(o);
    const ring=[],ringLines=[];for(let k=0;k<n&&k<8;k++){const li=v.getInt16(o+24+k*2);const L=lines[li];if(!L||!L.a||!L.b){ring.length=0;break;}ring.push(L.cw===i?L.a:L.b);ringLines.push(li);}
    if(ring.length<3)continue;
    const ft=v.getUint16(o+40),ct=v.getUint16(o+42),fli=v.getInt16(o+48),cli=v.getInt16(o+50);
    let wall=null;
    for(let k=0;k<ring.length;k++){const L=lines[ringLines[k]];const si=L.cw===i?L.cws:L.ccws;const sd=SD[si];if(!sd)continue;
      const from=ring[k],to=ring[(k+1)%ring.length];const rec={};
      const part=(x)=>{const ti=texInfo(x.t);if(!ti)return null;const t={...ti,ox:x.x,oy:x.y,li:x.l};if(x.xf>0)t.xfer=x.xf;if(pct(x.l)!==pct(fli))t.light=pct(x.l);return t;};
      const pp=part(sd.p),sp=part(sd.s),tp=part(sd.tr);
      if(pp){if(sd.type===0)rec.full=pp;else if(sd.type===2)rec.lower=pp;else rec.upper=pp;if(wall==null)wall=pp.b;}
      if(sd.type===4&&sp)rec.lower=sp;
      if(tp)rec.trans=tp;
      if(sd.flags&0x02)rec.panel={type:sd.cpType,perm:sd.cpPerm,flags:sd.flags&0x7d};
      if(Object.keys(rec).length)d.sides.set(sideKey(from,to),rec);}
    if(signedArea(ring)<0){
      const re=new Map();for(let k=0;k<ring.length;k++){const a=ring[k],b=ring[(k+1)%ring.length];const r=d.sides.get(sideKey(a,b));if(r){d.sides.delete(sideKey(a,b));re.set(sideKey(b,a),r);}}for(const [k2,v2] of re)d.sides.set(k2,v2);ring.reverse();}
    fileToDoc[i]=d.polys.length;
    const q={...polyDefaults(),verts:ring,type,perm:v.getInt16(o+4),
      floor:v.getInt16(o+44),ceil:v.getInt16(o+46),light:pct(fli),fli,cli,
      ftex:ft===0xffff?6:ft&255,ctex:ct===0xffff?7:ct&255,wtex:wall??5,fxfer:v.getInt16(o+64),cxfer:v.getInt16(o+66),fox:v.getInt16(o+108),foy:v.getInt16(o+110),cox:v.getInt16(o+112),coy:v.getInt16(o+114)};
    if(pct(cli)!==pct(fli))q.clight=pct(cli);
    {const fi=texInfo(ft),ci=texInfo(ct);if(fi&&fi.col!=null)q.fcol=fi.col;if(fi&&fi.clut)q.fclut=fi.clut;if(ci&&ci.col!=null)q.ccol=ci.col;if(ci&&ci.clut)q.cclut=ci.clut;}
    if(type===5)q.plat=platBy.get(i)||PLAT_DEFAULT();
    const mi=v.getInt16(o+116);if(mi>=0&&MD[mi])q.media={...MD[mi],mli:v.getInt16(o+118)};
    const amb=v.getInt16(o+122),rnd=v.getInt16(o+124);if(amb>=0)q.amb=amb;if(rnd>=0)q.rnd=rnd;
    d.polys.push(q);}
  // keep polygon references pointing at the same polygons if any were skipped
  const fix=x=>fileToDoc[x]??x;
  if(Object.keys(fileToDoc).some(k=>fileToDoc[k]!==+k)){for(const q of d.polys)if([7,9,10].includes(q.type))q.perm=fix(q.perm);
    for(const sd of d.sides.values())if(sd.panel&&panelKeyOf(sd.panel.type)==="platform")sd.panel.perm=fix(sd.panel.perm);}
  if(c.OBJS)for(let o=0;o+16<=c.OBJS.byteLength;o+=16){const v=c.OBJS;const kind=v.getInt16(o);
    const f=v.getInt16(o+4);
    d.objs.push({kind,sub:v.getInt16(o+2),facing:kind===5?0:Math.round(f*360/512),sub2:kind===5?f:0,x:v.getInt16(o+8),y:v.getInt16(o+10),z:v.getInt16(o+12),flags:v.getUint16(o+14)});}
  if(c.NOTE)for(let o=0;o+72<=c.NOTE.byteLength;o+=72){const v=c.NOTE;const b=new Uint8Array(v.buffer,v.byteOffset+o+8,64);const z=b.indexOf(0);d.notes.push({type:v.getInt16(o),x:v.getInt16(o+2),y:v.getInt16(o+4),text:macDecode(b.subarray(0,z<0?64:z))});}
  if(c.Minf&&c.Minf.byteLength>=88){const m=c.Minf;Object.assign(d.info,{name:lv.name,env,landscape:clamp(m.getInt16(4),0,3),mission:m.getInt16(6),envFlags,entry:m.getInt32(84)||1});}
  if(c.plac&&c.plac.byteLength>=128*12){const rd=(i)=>[0,2,4,6,8,10].map(k=>c.plac.getUint16(i*12+k)<<16>>16);
    d.placement={items:Array.from({length:64},(_,i)=>rd(i)),monsters:Array.from({length:64},(_,i)=>rd(64+i))};
    for(const r of [...d.placement.items,...d.placement.monsters])r[5]=r[5]&0xffff;}
  if(c.term&&c.term.byteLength){try{d.terms=parseTerminalChunk(bytesOf(c.term));}catch(e){notes.push("its terminals couldn't be read");}}
  if(PHYSICS_TAGS.some(t=>c[t])){d.physics={mode:"keep",keep:{}};for(const t of PHYSICS_TAGS)if(c[t])d.physics.keep[t]=b64enc(bytesOf(c[t]));}
  return {doc:d,notes};
}

// =============================================================== level builder (used by generators and the sample)
const MON_KEY=Object.fromEntries(MONSTERS.map(([k],i)=>[k.toLowerCase(),i]));
const ITEM_KEY=Object.fromEntries(ITEMS.map(([k],i)=>[k.toLowerCase(),i]));
const ROOM_TYPES={normal:0,item_impassable:1,monster_impassable:2,hill:3,base:4,zone_border:11,goal:12,must_explore:17,exit:18,minor_ouch:19,major_ouch:20,glue:21,superglue:23};
function buildFromSpec(spec,{replace}={}){
  if(replace){const g=doc.info.game||"inf";doc=newDoc(g);}
  const env=["water","lava","sewage","jjaro","pfhor"].indexOf(String(spec.environment||"").toLowerCase());
  if(replace){doc.info.name=String(spec.name||"Generated Level").slice(0,60);if(env>=0)doc.info.env=env;if(!envOptions(doc.info.game).some(o=>o[0]===doc.info.env))doc.info.env=envOptions(doc.info.game)[0][0];
    const ls=["day","night","moon","space"].indexOf(String(spec.landscape||"").toLowerCase());if(ls>=0)doc.info.landscape=ls;
    if(spec.mode==="carnage")doc.info.entry=4;else doc.info.entry=1|2;}
  const q=v=>Math.round(Number(v)*WU/32)*32;
  const roomPoly={};const report={rooms:0,skipped:[],objects:0};
  let hs=0;for(const ch of String(spec.seed??spec.name??"")) hs=(Math.imul(hs,31)+ch.charCodeAt(0))|0;
  const theme=texTheme(hs);const hash=s=>{let h=7^hs;for(const ch of String(s))h=(Math.imul(h,33)+ch.charCodeAt(0))|0;h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;};
  const rooms=(spec.rooms||[]).slice(0,120);
  for(const r of rooms){
    const x=q(r.x),y=q(r.y),w=q(r.w),h=q(r.h);
    if(![x,y,w,h].every(Number.isFinite)||w<128||h<128){report.skipped.push(r.id+" (bad size)");continue;}
    if(Math.abs(x)>MAXC-1024||Math.abs(y)>MAXC-1024||Math.abs(x+w)>MAXC-1024||Math.abs(y+h)>MAXC-1024){report.skipped.push(r.id+" (out of bounds)");continue;}
    const cs=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
    if(doc.polys.some(p=>convexOverlap(cs,p.verts))){report.skipped.push(r.id+" (overlaps)");continue;}
    let floor=clamp(q(r.floor??0),-8*WU,8*WU),ceil=clamp(q(r.ceiling??(Number(r.floor||0)+1.25)),-8*WU,9*WU);if(ceil<floor)ceil=floor+WU;
    const type=ROOM_TYPES[String(r.type||"normal").toLowerCase()]??0;
    const tx=(v,d)=>Number.isInteger(v)&&v>=0&&v<texCount()&&!texSpecial(v)?v:d;
    // rooms take textures from the level theme; corridors and stairs ("C…") use the theme's main set so they read as one passage
    const rh=hash(r.id),corr=/^C/.test(String(r.id)),pk=(a,o)=>a[corr?0:(rh>>>o)%a.length];
    const dw=theme?pk(theme.wall,0):texDefault("wall"),df=theme?pk(theme.floor,3):texDefault("floor");
    let dc=theme?pk(theme.ceil,6):texDefault("ceil");if(theme&&!corr&&theme.light.length&&(rh>>>9)%6===0)dc=theme.light[(rh>>>12)%theme.light.length];
    const poly=makePolygonFromCoords(cs,{floor,ceil,light:clamp(Math.round(r.light??85),0,100),type,ftex:tx(r.floorTex,df),ctex:tx(r.ceilingTex,dc),wtex:tx(r.wallTex,dw)});
    if(poly){roomPoly[r.id]=poly;report.rooms++;}
  }
  for(const p of [...doc.polys])if(p.verts.length>8)splitPolygon(p);
  for(const o of (spec.objects||[]).slice(0,200)){
    const room=roomPoly[o.room];if(!room)continue;
    const xs=room.verts.map(v=>v.x),ys=room.verts.map(v=>v.y);
    const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    let px=x0+clamp(Number(o.dx??0.5),0.1,0.9)*(x1-x0),py=y0+clamp(Number(o.dy??0.5),0.1,0.9)*(y1-y0);
    const pt={x:Math.round(px),y:Math.round(py)};
    if(!polyAtPoint(pt))continue;
    const kind=String(o.kind||"").toLowerCase();const what=String(o.what||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    let obj=null;
    if(kind==="player")obj={kind:3,sub:0};
    else if(kind==="monster"){const i=Object.keys(MON_KEY).find(k=>k.replace(/[^a-z0-9]/g,"")===what);if(i!=null)obj={kind:0,sub:MON_KEY[i]};}
    else if(kind==="item"){const i=Object.keys(ITEM_KEY).find(k=>k.replace(/[^a-z0-9]/g,"")===what);if(i!=null)obj={kind:2,sub:ITEM_KEY[i]};}
    else if(kind==="goal")obj={kind:4,sub:0};
    if(!obj)continue;
    doc.objs.push({...obj,x:pt.x,y:pt.y,z:0,facing:Math.round(Number(o.facing)||0),flags:0});report.objects++;
  }
  for(const l of (Array.isArray(spec.labels)?spec.labels:[]).slice(0,60)){
    const room=roomPoly[l.room];const text=String(l.text||"").trim().toUpperCase();if(!room||!labelInfo(text))continue;
    const xs=room.verts.map(v=>v.x),ys=room.verts.map(v=>v.y);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const pt={x:Math.round(x0+clamp(Number(l.dx??0.5),0.15,0.85)*(x1-x0)),y:Math.round(y0+clamp(Number(l.dy??0.5),0.15,0.85)*(y1-y0))};
    if(polyAtPoint(pt)){doc.notes.push({type:0,...pt,text});report.labels=(report.labels||0)+1;}}
  if(doc.polys.length&&!doc.objs.some(o=>o.kind===3)){const c=centroid(doc.polys[0].verts);doc.objs.push({kind:3,sub:0,x:Math.round(c.x),y:Math.round(c.y),z:0,facing:0,flags:0});}
  return report;
}
function sampleSpec(){return {name:"Cistern (sample)",environment:"water",landscape:"night",
  rooms:[
    {id:"A",x:-6,y:-2,w:6,h:4,floor:0,ceiling:1.5,light:90},
    {id:"W",x:-9,y:-1,w:3,h:2,floor:-0.25,ceiling:1.25,light:60},
    {id:"B",x:0,y:-0.5,w:4,h:1,floor:0,ceiling:1.1,light:75},
    {id:"S1",x:4,y:-0.5,w:0.5,h:1,floor:0.25,ceiling:1.35,light:75},
    {id:"S2",x:4.5,y:-0.5,w:0.5,h:1,floor:0.5,ceiling:1.6,light:75},
    {id:"S3",x:5,y:-0.5,w:0.5,h:1,floor:0.75,ceiling:1.85,light:75},
    {id:"D2",x:5.5,y:-1.5,w:3,h:3,floor:1,ceiling:3,light:80},
    {id:"PIT",x:8.5,y:-1.5,w:2,h:3,floor:0,ceiling:3,light:45,type:"minor_ouch"},
    {id:"D3",x:10.5,y:-1.5,w:3,h:3,floor:1,ceiling:3,light:80},
    {id:"ST",x:13.5,y:-1.5,w:1,h:1.5,floor:1.25,ceiling:3,light:70},
    {id:"N",x:5.5,y:-4.5,w:9,h:3,floor:1.5,ceiling:3,light:65}],
  objects:[
    {kind:"player",room:"A",dx:0.25,dy:0.5,facing:0},
    {kind:"item",what:"AssaultRifle",room:"W",dx:0.3,dy:0.5},{kind:"item",what:"AssaultRifleMagazine",room:"W",dx:0.7,dy:0.5},
    {kind:"monster",what:"FighterMinor",room:"D2",dx:0.6,dy:0.4,facing:180},{kind:"monster",what:"FighterMajor",room:"D3",dx:0.5,dy:0.6,facing:180},
    {kind:"monster",what:"CompilerMinor",room:"N",dx:0.6,dy:0.4,facing:90},{kind:"item",what:"Shield1x",room:"N",dx:0.9,dy:0.3}]};}


// =============================================================== texture palettes (picked by eye from each game's Shapes file)
// For generated levels: which bitmaps in each wall set look right as walls, floors and ceilings, which are light fixtures,
// and which are special (switches, rechargers, terminals, liquid surfaces, doors, loud accents) and never used at random.
// Keys: game → environment index. "special" maps bitmap → what it is (shown in the texture picker).
const M2I_SPECIAL={0:"switch",1:"switch",2:"recharger",3:"recharger",4:"terminal"};
const TEX_PALETTE={
  inf:{
    0:{wall:[6,11,12,14,18,20,21,22,23,26,29,13],floor:[5,7,13,17,24,28,6],ceil:[7,17,24,13,21],light:[10,15,25],special:{...M2I_SPECIAL,19:"water surface",8:"light",9:"light",16:"light",27:"light"}},
    1:{wall:[5,6,8,11,15,18,19,20,21,22,23,24,26],floor:[14,16,20,22,24,28,5,19],ceil:[6,11,23,16,20],light:[10,17,25],special:{...M2I_SPECIAL,12:"lava surface",9:"loud",29:"loud",7:"loud",27:"loud",13:"accent"}},
    2:{wall:[5,6,7,8,10,11,12,14,16,17,20,21,22,24,25,27,28],floor:[18,19,23,26,11,14,17],ceil:[15,23,28,24,6],light:[29],special:{...M2I_SPECIAL,13:"sewage surface",9:"light"}},
    3:{wall:[5,6,7,8,10,11,12,14,16,19,20,21,22,25,30,31],floor:[26,34,23,15,7,19],ceil:[26,34,23,15],light:[17,32],special:{...M2I_SPECIAL,13:"goo surface",9:"loud",18:"accent",24:"accent",27:"doorway",28:"doorway",29:"Jjaro glyph",33:"accent"}},
    4:{wall:[6,7,8,11,13,14,16,17,18,20,21,22,25,27,28],floor:[6,14,16,18,25,28,29],ceil:[18,20,28,29,22],light:[10,12],special:{...M2I_SPECIAL,5:"goo surface",9:"loud",15:"door",19:"light",23:"door",24:"light",26:"door"}}},
  m2:{
    0:{wall:[5,8,11,12,13,14,18,20,22,23,26,27],floor:[5,6,7,13,17,21,24,28],ceil:[7,17,21,24,28],light:[25,15],special:{...M2I_SPECIAL,19:"water surface",9:"accent",10:"accent",16:"loud",29:"accent"}},
    1:{wall:[5,6,8,11,15,17,18,19,20,21,22,23,24,26],floor:[14,16,19,20,23,24,28,5],ceil:[6,11,17,23,14],light:[10,25],special:{...M2I_SPECIAL,12:"lava surface",7:"loud",9:"loud",13:"accent",27:"loud",29:"loud"}},
    2:{wall:[5,6,7,8,10,11,12,14,16,17,19,20,21,22,27],floor:[18,23,26,24,28,19,11],ceil:[15,23,26,24,28],light:[],special:{...M2I_SPECIAL,13:"sewage surface",9:"loud"}},
    4:{wall:[6,8,13,16,17,18,20,21,22,25,26],floor:[14,17,20,21,26,27],ceil:[18,20,21,22,14],light:[12],special:{...M2I_SPECIAL,5:"goo surface",7:"loud",9:"loud",11:"accent",15:"door",19:"light",23:"door",24:"loud",28:"loud",29:"loud"}}},
  m1:{
    0:{wall:[1,2,3,4,10,11,14,15,16,17,18,19,22,23,26],floor:[7,11,16,22,28,18,14],ceil:[5,11,22,7],light:[6],special:{0:"hazard",8:"fan",9:"door",12:"panel",13:"door",20:"door",21:"door",24:"starfield",25:"door",27:"terminal",29:"loud"}},
    1:{wall:[2,3,10,11,15,16,17,18,19,20,22,23,26],floor:[0,7,10,12,18,20,26,28],ceil:[10,12,20,28,0],light:[],special:{1:"door",4:"door",5:"panel",6:"light",8:"terminal",9:"terminal",13:"door",14:"panel",21:"starfield",24:"switch",25:"hazard",27:"loud",29:"loud"}},
    2:{wall:[0,1,2,3,5,6,8,10,11,13,14,18,27],floor:[5,7,10,22,25,14],ceil:[5,22,25,10],light:[9],special:{4:"force field",12:"switch",15:"panel",16:"terminal",17:"loud",19:"panel",20:"sign",21:"door",23:"loud",24:"terminal",26:"panel",28:"hazard",29:"lava"}}}};
function texPalette(game=doc.info.game,env=doc.info.env){const g=TEX_PALETTE[game]||TEX_PALETTE.inf;return g[env]||null;}
function texDefault(kind){let p=null;try{p=texPalette();}catch(e){}return p&&p[kind]&&p[kind].length?p[kind][0]:{wall:5,floor:6,ceil:7}[kind];}
function texSpecial(i){const p=texPalette();return p&&p.special?p.special[i]||null:null;}
// A level-wide theme: a few walls, floors and ceilings that go together, so generated levels look designed, not random.
function texTheme(seed){const p=texPalette();if(!p)return null;const R=mulberry(seed|0||1);
  const take=(a,n)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);};
  return {wall:take(p.wall,3),floor:take(p.floor,2),ceil:take(p.ceil,2),light:p.light,R};}

// --------------------------------------------------------------- random layout generator (works offline)
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function randomSpec(seed,size,mode){
  const R=mulberry(seed),pick=a=>a[Math.floor(R()*a.length)],rr=(a,b,s=0.5)=>Math.round((a+R()*(b-a))/s)*s;
  const target={small:8,medium:16,large:28}[size]||16;
  const rooms=[],big=[];const LIM=24;
  const overlaps=(r)=>rooms.some(o=>r.x<o.x+o.w-1e-6&&o.x<r.x+r.w-1e-6&&r.y<o.y+o.h-1e-6&&o.y<r.y+r.h-1e-6);
  const inb=r=>r.x>-LIM&&r.y>-LIM&&r.x+r.w<LIM&&r.y+r.h<LIM;
  const first={id:"R0",x:-3,y:-3,w:6,h:6,floor:0,ceiling:2,light:90};rooms.push(first);big.push(first);
  let n=1,tries=0;
  while(big.length<target&&tries++<600){
    const from=pick(big),side=Math.floor(R()*4);
    const cw=pick([1,1,1.5,2]),clen=rr(1.5,5);
    const delta=pick([0,0,0,0.5,-0.5,1,0.25]);
    const steps=delta===0?1:Math.max(1,Math.min(Math.round(Math.abs(delta)/0.25),Math.floor(clen/0.5)));
    const horiz=side%2===1; // 1=east,3=west ; 0=north,2=south
    const span=horiz?from.h:from.w;if(span<cw+0.5)continue;
    const along=(horiz?from.y:from.x)+rr(0.25,span-cw-0.25,0.25);
    const segs=[];const segLen=clen/steps;
    for(let s=0;s<steps;s++){
      const f=from.floor+(delta===0?0:delta*(s+1)/(steps+1));
      let r;
      if(side===1)r={x:from.x+from.w+s*segLen,y:along,w:segLen,h:cw};
      else if(side===3)r={x:from.x-(s+1)*segLen,y:along,w:segLen,h:cw};
      else if(side===2)r={x:along,y:from.y+from.h+s*segLen,w:cw,h:segLen};
      else r={x:along,y:from.y-(s+1)*segLen,w:cw,h:segLen};
      segs.push({...r,floor:+f.toFixed(3),ceiling:+(f+1.2).toFixed(3),light:Math.round(rr(50,85,5))});
    }
    const end=segs[segs.length-1];
    const rw=rr(3,9),rh=rr(3,9);
    let room;
    if(side===1)room={x:end.x+end.w,y:end.y-rr(0,rh-cw,0.25),w:rw,h:rh};
    else if(side===3)room={x:end.x-rw,y:end.y-rr(0,rh-cw,0.25),w:rw,h:rh};
    else if(side===2)room={x:end.x-rr(0,rw-cw,0.25),y:end.y+end.h,w:rw,h:rh};
    else room={x:end.x-rr(0,rw-cw,0.25),y:end.y-rh,w:rw,h:rh};
    if(horiz&&(room.y>end.y||room.y+room.h<end.y+cw))continue;
    if(!horiz&&(room.x>end.x||room.x+room.w<end.x+cw))continue;
    const fl=from.floor+delta;
    Object.assign(room,{id:"R"+n,floor:fl,ceiling:fl+pick([1.5,2,2,3]),light:Math.round(rr(55,95,5))}); // textures come from the level theme in buildFromSpec
    const all=[...segs,room];
    if(!all.every(inb)||all.some(overlaps))continue;
    // pits: occasionally sink part of a big room
    segs.forEach((s,i)=>{s.id="C"+n+"_"+i;rooms.push(s);});rooms.push(room);big.push(room);n++;
  }
  const objects=mode==="extraction"?[[.3,.3],[.7,.3],[.3,.7],[.7,.7]].map(([dx,dy])=>({kind:"player",room:"R0",dx,dy,facing:pick([0,90,180,270])})):[{kind:"player",room:"R0",dx:0.5,dy:0.5,facing:pick([0,90,180,270])}];
  if(mode==="carnage")big.slice(1).forEach((r,i)=>{if(i%2===0)objects.push({kind:"player",room:r.id,dx:rr(0.2,0.8,0.1),dy:rr(0.2,0.8,0.1),facing:pick([0,90,180,270])});});
  const foes=["FighterMinor","FighterMajor","FighterMinorProjectile","CompilerMinor","TrooperMinor","DroneMinor","EnforcerMinor","HunterMinor","TickKamikaze","CyborgMinor"];
  const loot=["MagnumMagazine","AssaultRifle","AssaultRifleMagazine","AssaultGrenades","Shotgun","ShotgunShells","FusionPistol","FusionBattery","Shield1x","Oxygen","RocketLauncher","Rockets","Shield2x"];
  big.slice(1).forEach(r=>{
    if(mode!=="carnage"&&R()<0.75)for(let k=0;k<1+Math.floor(R()*3);k++)objects.push({kind:"monster",what:pick(foes),room:r.id,dx:rr(0.2,0.8,0.1),dy:rr(0.2,0.8,0.1),facing:Math.floor(R()*360)});
    if(R()<0.7)objects.push({kind:"item",what:pick(loot),room:r.id,dx:rr(0.2,0.8,0.1),dy:rr(0.2,0.8,0.1)});
  });
  if(big.length>4&&R()<0.6){const r=pick(big.slice(1));r.type="minor_ouch";r.light=50;}
  const envNames=["water","lava","sewage","jjaro","pfhor"];return {name:`Random Layout ${seed}`,seed,size,environment:envNames[pick(envOptions(doc.info.game).map(o=>o[0]))],landscape:pick(["day","night","moon","space"]),mode,rooms,objects};
}

// =============================================================== rendering (2D map)
const canvas=document.getElementById("map"),ctx=canvas.getContext("2d");
let pal={};
function readPalette(){const cs=getComputedStyle(document.documentElement);
  for(const k of ["canvas-bg","grid","grid-major","poly","wall","edge","pt","accent","danger","orphan","fg","muted","panel","warn"])pal[k]=cs.getPropertyValue("--"+k).trim();}
let W=0,H=0,DPR=1;
function resize(){const r=canvas.getBoundingClientRect();DPR=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;canvas.width=Math.max(1,Math.round(W*DPR));canvas.height=Math.max(1,Math.round(H*DPR));draw();}
const toS=(x,y)=>[(x-view.cx)*view.scale+W/2,(y-view.cy)*view.scale+H/2];
const toW=(sx,sy)=>({x:(sx-W/2)/view.scale+view.cx,y:(sy-H/2)/view.scale+view.cy});
const fmt=v=>(v/WU).toFixed(3);
function heightColor(v,lo,hi){const t=hi>lo?clamp((v-lo)/(hi-lo),0,1):0.5;
  const stops=[[40,70,170],[40,150,170],[70,170,90],[220,190,60],[220,90,50]];
  const f=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(f)),u=f-i;const a=stops[i],b=stops[i+1];
  return `rgb(${a.map((c,k)=>Math.round(c+(b[k]-c)*u)).join(",")})`;}
const TYPE_COLORS={0:null,1:"#8a6bbf",2:"#b2589a",3:"#d9a62e",4:"#3f8fd1",10:"#30b5a8",11:"#888",12:"#e0c040",13:"#d06a3a",14:"#a85030",15:"#c0603a",16:"#6fae3c",17:"#58a0c8",18:"#2aa070",19:"#e07a2a",20:"#d03a2a",21:"#9c8a5a",22:"#8c7a4a",23:"#6c5a2a"};
function heightRange(key){let lo=Infinity,hi=-Infinity;for(const q of doc.polys){lo=Math.min(lo,q[key]);hi=Math.max(hi,q[key]);}if(!isFinite(lo)){lo=0;hi=WU;}return [lo,hi];}
function polyFill(q,range){
  switch(opts.viewMode){
    case "floor":return heightColor(q.floor,...range);
    case "ceil":return heightColor(q.ceil,...range);
    case "light":{const v=Math.round(25+q.light*2.1);return `rgb(${v},${v},${Math.min(255,v+8)})`;}
    case "type":return TYPE_COLORS[q.type]||pal.poly;
    default:return pal.poly;}
}
function draw(){
  if(!W)return;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle=pal["canvas-bg"];ctx.fillRect(0,0,W,H);
  // grid
  const minor=opts.grid;const tl=toW(0,0),br=toW(W,H);
  const drawGrid=(step,color,lw)=>{const px=step*view.scale;if(px<6)return;ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();
    for(let x=Math.floor(tl.x/step)*step;x<=br.x;x+=step){const s=Math.round(toS(x,0)[0])+.5;ctx.moveTo(s,0);ctx.lineTo(s,H);}
    for(let y=Math.floor(tl.y/step)*step;y<=br.y;y+=step){const s=Math.round(toS(0,y)[1])+.5;ctx.moveTo(0,s);ctx.lineTo(W,s);}ctx.stroke();};
  drawGrid(minor,pal.grid,1);drawGrid(WU,pal["grid-major"],1);
  if(WU*view.scale<6)drawGrid(WU*8,pal["grid-major"],1);
  // map bounds
  {const [x0,y0]=toS(-MAXC,-MAXC),[x1,y1]=toS(MAXC,MAXC);ctx.strokeStyle=pal.edge;ctx.setLineDash([6,4]);ctx.strokeRect(x0,y0,x1-x0,y1-y0);ctx.setLineDash([]);}
  // polygons
  const key=opts.viewMode==="ceil"?"ceil":"floor";const range=heightRange(key);
  const selPolys=sel.kind==="poly"?new Set(sel.items):new Set();
  const bad=new Set(issues.filter(i=>i.lv==="error"&&i.target&&i.target.kind==="poly").flatMap(i=>i.target.items));
  for(const q of doc.polys){
    ctx.beginPath();q.verts.forEach((v,i)=>{const [x,y]=toS(v.x,v.y);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();
    if(opts.viewMode==="tex"){const t=texPattern(q.ftex);const [ox,oy]=toS(-(q.fox||0),-(q.foy||0));const sc=WU*view.scale/t.w;
      try{t.p.setTransform(new DOMMatrix([sc,0,0,sc,ox,oy]));}catch(_){}ctx.fillStyle=t.p;ctx.fill();
      ctx.fillStyle="#000";ctx.globalAlpha=(1-q.light/100)*0.7;ctx.fill();ctx.globalAlpha=1;}
    else{ctx.fillStyle=polyFill(q,range);ctx.globalAlpha=opts.uiStyle==="retro"&&opts.viewMode==="draw"?1:0.92;ctx.fill();ctx.globalAlpha=1;}
    if(bad.has(q)){ctx.save();ctx.clip();ctx.strokeStyle=pal.danger;ctx.lineWidth=1;ctx.globalAlpha=.6;const b=q.verts.map(v=>toS(v.x,v.y));const xs=b.map(p=>p[0]),ys=b.map(p=>p[1]);
      for(let s=Math.min(...xs)-Math.max(...ys);s<Math.max(...xs);s+=8){ctx.beginPath();ctx.moveTo(s+Math.min(...ys)*0,Math.max(...ys));ctx.lineTo(s+Math.max(...ys)-Math.min(...ys),Math.min(...ys));ctx.stroke();}ctx.restore();}
    if(q.media){ctx.save();const c=MEDIA_TINT[q.media.type]||[1,1,1];ctx.fillStyle=`rgb(${c.map(v=>Math.round(v*170)).join(",")})`;ctx.globalAlpha=q.media.high>q.floor?0.35:0.12;ctx.fill();ctx.restore();}
    if(q.type===5){ctx.save();ctx.clip();ctx.strokeStyle="#3f8fd1";ctx.globalAlpha=.7;ctx.lineWidth=1.5;const b=q.verts.map(v=>toS(v.x,v.y));const xs=b.map(p=>p[0]),ys=b.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
      ctx.beginPath();for(let t=x0-(y1-y0);t<x1;t+=7){ctx.moveTo(t,y1);ctx.lineTo(t+(y1-y0),y0);}ctx.stroke();ctx.restore();}
    if(selPolys.has(q)||hover===q){ctx.save();ctx.fillStyle=pal.accent;ctx.globalAlpha=selPolys.has(q)?0.3:0.12;ctx.fill();ctx.restore();}
  }
  // lines
  const owners=new Map();for(const q of doc.polys)for(let i=0;i<q.verts.length;i++){const k=Math.min(q.verts[i].id,q.verts[(i+1)%q.verts.length].id)+"-"+Math.max(q.verts[i].id,q.verts[(i+1)%q.verts.length].id);owners.set(k,(owners.get(k)||0)+1);}
  const selLines=sel.kind==="line"?new Set(sel.items):new Set();
  for(const l of doc.lines){const k=Math.min(l.a.id,l.b.id)+"-"+Math.max(l.a.id,l.b.id),n=owners.get(k)||0;
    const [x0,y0]=toS(l.a.x,l.a.y),[x1,y1]=toS(l.b.x,l.b.y);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);
    if(n===0){ctx.strokeStyle=pal.orphan;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);}
    else if(n===1||l.solid){ctx.strokeStyle=pal.wall;ctx.lineWidth=l.solid&&n===2?2.5:2;}
    else {ctx.strokeStyle=pal.edge;ctx.lineWidth=1;}
    if(selLines.has(l)||hover===l){ctx.strokeStyle=pal.accent;ctx.lineWidth=3.5;}
    ctx.stroke();ctx.setLineDash([]);}
  // points
  const ps=Math.max(2,Math.min(4,view.scale*WU/30));
  const selPts=sel.kind==="point"?new Set(sel.items):new Set();
  if(view.scale*WU>14)for(const p of doc.pts){const [x,y]=toS(p.x,p.y);const s=selPts.has(p)||hover===p;ctx.fillStyle=s?pal.accent:pal.pt;const r=s?ps+2:ps;ctx.fillRect(x-r/2,y-r/2,r,r);}
  // values
  if(opts.showValues&&view.scale*WU>26){ctx.font=`500 ${Math.round(clamp(view.scale*WU/4,9,12))}px ${getComputedStyle(document.body).getPropertyValue("--font-mono")||"monospace"}`;ctx.textAlign="center";ctx.textBaseline="middle";
    for(const q of doc.polys){let txt=null;if(opts.viewMode==="floor")txt=fmt(q.floor);else if(opts.viewMode==="ceil")txt=fmt(q.ceil);else if(opts.viewMode==="light")txt=q.light+"%";else if(opts.viewMode==="type"&&q.type)txt=TYPE_NAME[q.type];
      if(!txt)continue;const c=centroid(q.verts);const [x,y]=toS(c.x,c.y);const tw=ctx.measureText(txt).width+8;const xs=q.verts.map(v=>v.x),ys=q.verts.map(v=>v.y);if((Math.max(...xs)-Math.min(...xs))*view.scale<tw+2||(Math.max(...ys)-Math.min(...ys))*view.scale<18)continue;
      ctx.fillStyle=pal.panel;ctx.globalAlpha=.85;ctx.fillRect(x-tw/2,y-8,tw,16);ctx.globalAlpha=1;ctx.fillStyle=pal.fg;ctx.fillText(txt,x,y+.5);}}
  // teleporter arrows
  for(const q of doc.polys)if(q.type===10&&doc.polys[q.perm]){const a=centroid(q.verts),b=centroid(doc.polys[q.perm].verts);const [x0,y0]=toS(a.x,a.y),[x1,y1]=toS(b.x,b.y);ctx.strokeStyle="#30b5a8";ctx.setLineDash([3,3]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.setLineDash([]);}
  // map annotations (Forge's text notes)
  // labels (EXTRACT, LOOT…) are coloured tags; other notes are plain italic text. The dot is the anchor point.
  if(doc.notes&&doc.notes.length){const selN=sel.kind==="note"?new Set(sel.items):new Set();ctx.textAlign="left";ctx.textBaseline="middle";
    for(const nt of doc.notes){if(!noteShown(nt))continue;const b=noteBox(nt),li=labelInfo(nt.text),hl=selN.has(nt)||hover===nt;
      ctx.globalAlpha=li?.95:.8;ctx.fillStyle=li?li[2]:pal.panel;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.globalAlpha=1;
      if(hl){ctx.strokeStyle=pal.accent;ctx.lineWidth=2;ctx.strokeRect(b.x-1,b.y-1,b.w+2,b.h+2);}
      ctx.font=li?NOTE_FONT_L():NOTE_FONT();ctx.fillStyle=li?"#fff":pal.fg;ctx.fillText(nt.text,b.x+(li?9:3),b.y+b.h/2+.5);
      const [x,y]=toS(nt.x,nt.y);ctx.fillStyle=li?"#fff":pal.fg;ctx.beginPath();ctx.arc(x+(li?4:0),y,li?2:1.5,0,Math.PI*2);ctx.fill();}}
  // objects
  const selObj=sel.kind==="obj"?new Set(sel.items):new Set();
  for(const o of doc.objs)drawObj(o,selObj.has(o)||hover===o);
  // in-progress drawing
  if(tool==="line"&&chain.length){const last=chain[chain.length-1];const [x0,y0]=toS(last.x,last.y);const t=snapPoint(cursorW);const [x1,y1]=toS(t.x,t.y);
    ctx.strokeStyle=pal.accent;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.setLineDash([]);
    ctx.font="11px monospace";ctx.fillStyle=pal.fg;ctx.textAlign="left";ctx.fillText((hyp(last.x,last.y,t.x,t.y)/WU).toFixed(3)+" WU",x1+10,y1-10);}
  if(drag&&drag.type==="rect"){const a=drag.start,b=drag.cur;const [x0,y0]=toS(a.x,a.y),[x1,y1]=toS(b.x,b.y);ctx.fillStyle=pal.accent;ctx.globalAlpha=.18;ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.globalAlpha=1;ctx.strokeStyle=pal.accent;ctx.lineWidth=2;ctx.strokeRect(x0,y0,x1-x0,y1-y0);
    ctx.font="11px monospace";ctx.fillStyle=pal.fg;ctx.textAlign="left";ctx.fillText(`${(Math.abs(b.x-a.x)/WU).toFixed(2)} × ${(Math.abs(b.y-a.y)/WU).toFixed(2)} WU`,Math.max(x0,x1)+8,Math.max(y0,y1)+14);}
  // snap cursor
  if(["line","rect","object","fill","note"].includes(tool)&&!isTouch){const t=snapPoint(cursorW);const [x,y]=toS(t.x,t.y);ctx.strokeStyle=pal.accent;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.stroke();}
}
function drawObj(o,hl){
  const [x,y]=toS(o.x,o.y);const r=clamp(view.scale*WU*0.16,5,11);const ang=o.facing*Math.PI/180;
  ctx.save();ctx.translate(x,y);ctx.lineWidth=1.5;
  const col={3:"#2fa860",0:"#d8452f",2:"#e0a020",1:"#8a8a8a",4:"#3f8fd1",5:"#9a6ad0"}[o.kind]||"#888";
  ctx.fillStyle=col;ctx.strokeStyle=hl?pal.accent:pal["canvas-bg"];if(hl)ctx.lineWidth=3;
  ctx.beginPath();
  if(o.kind===3){ctx.rotate(ang);ctx.moveTo(r*1.3,0);ctx.lineTo(-r*.8,r*.85);ctx.lineTo(-r*.4,0);ctx.lineTo(-r*.8,-r*.85);ctx.closePath();}
  else if(o.kind===2){ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();}
  else if(o.kind===0){ctx.arc(0,0,r*.85,0,Math.PI*2);}
  else ctx.rect(-r*.7,-r*.7,r*1.4,r*1.4);
  ctx.fill();ctx.stroke();
  if(o.kind===0){ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(Math.cos(ang)*r*.8,Math.sin(ang)*r*.8);ctx.lineTo(Math.cos(ang)*r*1.6,Math.sin(ang)*r*1.6);ctx.stroke();}
  ctx.restore();
}
let rafPending=false;function redraw(){if(rafPending)return;rafPending=true;requestAnimationFrame(()=>{rafPending=false;draw();});}

// =============================================================== hit testing & snapping
const NOTE_FONT=()=>"italic 11px "+(getComputedStyle(document.body).getPropertyValue("--font-ui")||"sans-serif");
const NOTE_FONT_L=()=>"700 10px "+(getComputedStyle(document.body).getPropertyValue("--font-mono")||"monospace");
function noteBox(nt){ // screen rectangle of a note's tag; the anchor (nt.x, nt.y) is at its left middle
  const [x,y]=toS(nt.x,nt.y);const li=!!labelInfo(nt.text);ctx.font=li?NOTE_FONT_L():NOTE_FONT();
  const w=ctx.measureText(nt.text||" ").width+(li?13:6);return {x:li?x:x-3,y:y-8,w,h:16};}
const noteShown=nt=>view.scale*WU>10||tool==="note"||!!labelInfo(nt.text); // labels show at every zoom
function hitNote(sx,sy){const ns=doc.notes||[];for(let i=ns.length-1;i>=0;i--){if(!noteShown(ns[i]))continue;const b=noteBox(ns[i]);if(sx>=b.x-2&&sx<=b.x+b.w+2&&sy>=b.y-2&&sy<=b.y+b.h+2)return ns[i];}return null;}
function hitTest(sx,sy){
  const w=toW(sx,sy),tol=8/view.scale;
  let best=null,bd=Infinity;
  for(const o of doc.objs){const d=hyp(o.x,o.y,w.x,w.y);if(d<tol*1.3&&d<bd){bd=d;best=o;}}if(best)return {kind:"obj",item:best};
  {const n=hitNote(sx,sy);if(n)return {kind:"note",item:n};}
  for(const p of doc.pts){const d=hyp(p.x,p.y,w.x,w.y);if(d<tol&&d<bd){bd=d;best=p;}}if(best)return {kind:"point",item:best};
  for(const l of doc.lines){const d=distSeg(w,l.a,l.b);if(d<tol*.8&&d<bd){bd=d;best=l;}}if(best)return {kind:"line",item:best};
  const q=polyAtPoint(w);if(q)return {kind:"poly",item:q};
  return null;
}
function snapPoint(w,exclude){
  const tol=9/view.scale;let best=null,bd=tol;
  for(const p of doc.pts){if(p===exclude)continue;const d=hyp(p.x,p.y,w.x,w.y);if(d<bd){bd=d;best=p;}}
  if(best)return {x:best.x,y:best.y,pt:best};
  if(opts.snap){const g=opts.grid;return {x:Math.round(w.x/g)*g,y:Math.round(w.y/g)*g};}
  return {x:Math.round(w.x),y:Math.round(w.y)};
}

// =============================================================== interaction
let drag=null;const pointers=new Map();let pinch=null;let isTouch=false;let spaceDown=false;
canvas.addEventListener("pointerdown",e=>{
  isTouch=e.pointerType==="touch";canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:hyp(a.x,a.y,b.x,b.y),mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},scale:view.scale,c:{x:view.cx,y:view.cy}};drag=null;return;}
  const sx=e.offsetX,sy=e.offsetY,w=toW(sx,sy);cursorW=w;
  if(e.button===1||e.button===2||tool==="pan"||spaceDown){drag={type:"pan",sx,sy,cx:view.cx,cy:view.cy};return;}
  if(tool==="select"){
    const h=hitTest(sx,sy);
    if(!h){if(!e.shiftKey)setSel(null,[]);drag={type:"pan",sx,sy,cx:view.cx,cy:view.cy};return;}
    if(h.kind==="poly"&&e.shiftKey&&sel.kind==="poly"){const s=new Set(sel.items);s.has(h.item)?s.delete(h.item):s.add(h.item);setSel("poly",[...s]);return;}
    if(!(sel.kind===h.kind&&sel.items.includes(h.item)))setSel(h.kind,[h.item]);
    if(h.kind==="line"){drag=null;return;}
    const movers=h.kind==="poly"?[...new Set(sel.items.flatMap(q=>q.verts))]:h.kind==="point"?[h.item]:sel.items;
    drag={type:"move",kind:h.kind,start:w,movers,orig:movers.map(m=>({x:m.x,y:m.y})),moved:false,anchor:h.item};
  } else if(tool==="line"){
    const t=snapPoint(w);pushUndo();
    const p=t.pt||addPointAt(t.x,t.y,1);
    if(!chain.length){chain=[p];status("Click to add the next corner. Click the first point to close, or press Enter to finish.");}
    else{const last=chain[chain.length-1];if(p===last){undoStack.pop();return;}
      addSegment(last,p);
      if(p===chain[0]&&chain.length>=3){const ring=[...chain];chain=[];
        if(opts.autoFill){const c=centroid(ring);const r=fillAt(c.x,c.y);if(r.poly){setSel("poly",[r.poly]);status("Loop closed and filled.");}else status("Loop closed. "+r.err);}else status("Loop closed.");}
      else chain.push(p);}
    changed();
  } else if(tool==="rect"){
    const t=snapPoint(w);drag={type:"rect",start:{x:t.x,y:t.y},cur:{x:t.x,y:t.y}};
  } else if(tool==="fill"){
    pushUndo();const r=fillAt(w.x,w.y);if(r.poly){setSel("poly",[r.poly]);status("Filled a new polygon.");changed();}else{undoStack.pop();status(r.err);}
  } else if(tool==="object"){
    const t=opts.snap?{x:Math.round(w.x/64)*64,y:Math.round(w.y/64)*64}:{x:Math.round(w.x),y:Math.round(w.y)};
    if(!polyAtPoint(t)){status("Objects must be placed inside a polygon.");return;}
    pushUndo();const sub=opts.objKind===0?opts.objSub:opts.objKind===2?opts.objItem:0;
    const o={kind:opts.objKind,sub,x:t.x,y:t.y,z:0,facing:0,flags:0};doc.objs.push(o);setSel("obj",[o]);
    drag={type:"face",obj:o};changed();
  } else if(tool==="note"){
    const h=hitNote(sx,sy);
    if(h){setSel("note",[h]);drag={type:"move",kind:"note",start:w,movers:[h],orig:[{x:h.x,y:h.y}],moved:false,anchor:h};return;}
    const text=(opts.noteText||"").trim();if(!text){status("Type the note text in the bar above first.");return;}
    pushUndo();const nt={type:0,x:Math.round(w.x),y:Math.round(w.y),text};(doc.notes||(doc.notes=[])).push(nt);setSel("note",[nt]);changed();
    const q=polyAtPoint(nt);status(!labelInfo(text)?"Note placed.":!q?"Label placed outside the map; labels must sit inside a polygon.":!walkable(q)?"Label placed, but on a door, lift, liquid or damage floor; Extraction needs normal floor.":`${text} placed in polygon ${doc.polys.indexOf(q)}.`);
  }
});
canvas.addEventListener("pointermove",e=>{
  if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
  if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()];const d=hyp(a.x,a.y,b.x,b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    view.scale=clamp(pinch.scale*d/pinch.d,2/WU,400/WU);
    view.cx=pinch.c.x-(mid.x-pinch.mid.x)/view.scale;view.cy=pinch.c.y-(mid.y-pinch.mid.y)/view.scale;updateStatus();redraw();return;}
  const sx=e.offsetX,sy=e.offsetY,w=toW(sx,sy);cursorW=w;
  if(drag){
    if(drag.type==="pan"){view.cx=drag.cx-(sx-drag.sx)/view.scale;view.cy=drag.cy-(sy-drag.sy)/view.scale;}
    else if(drag.type==="move"){
      let dx=w.x-drag.start.x,dy=w.y-drag.start.y;
      if(!drag.moved&&Math.hypot(dx,dy)*view.scale<3){return;}
      if(!drag.moved){pushUndo();drag.moved=true;}
      if(drag.kind==="point"){const t=snapPoint(w,drag.anchor);dx=t.x-drag.orig[0].x;dy=t.y-drag.orig[0].y;}
      else if(opts.snap&&drag.kind!=="note"){const g=drag.kind==="obj"?64:opts.grid;dx=Math.round(dx/g)*g;dy=Math.round(dy/g)*g;}
      drag.movers.forEach((m,i)=>{m.x=Math.round(drag.orig[i].x+dx);m.y=Math.round(drag.orig[i].y+dy);});
      refreshInspectorValues();
    } else if(drag.type==="rect"){const t=snapPoint(w);drag.cur={x:t.x,y:t.y};}
    else if(drag.type==="face"){const o=drag.obj;const d=hyp(o.x,o.y,w.x,w.y);if(d*view.scale>10){o.facing=Math.round(Math.atan2(w.y-o.y,w.x-o.x)*180/Math.PI/15)*15;o.facing=(o.facing+360)%360;refreshInspectorValues();}}
  } else if(tool==="select"&&!isTouch){const h=hitTest(sx,sy);const nh=h?h.item:null;if(nh!==hover){hover=nh;}}
  updateStatus();redraw();
});
function endPointer(e){
  pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;
  if(!drag)return;const d=drag;drag=null;
  if(d.type==="move"&&d.moved){
    if(d.kind==="point"){const t=snapPoint(cursorW,d.anchor);if(t.pt){mergePoint(d.anchor,t.pt);setSel("point",[t.pt]);status("Points merged.");}}
    changed();
  } else if(d.type==="rect"){
    const a=d.start,b=d.cur;const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);
    if(x1-x0<64||y1-y0<64){redraw();return;}
    const cs=[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
    if(doc.polys.some(p=>convexOverlap(cs,p.verts))){status("That room would overlap an existing polygon. Rooms may touch but not overlap.");redraw();return;}
    pushUndo();const q=makePolygonFromCoords(cs,null);
    if(q){if(!neighborPoly(q.verts)||true){} for(const p of [...doc.polys])if(p.verts.length>8)splitPolygon(p);setSel("poly",[q]);status(`Room added: ${((x1-x0)/WU).toFixed(2)} × ${((y1-y0)/WU).toFixed(2)} WU.`);}
    changed();
  } else if(d.type==="face"){changed();}
  redraw();
}
canvas.addEventListener("pointerup",endPointer);canvas.addEventListener("pointercancel",endPointer);
canvas.addEventListener("pointerleave",()=>{if(hover){hover=null;redraw();}});
canvas.addEventListener("contextmenu",e=>e.preventDefault());
canvas.addEventListener("dblclick",()=>{if(tool==="line"&&chain.length){chain=[];status("Line finished.");redraw();}});
canvas.addEventListener("wheel",e=>{e.preventDefault();
  if(e.shiftKey){view.cx+=e.deltaY/view.scale;redraw();return;}
  const before=toW(e.offsetX,e.offsetY);const f=Math.exp(-e.deltaY*(e.ctrlKey?0.01:0.0015));
  view.scale=clamp(view.scale*f,2/WU,400/WU);const after=toW(e.offsetX,e.offsetY);view.cx+=before.x-after.x;view.cy+=before.y-after.y;updateStatus();redraw();},{passive:false});
function zoomBy(f){view.scale=clamp(view.scale*f,2/WU,400/WU);updateStatus();redraw();}
function fitView(){
  const vs=doc.pts.length?doc.pts:[{x:-4*WU,y:-4*WU},{x:4*WU,y:4*WU}];
  const xs=vs.map(v=>v.x),ys=vs.map(v=>v.y);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  view.cx=(x0+x1)/2;view.cy=(y0+y1)/2;view.scale=clamp(Math.min((W-80)/Math.max(x1-x0,WU),(H-80)/Math.max(y1-y0,WU)),2/WU,120/WU);updateStatus();redraw();}

document.addEventListener("keydown",e=>{
  if(!document.getElementById("modal").hidden||view3d)return;
  const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"))return;
  const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
  if(mod&&k==="z"){e.preventDefault();e.shiftKey?redo():undo();return;}
  if(mod&&k==="y"){e.preventDefault();redo();return;}
  if(mod&&k==="s"){e.preventDefault();saveProject();return;}
  if(mod&&k==="a"){e.preventDefault();setSel("poly",[...doc.polys]);return;}
  if(mod)return;
  if(k===" "){spaceDown=true;canvas.style.cursor="grab";e.preventDefault();return;}
  const tmap={v:"select",l:"line",r:"rect",f:"fill",o:"object",n:"note",h:"pan"};
  if(tmap[k]){setTool(tmap[k]);return;}
  if(k==="escape"||k==="enter"){if(chain.length){chain=[];status("Line finished.");redraw();}else setSel(null,[]);return;}
  if(k==="delete"||k==="backspace"){e.preventDefault();deleteSelection(e.shiftKey);return;}
  if(k==="g"){opts.snap=!opts.snap;savePrefs();renderOptbar();status(opts.snap?"Snap to grid on.":"Snap to grid off.");redraw();return;}
  if(["1","2","3","4","5","6"].includes(k)){setViewMode(["draw","tex","floor","ceil","light","type"][+k-1]);return;}
  if(k==="0"){fitView();return;}
  if(k==="="||k==="+"){zoomBy(1.25);return;}if(k==="-"){zoomBy(0.8);return;}
  if(k==="tab"){e.preventDefault();open3D();return;}
  if(k==="p"){paletteShown=true;open3D();return;}
  if(k==="["||k==="]"){if(sel.kind==="poly"){pushUndo();const d=(k==="]"?1:-1)*(e.shiftKey?WU/8:WU/4);sel.items.forEach(q=>{if(e.altKey)q.ceil+=d;else q.floor+=d;});changed();status(`${e.altKey?"Ceiling":"Floor"} ${d>0?"raised":"lowered"} by ${Math.abs(d/WU)} WU.`);}return;}
});
document.addEventListener("keyup",e=>{if(e.key===" "){spaceDown=false;canvas.style.cursor="";}});

function deleteSelection(withEdges){
  if(!sel.kind||!sel.items.length)return;pushUndo();
  const n=sel.items.length;
  if(sel.kind==="poly")sel.items.forEach(q=>deletePoly(q,withEdges));
  else if(sel.kind==="line")sel.items.forEach(deleteLine);
  else if(sel.kind==="point")sel.items.forEach(deletePoint);
  else if(sel.kind==="obj")doc.objs=doc.objs.filter(o=>!sel.items.includes(o));
  else if(sel.kind==="note")doc.notes=doc.notes.filter(o=>!sel.items.includes(o));
  status(`Deleted ${n} ${sel.kind==="obj"?"object":sel.kind==="poly"?"polygon":sel.kind==="note"?"note":sel.kind}${n>1?"s":""}.`);
  setSel(null,[]);changed();
}

// =============================================================== UI chrome
const $=id=>document.getElementById(id);
const ICONS={
  select:'<path d="M5 3l12 9-5.5 1L9 19z"/>',
  line:'<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M6.5 16.5L17.5 7.5"/>',
  rect:'<rect x="4" y="5" width="16" height="13"/><path d="M4 9h16" stroke-dasharray="2 2"/>',
  fill:'<path d="M4 18l7-12 7 12z"/><path d="M8 15h8M10 12h4"/>',
  object:'<path d="M12 3l7 9-7 9-7-9z"/>',
  note:'<path d="M4 5h16v10H10l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  pan:'<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  zin:'<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20M8.5 11h5M11 8.5v5"/>',
  zout:'<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5L20 20M8.5 11h5"/>'};
const TOOLS=[["select","Select & move","V"],["line","Draw lines","L"],["rect","Room (rectangle)","R"],["fill","Fill polygon","F"],["object","Place object","O"],["note","Labels & notes","N"],["pan","Pan","H"]];
function renderTools(){
  const el=$("tools");el.innerHTML="";
  for(const [id,label,k] of TOOLS){const b=document.createElement("button");b.className="tool";b.title=`${label} (${k})`;b.setAttribute("aria-label",label);b.setAttribute("aria-pressed",tool===id);
    b.innerHTML=`<svg viewBox="0 0 24 24">${ICONS[id]}</svg><span class="k">${k}</span>`;b.onclick=()=>setTool(id);el.appendChild(b);}
  el.appendChild(document.createElement("hr"));
  for(const [id,label,fn] of [["zin","Zoom in",()=>zoomBy(1.3)],["zout","Zoom out",()=>zoomBy(1/1.3)],["fit","Fit level (0)",fitView]]){
    const b=document.createElement("button");b.className="tool";b.title=label;b.setAttribute("aria-label",label);b.innerHTML=`<svg viewBox="0 0 24 24">${ICONS[id]}</svg>`;b.onclick=fn;el.appendChild(b);}
}
const HINTS={
  select:"Click to select. Drag points, polygons or objects to move them. Shift-click adds polygons. Drag empty space to pan. [ ] nudge floor, Alt+[ ] ceiling.",
  line:"Click to place corners. Lines snap to points and the grid and split existing lines. Close a loop to fill it.",
  rect:"Drag to draw a rectangular room. Rooms that touch share walls automatically and become doorways.",
  fill:"Click inside a closed loop of lines to turn it into a polygon.",
  object:"Click inside a polygon to place the object chosen above. Drag while placing to set its facing.",
  note:"Click to place the label or note chosen above; drag a note to move it. Extraction labels go inside ordinary walkable floor.",
  pan:"Drag to move around. Scroll or pinch to zoom."};
function setTool(t){tool=t;chain=[];renderTools();renderOptbar();$("hint").textContent=HINTS[t];canvas.style.cursor=t==="pan"?"grab":t==="select"?"default":"crosshair";redraw();}
function setViewMode(m){opts.viewMode=m;renderOptbar();renderLegend();redraw();}
function sel_(id,options,value,onchange){const s=document.createElement("select");s.id=id;for(const [v,l] of options){const o=document.createElement("option");o.value=v;o.textContent=l;s.appendChild(o);}s.value=String(value);s.onchange=()=>onchange(s.value);return s;}
function renderOptbar(){
  const el=$("optbar");el.innerHTML="";
  const vm=document.createElement("div");vm.className="viewmodes";vm.setAttribute("role","group");vm.setAttribute("aria-label","Map view");
  for(const [m,l] of [["draw","Draw"],["tex","Texture"],["floor","Floor"],["ceil","Ceiling"],["light","Light"],["type","Type"]]){const b=document.createElement("button");b.textContent=l;b.title=`${l} view`;b.setAttribute("aria-pressed",opts.viewMode===m);b.onclick=()=>setViewMode(m);vm.appendChild(b);}
  el.appendChild(vm);
  const grid=document.createElement("label");grid.innerHTML='<span class="lbl">Grid</span>';grid.appendChild(sel_("optGrid",GRIDS,opts.grid,v=>{opts.grid=+v;savePrefs();redraw();}));el.appendChild(grid);
  const sn=document.createElement("label");sn.innerHTML=`<input type="checkbox" id="optSnap" ${opts.snap?"checked":""}> Snap`;sn.querySelector("input").onchange=e=>{opts.snap=e.target.checked;savePrefs();};el.appendChild(sn);
  const sv=document.createElement("label");sv.innerHTML=`<input type="checkbox" id="optVals" ${opts.showValues?"checked":""}> Values`;sv.querySelector("input").onchange=e=>{opts.showValues=e.target.checked;savePrefs();redraw();};el.appendChild(sv);
  if(tool==="line"){const af=document.createElement("label");af.innerHTML=`<input type="checkbox" id="optAuto" ${opts.autoFill?"checked":""}> Fill closed loops`;af.querySelector("input").onchange=e=>{opts.autoFill=e.target.checked;savePrefs();};el.appendChild(af);}
  if(tool==="rect"||tool==="fill"||tool==="line"){
    for(const [key,lab] of [["newFloor","Floor"],["newCeil","Ceiling"]]){const l=document.createElement("label");l.innerHTML=`<span class="lbl">${lab}</span>`;const i=document.createElement("input");i.type="number";i.step="0.125";i.id="opt"+key;i.value=(opts[key]/WU).toFixed(3);i.title=`New ${lab.toLowerCase()} height in world units (rooms touching another copy its heights)`;i.onchange=()=>{opts[key]=Math.round(parseFloat(i.value||0)*WU);};l.appendChild(i);el.appendChild(l);}
  }
  if(tool==="object"){
    const k=document.createElement("label");k.innerHTML='<span class="lbl">Place</span>';k.appendChild(sel_("optKind",OBJ_KINDS,opts.objKind,v=>{opts.objKind=+v;renderOptbar();}));el.appendChild(k);
    if(opts.objKind===0){el.appendChild(sel_("optMon",MONSTERS.map(([,n],i)=>[i,n]),opts.objSub,v=>opts.objSub=+v));}
    if(opts.objKind===2){el.appendChild(sel_("optItem",ITEMS.map(([,n],i)=>[i,n]),opts.objItem,v=>opts.objItem=+v));}
  }
  if(tool==="note"){
    if(opts.noteText==null)opts.noteText="EXTRACT";
    const lab=document.createElement("label");lab.innerHTML='<span class="lbl">Place</span>';
    const ch=document.createElement("div");ch.className="labelchips";
    for(const [t,d,c] of LABELS){const b=document.createElement("button");b.textContent=t;b.title=d;b.style.setProperty("--lc",c);b.setAttribute("aria-pressed",opts.noteText===t);b.onclick=()=>{opts.noteText=t;renderOptbar();};ch.appendChild(b);}
    lab.appendChild(ch);el.appendChild(lab);
    const tl=document.createElement("label");tl.innerHTML='<span class="lbl">Text</span>';const ti=document.createElement("input");ti.id="optNote";ti.maxLength=63;ti.value=opts.noteText;ti.placeholder="Label or note";ti.style.width="150px";ti.oninput=()=>{opts.noteText=ti.value;ch.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.textContent===ti.value.trim()));};tl.appendChild(ti);el.appendChild(tl);
  }
}
function renderLegend(){
  const el=$("legend");
  if(opts.viewMode==="floor"||opts.viewMode==="ceil"){const [lo,hi]=heightRange(opts.viewMode==="ceil"?"ceil":"floor");
    el.hidden=false;el.innerHTML=`<span>${fmt(lo)}</span><canvas width="120" height="10"></canvas><span>${fmt(hi)} WU</span>`;
    const c=el.querySelector("canvas").getContext("2d");for(let x=0;x<120;x++){c.fillStyle=heightColor(lo+(hi-lo)*x/119,lo,hi);c.fillRect(x,0,1,10);}}
  else if(opts.viewMode==="light"){el.hidden=false;el.innerHTML=`<span>0%</span><canvas width="120" height="10"></canvas><span>100% light</span>`;const c=el.querySelector("canvas").getContext("2d");for(let x=0;x<120;x++){const v=Math.round(25+x/119*210);c.fillStyle=`rgb(${v},${v},${v})`;c.fillRect(x,0,1,10);}}
  else el.hidden=true;
}
function updateStatus(){
  $("sCursor").textContent=`x ${(cursorW.x/WU).toFixed(3)} · y ${(cursorW.y/WU).toFixed(3)}`;
  $("sZoom").textContent=`${(view.scale*WU).toFixed(0)} px/WU`;
  $("sCounts").textContent=`${doc.polys.length} polygons · ${doc.lines.length} lines · ${doc.objs.length} objects`;
}
let msgTimer=null;function status(m){$("sMsg").textContent=m;}
function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,3200);}

// --------------------------------------------------------------- side panel
let tab="inspect";
function setTab(t){tab=t;for(const [id,k] of [["tInspect","inspect"],["tLevel","level"],["tLevels","levels"],["tIssues","issues"]])$(id).setAttribute("aria-selected",tab===k);renderPane();}
function setSel(kind,items){sel={kind:items.length?kind:null,items};if(tab!=="inspect"&&items.length)tab="inspect",setTab("inspect");else renderPane();redraw();}
function changed(){
  {const bg=$("brandGame");if(bg)bg.textContent=GAMES[doc.info.game].short.toUpperCase()+" MAP · "+envName(doc.info.game,doc.info.env).toUpperCase();}
  issues=validate();
  const errs=issues.filter(i=>i.lv==="error").length,warns=issues.length-errs;
  const c=$("issueCount");c.textContent=errs||warns||"✓";c.className="count"+(errs?"":warns?" w":" z");
  // drop selection items that no longer exist
  if(sel.kind){const pool=sel.kind==="poly"?doc.polys:sel.kind==="line"?doc.lines:sel.kind==="point"?doc.pts:sel.kind==="note"?(doc.notes||[]):doc.objs;sel.items=sel.items.filter(x=>pool.includes(x));if(!sel.items.length)sel.kind=null;}
  remapPolyRefs();syncLevel();saveScenarioSoon();
  renderPane();renderLegend();updateStatus();redraw();
  $("bUndo").disabled=!undoStack.length;$("bRedo").disabled=!redoStack.length;
}
function field(label,input,unit){const f=document.createElement("label");f.className="field";const s=document.createElement("span");s.textContent=label;f.appendChild(s);
  if(unit){const w=document.createElement("div");w.className="unit";w.appendChild(input);const em=document.createElement("em");em.textContent=unit;w.appendChild(em);f.appendChild(w);}else f.appendChild(input);return f;}
function numInput(id,value,step,onchange){const i=document.createElement("input");i.type="number";i.id=id;i.step=step;i.value=value;i.onchange=()=>onchange(parseFloat(i.value));return i;}
function wuInput(id,getv,setv){return numInput(id,(getv()/WU).toFixed(3),"0.125",v=>{if(!isFinite(v))return;pushUndo();setv(Math.round(v*WU));changed();});}
function selectInput(id,options,value,onchange){return sel_(id,options,value,v=>{pushUndo();onchange(v);changed();});}
function group(title){const g=document.createElement("div");g.className="group";if(title){const h=document.createElement("div");h.className="glabel";h.textContent=title;g.appendChild(h);}return g;}
function checks(list,value,onchange,idp){const d=document.createElement("div");d.className="checks";for(const [bit,l] of list){const lab=document.createElement("label");const i=document.createElement("input");i.type="checkbox";i.id=idp+bit;i.checked=!!(value&bit);i.onchange=()=>{pushUndo();onchange(i.checked?value|bit:value&~bit);value=i.checked?value|bit:value&~bit;changed();};lab.appendChild(i);lab.append(" "+l);d.appendChild(lab);}return d;}
function button(label,fn,cls){const b=document.createElement("button");b.className="btn "+(cls||"");b.textContent=label;b.onclick=fn;return b;}
function renderPane(){
  const p=$("pane");p.innerHTML="";
  if(tab==="level")return renderLevel(p);
  if(tab==="levels")return renderLevels(p);
  if(tab==="issues")return renderIssues(p);
  const h=document.createElement("h3");p.appendChild(h);
  if(!sel.kind){h.innerHTML=`Nothing selected`;
    const n=document.createElement("p");n.className="note";n.textContent="Select a polygon, line, point or object to edit it. Heights are in world units (WU): 1 WU is about a doorway's width, and a player stands about 0.8 WU tall.";p.appendChild(n);
    const g=group("Quick start");
    for(const [l,t] of [["Draw a room","rect"],["Draw lines","line"],["Place objects","object"]])g.appendChild(button(l,()=>setTool(t)));
    g.appendChild(button("Generate a level…",openGenerate,"primary"));
    p.appendChild(g);
    const k=group("Shortcuts");const n2=document.createElement("p");n2.className="note";n2.innerHTML="V select · L lines · R room · F fill · O objects · N labels · H pan<br>1–6 view modes · G snap · 0 fit · Tab 3D view · P paint in 3D<br>Delete removes · Shift+Delete removes a room and its walls<br>Ctrl+Z undo · Ctrl+Shift+Z redo · Ctrl+A select all";k.appendChild(n2);p.appendChild(k);
    return;}
  const items=sel.items,one=items[0];
  if(sel.kind==="poly"){
    const idx=doc.polys.indexOf(one);
    h.innerHTML=items.length>1?`${items.length} polygons <small>edits apply to all</small>`:`Polygon ${idx} <small>${one.verts.length} corners · ${(Math.abs(signedArea(one.verts))/WU/WU).toFixed(2)} WU²</small>`;
    const all=(fn)=>{items.forEach(fn);};
    const g=group("Heights");
    g.appendChild(field("Floor",wuInput("pFloor",()=>one.floor,v=>all(q=>q.floor=v)),"WU"));
    g.appendChild(field("Ceiling",wuInput("pCeil",()=>one.ceil,v=>all(q=>q.ceil=v)),"WU"));
    const hr=document.createElement("p");hr.className="note";hr.id="pHead";hr.textContent=`Headroom ${fmt(one.ceil-one.floor)} WU`;g.appendChild(hr);p.appendChild(g);
    const g2=group("Properties");
    g2.appendChild(field("Type",selectInput("pType",POLY_TYPES,one.type,v=>all(q=>{q.type=+v;if(q.type===5&&!q.plat)q.plat=PLAT_DEFAULT();}))));
    if(PERM_LABEL[one.type])g2.appendChild(field(PERM_LABEL[one.type],numInput("pPerm",one.perm,"1",v=>{pushUndo();all(q=>q.perm=v|0);changed();})));
    g2.appendChild(field("Light",numInput("pLight",one.light,"5",v=>{pushUndo();all(q=>{q.light=clamp(Math.round(v),0,100);clearPolyLightIdx(q);});changed();}),"%"));
    p.appendChild(g2);
    if(one.type===5)platformSection(items,one,p);
    else{const gd=group();gd.appendChild(button("Make it a door or lift",()=>{pushUndo();items.forEach(q=>{q.type=5;q.plat=PLAT_DEFAULT();});changed();}));p.appendChild(gd);}
    liquidSection(items,one,p);
    const g3=group("Textures · "+envName(doc.info.game,doc.info.env));
    g3.appendChild(texField("Floor","pFt",one.ftex,v=>all(q=>q.ftex=v)));
    g3.appendChild(texField("Ceiling","pCt",one.ctex,v=>all(q=>q.ctex=v)));
    g3.appendChild(texField("Walls","pWt",one.wtex,v=>all(q=>q.wtex=v)));
    const painted=items.reduce((n,q)=>n+q.verts.filter((v,k)=>sideGet(v,q.verts[(k+1)%q.verts.length])).length,0);
    const tn=document.createElement("p");tn.className="note";tn.textContent=(realTextures()?"":"Load your Shapes file to see the real textures. ")+(painted?`${painted} wall${painted>1?"s were":" was"} painted in 3D and keep${painted>1?"":"s"} its own texture.`:"Paint individual walls in the 3D view (P).");g3.appendChild(tn);
    const tr=document.createElement("div");tr.className="row";
    if(painted)tr.appendChild(button("Clear painted walls",()=>{pushUndo();items.forEach(q=>q.verts.forEach((v,k)=>doc.sides.delete(sideKey(v,q.verts[(k+1)%q.verts.length]))));changed();}));
    tr.appendChild(button("Paint in 3D",()=>{paletteShown=true;open3D();}));g3.appendChild(tr);p.appendChild(g3);
    const g4=group("Actions");const r=document.createElement("div");r.className="row";
    r.appendChild(button("Match neighbor heights",()=>{const nb=doc.polys.find(q=>!items.includes(q)&&one.verts.some((v,i)=>polyHasEdge(q,v,one.verts[(i+1)%one.verts.length])));if(!nb){status("No neighbouring polygon.");return;}pushUndo();all(q=>{q.floor=nb.floor;q.ceil=nb.ceil;});changed();}));
    if(items.some(q=>q.verts.length>8))r.appendChild(button("Split",()=>{pushUndo();items.forEach(splitPolygon);changed();}));
    r.appendChild(button("Delete",()=>deleteSelection(false)));r.appendChild(button("Delete with walls",()=>deleteSelection(true)));
    g4.appendChild(r);p.appendChild(g4);
  } else if(sel.kind==="line"){
    const ow=lineOwners(one);
    h.innerHTML=items.length>1?`${items.length} lines`:`Line <small>${(hyp(one.a.x,one.a.y,one.b.x,one.b.y)/WU).toFixed(3)} WU long</small>`;
    const g=group();
    const n=document.createElement("p");n.className="note";n.textContent=ow.length===0?"Not part of any polygon; it will be left out of the exported map.":ow.length===1?"An outer wall. Walls with one polygon are always solid.":`Between polygons ${ow.map(q=>doc.polys.indexOf(q)).join(" and ")}. Players can walk through unless you make it solid.`;g.appendChild(n);
    if(ow.length===2){const lab=document.createElement("label");lab.className="checks";const i=document.createElement("input");i.type="checkbox";i.id="lSolid";i.checked=items.every(l=>l.solid);i.onchange=()=>{pushUndo();items.forEach(l=>l.solid=i.checked);changed();};lab.appendChild(i);lab.append(" Solid (invisible barrier)");g.appendChild(lab);}
    const r=document.createElement("div");r.className="row";
    r.appendChild(button("Split at middle",()=>{pushUndo();items.forEach(l=>splitLine(l,Math.round((l.a.x+l.b.x)/2),Math.round((l.a.y+l.b.y)/2)));changed();}));
    r.appendChild(button("Delete",()=>deleteSelection(false)));g.appendChild(r);p.appendChild(g);
  } else if(sel.kind==="point"){
    h.innerHTML=items.length>1?`${items.length} points`:`Point`;
    const g=group();
    g.appendChild(field("X",numInput("ptX",(one.x/WU).toFixed(3),"0.125",v=>{if(!isFinite(v))return;pushUndo();one.x=Math.round(v*WU);changed();}),"WU"));
    g.appendChild(field("Y",numInput("ptY",(one.y/WU).toFixed(3),"0.125",v=>{if(!isFinite(v))return;pushUndo();one.y=Math.round(v*WU);changed();}),"WU"));
    const n=document.createElement("p");n.className="note";n.textContent="Drag a point onto another to merge them.";g.appendChild(n);
    g.appendChild(button("Delete point",()=>deleteSelection(false)));p.appendChild(g);
  } else if(sel.kind==="obj"){
    h.innerHTML=items.length>1?`${items.length} objects`:`${KIND_NAME[one.kind]}`;
    const g=group();
    g.appendChild(field("Kind",selectInput("oKind",OBJ_KINDS,one.kind,v=>items.forEach(o=>{o.kind=+v;o.sub=+v===0?8:+v===2?5:0;}))));
    if(one.kind===0)g.appendChild(field("Monster",selectInput("oMon",MONSTERS.map(([,n],i)=>[i,n]),one.sub,v=>items.forEach(o=>o.sub=+v))));
    else if(one.kind===2)g.appendChild(field("Item",selectInput("oItem",ITEMS.map(([,n],i)=>[i,n]),one.sub,v=>items.forEach(o=>o.sub=+v))));
    else if(one.kind===3)g.appendChild(field("Team",numInput("oTeam",one.sub,"1",v=>{pushUndo();items.forEach(o=>o.sub=clamp(v|0,0,7));changed();})));
    else g.appendChild(field("Index",numInput("oIdx",one.sub,"1",v=>{pushUndo();items.forEach(o=>o.sub=v|0);changed();})));
    g.appendChild(field("Facing",numInput("oFace",one.facing,"15",v=>{pushUndo();items.forEach(o=>o.facing=((Math.round(v)%360)+360)%360);changed();}),"°"));
    g.appendChild(field("Height",numInput("oZ",(one.z/WU).toFixed(3),"0.125",v=>{pushUndo();items.forEach(o=>o.z=Math.round(v*WU));changed();}),"WU above floor"));
    g.appendChild(field("X",numInput("oX",(one.x/WU).toFixed(3),"0.125",v=>{pushUndo();one.x=Math.round(v*WU);changed();}),"WU"));
    g.appendChild(field("Y",numInput("oY",(one.y/WU).toFixed(3),"0.125",v=>{pushUndo();one.y=Math.round(v*WU);changed();}),"WU"));
    p.appendChild(g);
    if(one.kind===0){const g2=group("Monster flags");g2.appendChild(checks(MON_FLAGS,one.flags,v=>items.forEach(o=>o.flags=v),"oF"));p.appendChild(g2);}
    const g3=group();g3.appendChild(button("Delete",()=>deleteSelection(false)));p.appendChild(g3);
  } else if(sel.kind==="note"){
    const li=labelInfo(one.text);
    h.innerHTML=items.length>1?`${items.length} notes`:li?`Label <small></small>`:`Map note <small>shown on the in-game map</small>`;if(li&&items.length===1)h.querySelector("small").textContent=li[1];
    const g=group();
    const ti=document.createElement("input");ti.id="nText";ti.maxLength=63;ti.value=one.text;ti.onchange=()=>{pushUndo();items.forEach(n=>n.text=ti.value.slice(0,63));changed();};
    g.appendChild(field("Text",ti));
    const ch=document.createElement("div");ch.className="labelchips";
    for(const [t,d,c] of LABELS){const b=document.createElement("button");b.textContent=t;b.title=d;b.style.setProperty("--lc",c);b.setAttribute("aria-pressed",one.text.trim()===t);b.onclick=()=>{pushUndo();items.forEach(n=>n.text=t);changed();};ch.appendChild(b);}
    g.appendChild(ch);
    const wn=document.createElement("p");wn.className="note";wn.id="nWhere";wn.textContent=noteWhere(one);g.appendChild(wn);
    g.appendChild(field("X",numInput("nX",(one.x/WU).toFixed(3),"0.125",v=>{if(!isFinite(v))return;pushUndo();one.x=Math.round(v*WU);changed();}),"WU"));
    g.appendChild(field("Y",numInput("nY",(one.y/WU).toFixed(3),"0.125",v=>{if(!isFinite(v))return;pushUndo();one.y=Math.round(v*WU);changed();}),"WU"));
    const r=document.createElement("div");r.className="row";
    const q=polyAtPoint(one);if(q&&items.length===1)r.appendChild(button("Centre in polygon",()=>{pushUndo();const c=centroid(q.verts);one.x=Math.round(c.x);one.y=Math.round(c.y);changed();}));
    r.appendChild(button("Delete",()=>deleteSelection(false)));g.appendChild(r);p.appendChild(g);
  }
}
function noteWhere(nt){const q=polyAtPoint(nt),li=labelInfo(nt.text);
  if(!q)return li?"Outside the map. Labels must sit inside the polygon they refer to.":"Outside the map.";
  const i=doc.polys.indexOf(q);if(!li)return `In polygon ${i}.`;
  return walkable(q)?`In polygon ${i}, ordinary floor. Extraction reads it from there.`:`In polygon ${i}, which is a ${q.type===5?"door or lift":q.media?"liquid":"damage floor"}. Move it onto normal floor.`;}
function refreshInspectorValues(){
  if(tab!=="inspect"||!sel.items.length)return;const o=sel.items[0];
  const set=(id,v)=>{const e=$(id);if(e&&document.activeElement!==e)e.value=v;};
  if(sel.kind==="point"){set("ptX",(o.x/WU).toFixed(3));set("ptY",(o.y/WU).toFixed(3));}
  if(sel.kind==="obj"){set("oX",(o.x/WU).toFixed(3));set("oY",(o.y/WU).toFixed(3));set("oFace",o.facing);}
  if(sel.kind==="note"){set("nX",(o.x/WU).toFixed(3));set("nY",(o.y/WU).toFixed(3));const w=$("nWhere");if(w)w.textContent=noteWhere(o);}
}
function renderLevel(p){
  const i=doc.info;
  const h=document.createElement("h3");h.innerHTML=`Level <small></small>`;h.querySelector("small").textContent=GAMES[i.game].short+" · "+envName(i.game,i.env);p.appendChild(h);
  const g=group();
  const nm=document.createElement("input");nm.id="lvName";nm.maxLength=60;nm.value=i.name;nm.onchange=()=>{pushUndo();i.name=nm.value.slice(0,60)||"Untitled Level";changed();};
  g.appendChild(field("Name",nm));
  g.appendChild(field("Game",selectInput("lvGame",GAME_IDS.map(k=>[k,GAMES[k].name]),i.game,v=>{const was=i.game;i.game=v;if(v==="m1"&&was!=="m1")i.envFlags|=M1_FLAGS;if(v!=="m1"&&was==="m1")i.envFlags&=~M1_FLAGS;if(!envOptions(v).some(o=>o[0]===i.env))i.env=envOptions(v)[0][0];patternCache.clear();})));
  g.appendChild(field("Environment",selectInput("lvEnv",envOptions(i.game),i.env,v=>{i.env=+v;patternCache.clear();})));
  const gn=document.createElement("p");gn.className="note";gn.textContent=GAMES[i.game].note;g.appendChild(gn);
  g.appendChild(field("Landscape",selectInput("lvLand",LANDSCAPES.map((n,k)=>[k,n]),i.landscape,v=>i.landscape=+v)));
  p.appendChild(g);
  const g2=group("Game types");g2.appendChild(checks(GAME_TYPES,i.entry,v=>i.entry=v,"gt"));p.appendChild(g2);
  const g3=group("Environment");g3.appendChild(checks(ENV_FLAGS,i.envFlags,v=>i.envFlags=v,"ef"));p.appendChild(g3);
  if(i.game==="m1"){const g6=group("Marathon 1 compatibility");g6.appendChild(checks(M1_COMPAT,i.envFlags,v=>i.envFlags=v,"m1f"));const n6=document.createElement("p");n6.className="note";n6.textContent="These make Aleph One behave like the original Marathon for this level. Activation range and weapons are on by default.";g6.appendChild(n6);p.appendChild(g6);}
  const g4=group("Mission");g4.appendChild(checks(MISSIONS,i.mission,v=>i.mission=v,"ms"));p.appendChild(g4);
  extractionSection(p);
  levelExtras(p);
  const g5=group("About export");const n=document.createElement("p");n.className="note";
  n.innerHTML="Export writes a map file (<b>.sceA</b>) inside a zip, for this level or the whole scenario (Levels tab). Put it in the scenario's folder in place of <b>Map.sceA</b>, keeping a copy of the original.";
  g5.appendChild(n);p.appendChild(g5);
}
function extractionSection(p){
  const i=doc.info,g=group("Extraction mode");
  const cw=document.createElement("div");cw.className="checks";const lab=document.createElement("label");const cb=document.createElement("input");cb.type="checkbox";cb.id="lvExtract";cb.checked=!!i.extraction;
  cb.onchange=()=>{pushUndo();i.extraction=cb.checked;if(cb.checked)i.entry|=2;changed();};lab.appendChild(cb);lab.append(" Check against the Extraction map rules");cw.appendChild(lab);g.appendChild(cw);
  const counts=LABELS.map(([t,,c])=>[t,c,(doc.notes||[]).filter(n=>{const li=labelInfo(n.text);return li&&li[0]===t;}).length]);
  const ch=document.createElement("div");ch.className="labelchips";for(const [t,c,n] of counts){const b=document.createElement("button");b.style.setProperty("--lc",c);b.textContent=`${t} ${n}`;b.title=`Place ${t} labels with the Labels tool`;b.onclick=()=>{opts.noteText=t;setTool("note");};ch.appendChild(b);}g.appendChild(ch);
  const gen=(doc.notes||[]).find(isGenNote);
  const n=document.createElement("p");n.className="note";n.textContent=(gen?gen.text.trim()+". ":"")+"Labels are map notes the Extraction script reads: place them with the Labels tool (N). The checks also run whenever a label is on the map.";g.appendChild(n);
  const r=document.createElement("div");r.className="row";
  r.appendChild(button("Place missing labels",()=>{if(!startPolys().length){toast("Place a player start first; labels are placed by walking distance from it.");return;}pushUndo();const k=autoLabels({full:true,seed:Date.now()&0xffff});changed();toast(k?`Placed ${k} label${k>1?"s":""}. Move or delete any you don't want.`:"Nothing to add: every label type is already on the map, or there's no free walkable room left.");}));
  g.appendChild(r);p.appendChild(g);
}
function renderIssues(p){
  const errs=issues.filter(i=>i.lv==="error"),warns=issues.filter(i=>i.lv!=="error");
  const h=document.createElement("h3");h.innerHTML=`Checks <small>${errs.length} errors · ${warns.length} warnings</small>`;p.appendChild(h);
  if(!issues.length){const e=document.createElement("div");e.className="empty";e.textContent="No problems found. This level is ready to export.";p.appendChild(e);return;}
  const n=document.createElement("p");n.className="note";n.textContent="Errors block export because Aleph One would refuse or crash on them. Click a row to select the problem on the map.";p.appendChild(n);
  for(const it of [...errs,...warns]){
    const b=document.createElement("div");b.className="issue"+(it.lv==="error"?"":" warn");b.tabIndex=0;b.setAttribute("role","button");
    b.innerHTML=`<i></i><div><b></b><span></span></div>`;b.querySelector("b").textContent=it.title;b.querySelector("span").textContent=it.detail||"";
    if(it.fix){const fb=button(it.fix.label,ev=>{ev.stopPropagation();pushUndo();it.fix.fn();changed();status(`Fixed: ${it.title}.`);});b.appendChild(fb);}
    const go=()=>{if(it.target){sel={kind:it.target.kind,items:it.target.items};focusOn(it.target.items);redraw();}};
    b.onclick=go;b.onkeydown=e=>{if(e.key==="Enter")go();};
    p.appendChild(b);}
}
function focusOn(items){const vs=items.flatMap(x=>x.verts?x.verts:x.a?[x.a,x.b]:[x]);if(!vs.length)return;const c=centroid(vs);view.cx=c.x;view.cy=c.y;if(view.scale*WU<30)view.scale=40/WU;redraw();}

// =============================================================== modal helpers
function openModal(title,bodyEl,footerBtns,o={}){
  const d=$("dialog");d.innerHTML="";d.classList.toggle("wide",!!o.wide);const hd=document.createElement("header");const h=document.createElement("h2");h.textContent=title;hd.appendChild(h);
  const x=button("Close",closeModal);hd.appendChild(x);d.appendChild(hd);
  const b=document.createElement("div");b.className="body";b.appendChild(bodyEl);d.appendChild(b);
  if(footerBtns&&footerBtns.length){const f=document.createElement("footer");footerBtns.forEach(x=>f.appendChild(x));d.appendChild(f);}
  $("modal").hidden=false;
}
function closeModal(){$("modal").hidden=true;if(genCtl){genCtl.abort();genCtl=null;}}
$("modal").addEventListener("pointerdown",e=>{if(e.target.id==="modal")closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("modal").hidden)closeModal();});
function confirmBox(title,msg,okLabel,fn){const p=document.createElement("p");p.className="note";p.style.fontSize="13px";p.textContent=msg;openModal(title,p,[button("Cancel",closeModal),button(okLabel,()=>{closeModal();fn();},"primary")]);}

// =============================================================== file actions
let downloads=null,sampleFn=null;
(async()=>{try{if(window.claude&&window.claude.use){downloads=await window.claude.use("downloads");}}catch(e){}})();
(async()=>{try{if(window.claude&&window.claude.use){sampleFn=await window.claude.use("sample");}}catch(e){}})();
// ---- AI through the user's own API key (web and desktop builds, where claude.ai's runtime isn't there).
// Two providers: Claude (Anthropic) and Gemini (Google, which has a free tier). Keys are kept in this browser's
// storage on this device and are only ever sent to that provider's API.
const AI_PROVIDERS={
  gemini:{name:"Gemini",long:"Gemini (Google)",keyStore:"forge-gemini-key",modelStore:"forge-gemini-model",hint:"AIza…",
    models:[["gemini-3.8-flash","Gemini 3.8 Flash (free tier, recommended)"],["gemini-3.5-flash-lite","Gemini 3.5 Flash-Lite (free tier, fastest)"],["gemini-4-argon","Gemini 4 Argon (paid only, best)"]],
    help:`Get a key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com</a> (Get API key). Gemini has a free tier with daily limits. On the free tier, Google may use what you send to improve its products.`},
  anthropic:{name:"Claude",long:"Claude (Anthropic)",keyStore:"forge-anthropic-key",modelStore:"forge-anthropic-model",hint:"sk-ant-…",
    models:[["claude-sonnet-5-5","Sonnet 5.5 (recommended)"],["claude-opus-5-5","Opus 5.5 (best, costs more)"],["claude-haiku-5-5","Haiku 5.5 (fastest, cheapest)"]],
    help:`Get a key at <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener">platform.claude.com</a> (API keys). API use is billed by Anthropic, separately from a Claude subscription.`}};
const AI_PROVIDER_STORE="forge-ai-provider";
const lsGet=k=>{try{return localStorage.getItem(k)||"";}catch(e){return "";}};
const lsSet=(k,v)=>{try{if(v)localStorage.setItem(k,v);else localStorage.removeItem(k);}catch(e){}};
// Default provider: what the user picked; else Claude if they already saved a Claude key; else Gemini (free tier).
const aiProvider=()=>{const p=lsGet(AI_PROVIDER_STORE);if(AI_PROVIDERS[p])return p;return lsGet(AI_PROVIDERS.anthropic.keyStore)?"anthropic":"gemini";};
const aiKey=(p=aiProvider())=>lsGet(AI_PROVIDERS[p].keyStore);
const aiModel=(p=aiProvider())=>{const P=AI_PROVIDERS[p],m=lsGet(P.modelStore);return P.models.some(x=>x[0]===m)?m:P.models[0][0];};
const aiName=()=>sampleFn?"Claude":AI_PROVIDERS[aiProvider()].name;
async function apiFetch(url,init){
  try{return await fetch(url,init);}
  catch(e){if(e&&e.name==="AbortError")throw {code:"cancelled"};throw {code:"network",message:"Couldn't reach the AI service. Check your internet connection."};}
}
async function readSSE(res,onEvent){ // calls onEvent(parsed JSON) for each "data:" line of a server-sent event stream
  const reader=res.body.getReader(),dec=new TextDecoder();let buf="";
  try{for(;;){const {done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});
    let i;while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!line.startsWith("data:"))continue;
      let ev;try{ev=JSON.parse(line.slice(5));}catch(e){continue;}onEvent(ev);}}}
  catch(e){if(e&&e.name==="AbortError")throw {code:"cancelled"};throw e;}
}
async function anthropicSample(prompt,{signal,onText}){
  const res=await apiFetch("https://api.anthropic.com/v1/messages",{method:"POST",signal,
    headers:{"content-type":"application/json","x-api-key":aiKey("anthropic"),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:aiModel("anthropic"),max_tokens:16000,stream:true,messages:[{role:"user",content:prompt}]})});
  if(!res.ok){let m="";try{const j=await res.json();m=(j&&j.error&&j.error.message)||"";}catch(e){}
    if(res.status===401)throw {code:"bad_key",message:"Anthropic didn't accept the API key. Check it with the API key button."};
    if(res.status===429)throw {code:"rate_limited"};
    if(res.status>=500)throw {code:"overloaded",message:"Anthropic's API is busy right now. Try again in a minute."};
    throw {code:"api_error",message:"The API refused the request"+(m?": "+m:".")};}
  let text="";
  await readSSE(res,ev=>{
    if(ev.type==="content_block_delta"&&ev.delta&&ev.delta.type==="text_delta"){text+=ev.delta.text;if(onText)onText({text});}
    else if(ev.type==="error")throw {code:"api_error",message:(ev.error&&ev.error.message)||"The API stopped with an error."};});
  return {text};
}
async function geminiSample(prompt,{signal,onText}){
  const model=aiModel("gemini");
  const res=await apiFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,{method:"POST",signal,
    headers:{"content-type":"application/json","x-goog-api-key":aiKey("gemini")},
    body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:32768,responseMimeType:"application/json"}})});
  if(!res.ok){let m="";try{const j=await res.json();m=(j&&j.error&&j.error.message)||"";}catch(e){}
    if(res.status===401||res.status===403||/API key/i.test(m))throw {code:"bad_key",message:"Google didn't accept the Gemini API key. Check it with the API key button."};
    if(res.status===429)throw {code:"rate_limited",message:"Gemini's usage limit was reached (the free tier has daily limits). Try again later, or pick another Gemini model."};
    if(res.status>=500)throw {code:"overloaded",message:"Gemini is busy right now. Try again in a minute."};
    throw {code:"api_error",message:"Gemini refused the request"+(m?": "+m:".")};}
  let text="";
  await readSSE(res,ev=>{
    if(ev.error)throw {code:"api_error",message:ev.error.message||"Gemini stopped with an error."};
    for(const c of ev.candidates||[])for(const part of (c.content&&c.content.parts)||[])
      if(typeof part.text==="string"&&!part.thought){text+=part.text;if(onText)onText({text});}});
  return {text};
}
// same shape as claude.ai's sample(): resolves {text}, rejects {code,message}
const apiSample=(prompt,opts={})=>aiProvider()==="gemini"?geminiSample(prompt,opts):anthropicSample(prompt,opts);
const getSampler=()=>sampleFn||(!inClaude()&&aiKey()?apiSample:null);
function openApiKey(after){
  let prov=aiProvider();
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="12px";
  const top=document.createElement("p");top.className="note";top.textContent="Generating levels outside claude.ai uses your own API key, from Google (Gemini) or Anthropic (Claude).";body.appendChild(top);
  const provSel=sel_("apiProvider",Object.entries(AI_PROVIDERS).map(([k,P])=>[k,P.long]),prov,v=>{prov=v;fill();});
  body.appendChild(field("Use",provSel));
  const help=document.createElement("p");help.className="note";body.appendChild(help);
  const key=document.createElement("input");key.type="password";key.id="apiKeyIn";key.autocomplete="off";key.spellcheck=false;
  body.appendChild(field("API key",key));
  const modelBox=document.createElement("div");body.appendChild(modelBox);
  const priv=document.createElement("p");priv.className="note";priv.textContent="Keys are saved only in this browser on this device, and Forge only sends each key to its own service.";body.appendChild(priv);
  function fill(){const P=AI_PROVIDERS[prov];help.innerHTML=P.help;key.placeholder=P.hint;key.value=aiKey(prov);
    modelBox.replaceChildren(field("Model",sel_("apiModelIn",P.models,aiModel(prov),()=>{})));}
  fill();
  const btns=[];
  btns.push(button("Remove key",()=>{lsSet(AI_PROVIDERS[prov].keyStore,"");closeModal();toast(`${AI_PROVIDERS[prov].name} key removed from this browser.`);if(after)after();}));
  btns.push(button("Cancel",()=>{closeModal();if(after)after();}));
  btns.push(button("Save",()=>{const v=key.value.trim();if(!v){key.focus();return;}const P=AI_PROVIDERS[prov];
    lsSet(P.keyStore,v);lsSet(P.modelStore,$("apiModelIn").value);lsSet(AI_PROVIDER_STORE,prov);closeModal();toast(`${P.name} key saved in this browser.`);if(after)after();},"primary"));
  openModal("AI API key",body,btns);setTimeout(()=>key.focus(),50);
}
// Where saves go: inside claude.ai the artifact runtime's "downloads" capability; anywhere else
// (the web build, the desktop app) a normal browser download.
const inClaude=()=>!!(window.claude&&window.claude.use);
function browserDownload(filename,data){
  const blob=data instanceof Blob?data:new Blob([typeof data==="string"?new TextEncoder().encode(data):data],{type:"application/octet-stream"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);toast(`Saved ${filename}.`);return true;}
async function offerFile(filename,data){
  if(!downloads){if(!inClaude())return browserDownload(filename,data);toast("Saving files isn't available in this view. Open the page in claude.ai to download.");return false;}
  try{await downloads.save({filename,data});toast(`Saved ${filename}.`);return true;}
  catch(e){if(e&&e.code==="declined")status("Download cancelled.");else toast("Couldn't save the file"+(e&&e.message?": "+e.message:"."));return false;}
}
$("fileIn").addEventListener("change",async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  try{await openFileBuffer(await f.arrayBuffer(),f.name);}catch(err){toast("Couldn't open that file: "+err.message);}
});

// =============================================================== generate dialog
let genCtl=null;let genSeed=Math.floor(Math.random()*9000)+1000;
const IDEAS=["A flooded pump station with a sunken central chamber and catwalks around it","Small carnage arena: a ring corridor around a raised king-of-the-hill platform","Pfhor ship interior: long spine corridor, cargo bays off both sides, a bridge at the end","Lava refinery with a winding staircase climbing past dangerous pits","Jjaro ruin: symmetrical halls around a tall atrium, quiet and dimly lit"];
function openGenerate(){
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="12px";
  body.innerHTML=`<p class="note">Describe the level you want. ${aiName()} lays out rooms, heights, lighting, monsters and items, and the result lands on the map ready to edit. Rooms come out as rectangles; reshape them afterwards with the editing tools.</p>
  <textarea id="genPrompt" placeholder="e.g. A three-floor reactor core with stairs spiralling up the outside walls"></textarea>
  <div class="chips" id="genIdeas"></div>
  <div class="row" style="gap:14px;align-items:center">
    <label class="checks"><span class="lbl note">Size</span> <select id="genSize"><option value="small">Small</option><option value="medium" selected>Medium</option><option value="large">Large</option></select></label>
    <label class="checks"><span class="note">Mode</span> <select id="genMode"><option value="solo">Solo / co-op</option><option value="extraction">Extraction (co-op)</option><option value="carnage">Carnage</option></select></label>
    <label class="checks"><input type="checkbox" id="genAdd"> Add to the current map</label>
  </div>
  <div class="genout" id="genOut" hidden></div>`;
  const ideas=body.querySelector("#genIdeas");IDEAS.forEach(t=>{const b=document.createElement("button");b.textContent=t.length>48?t.slice(0,46)+"…":t;b.title=t;b.onclick=()=>{body.querySelector("#genPrompt").value=t;};ideas.appendChild(b);});
  const go=button(`Generate with ${aiName()}`,()=>runAI(go,stop),"primary");
  const stop=button("Stop",()=>{if(genCtl)genCtl.abort();});stop.hidden=true;
  const rnd=button(`Random layout`,()=>{const size=$("genSize").value,mode=$("genMode").value,add=$("genAdd").checked;const spec=randomSpec(genSeed++,size,mode);applySpec(spec,add,`Random layout #${genSeed-1}`);});
  if(!getSampler()){go.disabled=true;go.title=inClaude()?"Claude isn't reachable from this view.":"Add an API key first.";
    if(!inClaude()){const o=body.querySelector("#genOut");o.hidden=false;o.textContent="AI generation needs an API key: add a free Gemini key or a Claude key with the API key button, or use the claude.ai version of Forge. Random layout works without either.";}}
  const keyBtn=inClaude()?null:button(aiKey()?`${AI_PROVIDERS[aiProvider()].name} key ✓`:"Add API key",()=>{const p=$("genPrompt").value;openApiKey(()=>{openGenerate();$("genPrompt").value=p;});});
  if(keyBtn)keyBtn.id="genKey";
  openModal("Generate a level",body,[...(keyBtn?[keyBtn]:[]),rnd,stop,go]);
  setTimeout(()=>$("genPrompt")&&$("genPrompt").focus(),50);
}
function applySpec(spec,add,label){
  pushUndo();
  const rep=buildFromSpec(spec,{replace:!add});
  if(spec.mode==="extraction"){ // MAP_CONVENTIONS: co-op starts, labels, GEN line
    doc.info.extraction=true;doc.info.entry|=2;addCoopStarts(4);
    const seed=Number.isInteger(spec.seed)?spec.seed:genSeed++;
    rep.labels=autoLabels({full:true,seed});setGenNote(seed,spec.size||"medium",spec.seed==null?" src=ai":"");}
  closeModal();afterLoad();changed();fitView();
  toast(`${label}: ${rep.rooms} rooms, ${rep.objects} objects${spec.mode==="extraction"?`, ${(doc.notes||[]).filter(n=>parseLabel(n.text)).length} labels`:""} placed${rep.skipped.length?`, ${rep.skipped.length} skipped`:""}. Ctrl+Z undoes.`);
  status(rep.skipped.length?`Skipped rooms: ${rep.skipped.slice(0,6).join(", ")}${rep.skipped.length>6?"…":""}`:(spec.notes||"Generated."));
}
function aiPrompt(desc,size,mode,add){
  const counts={small:"6 to 12",medium:"12 to 25",large:"25 to 45"}[size];
  let existing="";
  if(add&&doc.polys.length){existing="\n\nThe map already has these occupied areas (axis-aligned bounding boxes in WU; x,y = top-left). New rooms MUST NOT overlap them, and should connect by sharing an edge with one of them:\n"+
    doc.polys.slice(0,80).map((q,i)=>{const xs=q.verts.map(v=>v.x/WU),ys=q.verts.map(v=>v.y/WU);const x=Math.min(...xs),y=Math.min(...ys);return `E${i}: x=${x.toFixed(2)} y=${y.toFixed(2)} w=${(Math.max(...xs)-x).toFixed(2)} h=${(Math.max(...ys)-y).toFixed(2)} floor=${fmt(q.floor)} ceiling=${fmt(q.ceil)}`;}).join("\n");}
  return `You are a level designer for Marathon 2 / Marathon Infinity (played in the Aleph One engine). Design a level as a set of axis-aligned rectangular rooms on a 2D floor plan with floor and ceiling heights.

Level request: ${desc||"A varied, fun level with height changes."}
Game mode: ${mode==="carnage"?"Carnage (deathmatch): several player starts spread out, weapons and ammo, no monsters":mode==="extraction"?"Co-op Extraction: 4 player starts together in one safe starting room with no monsters in it; monsters spread through the rest of the level; some weapons, ammo and shields. The squad fights its way out to an extraction point far from the start":"Solo/co-op: one player start, monsters to fight, weapons, ammo and shields"}.
Size: ${counts} rooms (corridors and stair steps count as rooms).${existing}

Units are world units (WU). 1 WU is about a doorway's width; a player is 0.8 WU tall and can step up at most 0.25 WU between neighbouring floors. y grows downward (south). Every coordinate, width, height and floor/ceiling value must be a multiple of 0.25.

Rules:
- Each room is a rectangle {x, y, w, h} where x,y is its top-left corner. Keep everything within -26..26 on both axes.
- Rooms must never overlap. Rooms connect only where they share part of an edge (touching edges become openings). Leave gaps between rooms you don't want connected.
- Corridors are narrow rooms (width 1 to 2). Build stairs as a row of small rooms each rising 0.25 (e.g. 0.5 deep each).
- Ceilings must be at least 1 WU above floors where the player walks. Big halls can have tall ceilings (3 to 5).
- Raised ledges more than 0.25 above a neighbour can only be reached by stairs; use that for interesting verticality.
- light is 0-100 percent. Vary it for mood.
- type is one of: normal, minor_ouch, major_ouch, hill, base, goal, glue, superglue, exit, zone_border, item_impassable, monster_impassable. Use minor_ouch/major_ouch for lava or acid pits (lower floor than surroundings).
- Objects go in rooms using dx, dy (0..1 relative position in the room). facing is degrees clockwise from east.
- Monster "what" values: ${MONSTERS.map(m=>m[0]).join(", ")}.
- Item "what" values: ${ITEMS.map(m=>m[0]).join(", ")}.${mode==="extraction"?`
- Also give "labels": map labels the Extraction mode reads. Each is {text, room, dx, dy}. text is one of: EXTRACT (possible extraction point; give at least 2, in rooms far from the start by walking distance and far apart from each other), LOOT (loot cache, several side rooms), LOOT FAR (high-tier loot, 1 or 2 hard-to-reach rooms), CHIP (data chip, 1 or 2 rooms), SPAWN (monster wave spawn, 2 to 4 open rooms away from the start), NOSPAWN (the start room). Labels must be in normal-floor rooms (not minor_ouch/major_ouch), and every labelled room must be reachable on foot from the start.`:""}

Reply with JSON only, no commentary, in exactly this shape:
{"name":"Level name (max 40 chars)","environment":"${envOptions(doc.info.game).map(o=>["water","lava","sewage","jjaro","pfhor"][o[0]]).join("|")}","landscape":"day|night|moon|space","mode":"${mode}","notes":"one sentence describing the layout",
 "rooms":[{"id":"A","x":0,"y":0,"w":6,"h":4,"floor":0,"ceiling":2,"light":80,"type":"normal"}],
 "objects":[{"kind":"player|monster|item","what":"FighterMinor","room":"A","dx":0.5,"dy":0.5,"facing":90}]${mode==="extraction"?`,
 "labels":[{"text":"EXTRACT","room":"A","dx":0.5,"dy":0.5}]`:""}}`;
}
async function runAI(go,stop){
  const desc=$("genPrompt").value.trim()+(doc.info.game!=="inf"?` (This is a ${GAMES[doc.info.game].name} level.)`:""),size=$("genSize").value,mode=$("genMode").value,add=$("genAdd").checked;
  const out=$("genOut");out.hidden=false;out.textContent="Thinking… (larger levels can take a minute)";
  go.disabled=true;stop.hidden=false;genCtl=new AbortController();
  try{
    const res=await getSampler()(aiPrompt(desc,size,mode,add),{modelTier:"default",signal:genCtl.signal,cache:false,
      onText:({text})=>{const rooms=(text.match(/"id"\s*:/g)||[]).length;out.textContent=`Laying out rooms… ${rooms} so far\n\n`+text.slice(-600);}});
    let t=res.text.trim().replace(/^```(json)?/i,"").replace(/```$/,"");const a=t.indexOf("{"),b=t.lastIndexOf("}");
    const spec=JSON.parse(t.slice(a,b+1));
    if(!spec.rooms||!spec.rooms.length)throw {code:"empty",message:"The answer had no rooms."};
    spec.mode=mode;spec.size=size;delete spec.seed;
    applySpec(spec,add,`“${spec.name||"Generated level"}”`);
  }catch(e){
    const code=e&&e.code;
    const msg=code==="cancelled"?"Stopped.":code==="not_granted"?"Claude wasn't allowed to run. Allow it when asked to generate levels.":code==="rate_limited"?(e.message||"Too many requests right now. Wait a moment and try again."):e instanceof SyntaxError?`${aiName()}'s answer wasn't valid level data. Try again or simplify the description.`:(e&&e.message)||"Generation failed.";
    if($("genOut"))$("genOut").textContent=msg;
  }finally{genCtl=null;if(go.isConnected){go.disabled=false;stop.hidden=true;}}
}

// =============================================================== Shapes files (real textures)
// The user's own Shapes files are decoded in the browser and remembered in IndexedDB; nothing is uploaded.
const shapeStore={}; // game -> {name,size,parsed}
const texCache=new Map();
function crc16mb(u){let c=0;for(let i=0;i<124;i++){let d=u[i]<<8;for(let j=0;j<8;j++){c=((d^c)&0x8000)?((c<<1)^0x1021)&0xffff:(c<<1)&0xffff;d=(d<<1)&0xffff;}}return c;}
function isResourceFork(buf){if(buf.byteLength<256)return false;const dv=new DataView(buf);const dOff=dv.getUint32(0),mOff=dv.getUint32(4),dLen=dv.getUint32(8),mLen=dv.getUint32(12);
  return dOff>=16&&mOff>=dOff+dLen&&dOff+dLen<=buf.byteLength&&mOff+mLen<=buf.byteLength&&mLen>=28&&mOff+mLen>=buf.byteLength-512;}
function unwrapMacFile(buf){
  const u=new Uint8Array(buf),dv=new DataView(buf);
  if(u.length>26){const m=dv.getUint32(0);if(m===0x00051600||m===0x00051607){ // AppleSingle / AppleDouble
    const n=dv.getUint16(24);let data=null,rsrc=null;
    for(let i=0;i<n;i++){const id=dv.getUint32(26+i*12),off=dv.getUint32(30+i*12),len=dv.getUint32(34+i*12);if(id===1&&len)data=buf.slice(off,off+len);if(id===2&&len)rsrc=buf.slice(off,off+len);}
    return {data,rsrc,wrap:"AppleSingle"};}}
  if(u.length>128&&u[0]===0&&u[1]>0&&u[1]<64&&u[74]===0&&u[82]===0){ // MacBinary
    const dl=dv.getUint32(83),rl=dv.getUint32(87);const crcOk=((u[124]<<8)|u[125])===crc16mb(u);
    if((crcOk||u[122]>=0x81||true)&&128+dl<=u.length&&dl+rl>0){const rStart=128+Math.ceil(dl/128)*128;
      if(rl===0||rStart+rl<=u.length)return {data:dl?buf.slice(128,128+dl):null,rsrc:rl?buf.slice(rStart,rStart+rl):null,wrap:"MacBinary"};}}
  if(isResourceFork(buf))return {data:null,rsrc:buf,wrap:"resource fork"};
  return {data:buf,rsrc:null,wrap:null};
}
function readResources(buf,type){
  const dv=new DataView(buf);const dOff=dv.getUint32(0),mOff=dv.getUint32(4);const tl=mOff+dv.getUint16(mOff+24);const nT=dv.getInt16(tl)+1;const out=new Map();
  for(let i=0;i<nT&&i<200;i++){const e=tl+2+i*8;const t=String.fromCharCode(...new Uint8Array(buf,e,4));if(t!==type)continue;
    const cnt=dv.getInt16(e+4)+1,ref=tl+dv.getUint16(e+6);
    for(let j=0;j<cnt;j++){const r=ref+j*12;const id=dv.getInt16(r);const off=dv.getUint32(r+4)&0xffffff;const at=dOff+off;const len=dv.getUint32(at);out.set(id,buf.slice(at+4,at+4+len));}}
  return out;
}
function parseShapesFile(buf){
  const {data,rsrc,wrap}=unwrapMacFile(buf);
  if(rsrc){const res=readResources(rsrc,".256");if(res.size){const cols=[];for(const [id,b] of res){const ci=id-128;if(ci>=0&&ci<32)cols[ci]={buf:b,off:0,m1:true};}
    return finishParse({format:"Marathon 1 (resource fork"+(wrap&&wrap!=="resource fork"?", "+wrap:"")+")",cols});}}
  if(!data)throw new Error("No Shapes data was found in that file.");
  if(data.byteLength<1024)throw new Error("That file is too small to be a Shapes file.");
  const dv=new DataView(data);const cols=[];
  for(let i=0;i<32;i++){const h=i*32;const off=dv.getInt32(h+4),off16=dv.getInt32(h+12);const o=off>0?off:off16>0?off16:-1;if(o>=1024&&o<data.byteLength-40)cols[i]={buf:data,off:o,m1:false};}
  return finishParse({format:"Marathon 2 / Infinity"+(wrap?" ("+wrap+")":""),cols});
}
function finishParse(p){
  let walls=0;
  p.cols.forEach((c,i)=>{if(!c)return;try{const d=decodeCollection(c);if(d.type===1&&i>=17&&i<=21&&d.count>0)walls++;}catch(e){p.cols[i]=null;}});
  if(!p.cols.some(Boolean))throw new Error("That doesn't look like a Shapes file.");
  if(!walls)throw new Error("That Shapes file has no wall textures in it.");
  p.wallSets=walls;return p;
}
function decodeCollection(c){
  if(c.dec)return c.dec;
  const dv=new DataView(c.buf),o=c.off;
  const g16=k=>dv.getInt16(o+k),g32=k=>dv.getInt32(o+k);
  const version=g16(0),type=g16(2),colorCount=g16(6),clutCount=g16(8),ctOff=g32(10),llCount=g16(20),llOff=g32(22),bmCount=g16(26),bmOff=g32(28);
  if(colorCount<0||colorCount>256||clutCount<0||clutCount>64||bmCount<0||bmCount>1024||llCount<0||llCount>2048)throw new Error("bad collection");
  const cluts=[];
  for(let t=0;t<clutCount;t++){const tab=new Uint8Array(256*4);for(let j=0;j<colorCount;j++){const p=o+ctOff+(t*colorCount+j)*8;tab[j*4]=dv.getUint8(p+2);tab[j*4+1]=dv.getUint8(p+4);tab[j*4+2]=dv.getUint8(p+6);tab[j*4+3]=255;}cluts.push(tab);}
  const ll=[];for(let i=0;i<llCount;i++){const p=o+dv.getInt32(o+llOff+i*4);ll.push(dv.getInt16(p+6));}
  const bmOffs=[];for(let i=0;i<bmCount;i++)bmOffs.push(o+dv.getInt32(o+bmOff+i*4));
  c.dec={version,type,cluts,ll,bmOffs,count:type===1?(llCount||bmCount):bmCount,bitmaps:[]};
  return c.dec;
}
function decodeBitmap(c,i){
  const d=decodeCollection(c);if(d.bitmaps[i])return d.bitmaps[i];
  const dv=new DataView(c.buf),u=new Uint8Array(c.buf);let p=d.bmOffs[i];
  const w=dv.getInt16(p),h=dv.getInt16(p+2),bpr=dv.getInt16(p+4),flags=dv.getUint16(p+6);
  if(w<=0||h<=0||w>2048||h>2048)throw new Error("bad bitmap");
  const colOrder=!!(flags&0x8000),rows=colOrder?w:h,len=colOrder?h:w;
  let q=p+10+16+(rows+1)*4;const pix=new Uint8Array(w*h);
  const put=colOrder?(r,k,v)=>{pix[k*w+r]=v;}:(r,k,v)=>{pix[r*w+k]=v;};
  if(bpr===-1){
    if(c.m1){for(let r=0;r<rows;r++){let k=0;for(let guard=0;guard<4096;guard++){const op=dv.getInt16(q);q+=2;if(op>0){for(let j=0;j<op&&k<len;j++)put(r,k++,u[q+j]);q+=op;}else if(op<0)k-=op;else break;}}}
    else{for(let r=0;r<rows;r++){const first=dv.getInt16(q),last=dv.getInt16(q+2);q+=4;for(let k=first;k<last;k++)put(r,k,u[q++]);}}
  } else {for(let r=0;r<rows;r++)for(let k=0;k<len;k++)put(r,k,u[q+r*bpr+k]);}
  d.bitmaps[i]={w,h,pix};return d.bitmaps[i];
}
function shapesFor(game){
  if(shapeStore[game])return {st:shapeStore[game],game};
  if(game==="m2"&&shapeStore.inf)return {st:shapeStore.inf,game:"inf",fallback:true};
  if(game==="inf"&&shapeStore.m2)return {st:shapeStore.m2,game:"m2",fallback:true};
  return null;
}
function shapeCanvas(game,colIdx,shapeIdx,clut=0){
  const key=game+":"+colIdx+":"+shapeIdx+":"+clut;if(texCache.has(key))return texCache.get(key);
  let cv=null;
  try{const st=shapeStore[game];const c=st&&st.parsed.cols[colIdx];if(c){const d=decodeCollection(c);
    let bi=shapeIdx;if(d.type===1&&d.ll.length&&shapeIdx<d.ll.length)bi=d.ll[shapeIdx];
    if(bi>=0&&bi<d.bmOffs.length){const bm=decodeBitmap(c,bi);const tab=d.cluts[clut]||d.cluts[0];
      cv=document.createElement("canvas");cv.width=bm.w;cv.height=bm.h;const g=cv.getContext("2d");const img=g.createImageData(bm.w,bm.h);
      for(let k=0;k<bm.pix.length;k++){const ci=bm.pix[k]*4;img.data[k*4]=tab[ci];img.data[k*4+1]=tab[ci+1];img.data[k*4+2]=tab[ci+2];img.data[k*4+3]=255;}
      g.putImageData(img,0,0);}}}catch(e){cv=null;}
  texCache.set(key,cv);return cv;
}
function proceduralTex(bitmap,envIdx){
  const key="proc:"+envIdx+":"+bitmap;if(texCache.has(key))return texCache.get(key);
  const env=ENVS[envIdx]||ENVS[0];const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");
  const R=mulberry(bitmap*97+env.col*1000);const tint=[0,1,2].map(k=>clamp(env.wall[k]+Math.round((R()-.5)*60),20,235));
  g.fillStyle=`rgb(${tint})`;g.fillRect(0,0,64,64);
  for(let i=0;i<500;i++){const v=(R()-.5)*26;g.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)/255})`;g.fillRect(Math.floor(R()*64),Math.floor(R()*64),2,2);}
  g.strokeStyle="rgba(0,0,0,.45)";g.lineWidth=2;const style=bitmap%5;
  if(style===0){g.strokeRect(1,1,62,62);g.beginPath();g.moveTo(0,40);g.lineTo(64,40);g.stroke();}
  else if(style===1){for(let x=0;x<64;x+=16){g.beginPath();g.moveTo(x,0);g.lineTo(x,64);g.stroke();}}
  else if(style===2){g.strokeRect(6,6,52,30);g.fillStyle=`rgb(${env.panel})`;g.fillRect(10,44,44,6);}
  else if(style===3){for(let y=0;y<64;y+=8){g.beginPath();g.moveTo(0,y);g.lineTo(64,y);g.stroke();}}
  else{g.strokeRect(1,1,62,62);g.beginPath();g.moveTo(32,0);g.lineTo(32,64);g.moveTo(0,32);g.lineTo(64,32);g.stroke();}
  g.fillStyle="rgba(255,255,255,.85)";g.font="bold 13px monospace";g.fillText(String(bitmap),4,60);
  texCache.set(key,c);return c;
}
// texture for the current level: real if a Shapes file is loaded, otherwise a numbered stand-in
function texCanvasFor(bitmap,col,clut){const s=shapesFor(doc.info.game);if(s){const cv=shapeCanvas(s.game,col??(17+doc.info.env),bitmap,clut|0);if(cv)return cv;}return proceduralTex(bitmap+(col!=null?1000*col:0),doc.info.env);}
function texCount(){const s=shapesFor(doc.info.game);if(s){const c=s.st.parsed.cols[17+doc.info.env];if(c){try{return decodeCollection(c).count;}catch(e){}}}return 30;}
function realTextures(){return !!shapesFor(doc.info.game);}
// IndexedDB storage for Shapes files
const idb={db:null,
  open(){if(this.p)return this.p;this.p=new Promise(res=>{try{const r=indexedDB.open("forge-remake",1);r.onupgradeneeded=()=>r.result.createObjectStore("shapes");r.onsuccess=()=>{this.db=r.result;res(true);};r.onerror=()=>res(false);r.onblocked=()=>res(false);}catch(e){res(false);}});return this.p;},
  async run(mode,fn){if(!(await this.open())||!this.db)return null;return new Promise(res=>{try{const tx=this.db.transaction("shapes",mode);const st=tx.objectStore("shapes");const r=fn(st);tx.oncomplete=()=>res(r&&"result" in r?r.result:true);tx.onerror=()=>res(null);tx.onabort=()=>res(null);}catch(e){res(null);}});},
  put(k,v){return this.run("readwrite",s=>s.put(v,k));},get(k){return this.run("readonly",s=>s.get(k));},del(k){return this.run("readwrite",s=>s.delete(k));}};
async function installShapes(game,name,buf,persist){
  const parsed=parseShapesFile(buf);
  shapeStore[game]={name,size:buf.byteLength,parsed};
  for(const k of [...texCache.keys()])if(k.startsWith(game+":"))texCache.delete(k);
  let saved=true;if(persist)saved=!!(await idb.put(game,{name,buf}));
  refreshShapesUI();return {parsed,saved};
}
async function removeShapes(game){delete shapeStore[game];for(const k of [...texCache.keys()])if(k.startsWith(game+":"))texCache.delete(k);await idb.del(game);refreshShapesUI();}
async function restoreShapes(){for(const g of GAME_IDS){try{const rec=await idb.get(g);if(rec&&rec.buf)await installShapes(g,rec.name,rec.buf,false);}catch(e){}}}
function refreshShapesUI(){window.dispatchEvent(new Event("forge-shapes"));const n=GAME_IDS.filter(g=>shapeStore[g]).length;const b=$("bShapes");if(b)b.textContent=`Shapes ${n}/3`;patternCache.clear();renderPane();redraw();}
const fmtMB=n=>(n/1048576).toFixed(1)+" MB";
function openShapesDialog(first){
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="12px";
  const intro=document.createElement("p");intro.className="note";intro.style.fontSize="13px";
  intro.textContent=(first?"Welcome. ":"")+"Load the Shapes file for each game you make maps for, and walls, floors and ceilings show the game's real textures in the 2D map, the texture picker and the 3D view. Files stay in this browser; nothing is uploaded.";
  body.appendChild(intro);
  const where=document.createElement("p");where.className="note";
  where.innerHTML="Look in each game's data folder from the free Aleph One downloads: <b>Shapes.shpA</b> for Durandal and Infinity, <b>Shapes</b> for Marathon. Original Mac files work too, including MacBinary (.bin) and AppleSingle copies.";
  body.appendChild(where);
  const list=document.createElement("div");list.style.display="flex";list.style.flexDirection="column";list.style.gap="8px";body.appendChild(list);
  function render(){list.innerHTML="";for(const g of GAME_IDS){const st=shapeStore[g];
    const row=document.createElement("div");row.className="issue"+(st?" ok":" warn");row.style.cursor="default";row.style.gridTemplateColumns="8px minmax(0,1fr) auto";
    const bar=document.createElement("i");bar.style.background=st?"var(--ok)":"var(--line)";row.appendChild(bar);
    const txt=document.createElement("div");const b=document.createElement("b");b.textContent=GAMES[g].name;const sp=document.createElement("span");
    sp.textContent=st?`${st.name} · ${fmtMB(st.size)} · ${st.parsed.wallSets} wall sets`:(g==="m2"&&shapeStore.inf?"Not loaded. Using Infinity's textures for now.":g==="inf"&&shapeStore.m2?"Not loaded. Using Durandal's textures for now.":"Not loaded");
    txt.appendChild(b);txt.appendChild(sp);row.appendChild(txt);
    const btns=document.createElement("div");btns.className="row";
    const inp=document.createElement("input");inp.type="file";inp.hidden=true;inp.id="shp_"+g;
    inp.onchange=async()=>{const f=inp.files[0];inp.value="";if(!f)return;sp.textContent="Reading…";
      try{const buf=await f.arrayBuffer();const r=await installShapes(g,f.name,buf,true);status(`Loaded ${GAMES[g].short} Shapes: ${r.parsed.format}.`);if(!r.saved)toast("Loaded, but this browser won't keep it after you close the page.");}
      catch(e){toast(`Couldn't read ${f.name}: ${e.message}`);}render();};
    btns.appendChild(inp);
    btns.appendChild(button(st?"Replace…":"Choose file…",()=>inp.click(),st?"":"primary"));
    if(st)btns.appendChild(button("Remove",async()=>{await removeShapes(g);render();}));
    row.appendChild(btns);list.appendChild(row);}}
  render();
  const done=()=>{try{localStorage.setItem("forge-remake-setup","1");}catch(e){}closeModal();};
  openModal(first?"Set up your Shapes files":"Shapes files",body,first?[button("Add later",()=>{done();toast("You can load Shapes files any time from the Shapes button.");}),button("Done",done,"primary")]:[button("Done",done,"primary")]);
}
// texture picker (grid of thumbnails)
function thumb(bitmap,size=40){const c=document.createElement("canvas");c.width=c.height=size;const g=c.getContext("2d");g.imageSmoothingEnabled=false;const src=texCanvasFor(bitmap);g.drawImage(src,0,0,size,size);return c;}
function openTexturePicker(title,current,onPick){
  const body=document.createElement("div");
  const n=texCount();
  const note=document.createElement("p");note.className="note";note.textContent=realTextures()?`${n} textures in the ${ENVS[doc.info.env].name} set of ${GAMES[shapesFor(doc.info.game).game].short}.`:"Showing numbered stand-ins. Load your Shapes file to see the real textures.";
  body.appendChild(note);
  const grid=document.createElement("div");grid.style.display="grid";grid.style.gridTemplateColumns="repeat(auto-fill,minmax(64px,1fr))";grid.style.gap="6px";grid.style.marginTop="8px";
  for(let i=0;i<n;i++){const sp=texSpecial(i);const b=document.createElement("button");b.className="texbtn"+(i===current?" on":"");b.title=`Texture ${i}`+(sp?` (${sp}; the generator skips it)`:"");b.appendChild(thumb(i,56));const s=document.createElement("span");s.textContent=sp?`${i} · ${sp}`:i;if(sp)s.className="sp";b.appendChild(s);
    b.onclick=()=>{closeModal();onPick(i);};grid.appendChild(b);}
  body.appendChild(grid);
  openModal(title,body,[]);
}
function texField(label,id,value,onPick){
  const b=document.createElement("button");b.className="texpick";b.id=id;b.type="button";b.appendChild(thumb(value,28));const s=document.createElement("span");s.textContent=`Texture ${value}`;b.appendChild(s);
  b.onclick=()=>openTexturePicker(label,value,v=>{pushUndo();onPick(v);changed();});
  return field(label,b);
}
const patternCache=new Map();
function texPattern(bitmap){if(patternCache.has(bitmap))return patternCache.get(bitmap);const cv=texCanvasFor(bitmap);const p=ctx.createPattern(cv,"repeat");patternCache.set(bitmap,{p,w:cv.width});return patternCache.get(bitmap);}

// =============================================================== new level dialog
function openNewLevel(){
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="12px";
  let game=doc.info.game||"inf",env=0;
  const nm=document.createElement("input");nm.id="nlName";nm.value="Untitled Level";nm.maxLength=60;
  body.appendChild(field("Name",nm));
  const gl=document.createElement("div");gl.className="glabel";gl.textContent="Game";body.appendChild(gl);
  const cards=document.createElement("div");cards.className="gamecards";body.appendChild(cards);
  const envRow=document.createElement("div");body.appendChild(envRow);
  const preview=document.createElement("div");preview.className="row";body.appendChild(preview);
  function render(){
    cards.innerHTML="";for(const g of GAME_IDS){const c=document.createElement("button");c.type="button";c.className="gamecard";c.setAttribute("aria-pressed",g===game);
      const sh=shapesFor(g);c.innerHTML=`<b></b><span></span><em></em>`;c.querySelector("b").textContent=GAMES[g].name;c.querySelector("span").textContent=GAMES[g].note;
      c.querySelector("em").textContent=sh?(sh.fallback?"Textures: "+GAMES[sh.game].short+" Shapes":"Textures loaded"):"No Shapes file yet";c.onclick=()=>{game=g;render();};cards.appendChild(c);}
    envRow.innerHTML="";envRow.appendChild(field("Environment",sel_("nlEnv",ENVS.map((e,k)=>[k,e.name]),env,v=>{env=+v;render();})));
    preview.innerHTML="";const save=doc.info;const tmp={...doc.info,game,env};doc.info=tmp;
    try{for(const b of [5,6,7,0,1,2,3,4]){if(b<texCount())preview.appendChild(thumb(b,44));}}finally{doc.info=save;}
  }
  render();
  const mode=document.createElement("div");mode.className="checks";mode.style.flexDirection="column";mode.style.alignItems="flex-start";
  mode.innerHTML=`<label><input type="radio" name="nlMode" id="nlAdd" checked> Add it as level ${scenario.levels.length} of “${scenario.name.replace(/[<>&]/g,"")}”</label><label><input type="radio" name="nlMode" id="nlFresh"> Start a new scenario with just this level</label>`;
  body.appendChild(mode);
  openModal("New level",body,[button("Cancel",closeModal),button("Create level",()=>{closeModal();const d=newDoc(game);d.info.env=env;d.info.name=nm.value.trim().slice(0,60)||"Untitled Level";
    if(body.querySelector("#nlFresh").checked){syncLevel();scenario.name="Untitled Scenario";scenario.levels=[wrapLevel(d)];scenario.cur=0;scenario.pictures=[];scenario.resources=[];doc=d;undoStack=[];redoStack=[];afterLoad(`New ${GAMES[game].short} scenario.`);fitView();}
    else{addLevel(d);status(`New ${GAMES[game].short} level ${scenario.cur}.`);}},"primary")]);
}

// =============================================================== 3D view and paint mode
function spriteFor(o){
  const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");
  const col={3:"#2fa860",0:"#d8452f",2:"#e0a020",1:"#9a9a9a",4:"#3f8fd1",5:"#9a6ad0"}[o.kind]||"#999";
  g.fillStyle=col;g.strokeStyle="#000";g.lineWidth=3;g.beginPath();
  if(o.kind===2){g.moveTo(32,6);g.lineTo(58,32);g.lineTo(32,58);g.lineTo(6,32);}else if(o.kind===0){g.arc(32,30,24,0,Math.PI*2);}else{g.rect(10,10,44,44);}
  g.closePath();g.fill();g.stroke();
  g.fillStyle="#000";g.font="bold 20px monospace";g.textAlign="center";g.textBaseline="middle";
  const label=o.kind===0?(MONSTERS[o.sub]||["?"])[0].replace(/[a-z]/g,"").slice(0,3):o.kind===2?(ITEMS[o.sub]||["?"])[0].replace(/[a-z]/g,"").slice(0,3):o.kind===3?"P":"•";
  g.fillText(label,32,31);
  const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;
  return new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));
}
function wallTex(q,a,b,part){const s=sideGet(a,b)||{};const def={b:q.wtex,ox:0,oy:0};
  if(part==="full")return s.full||s.upper||s.lower||def;if(part==="upper")return s.upper||s.full||def;return s.lower||s.full||def;}
// Transfer modes Forge offered for surfaces (Aleph One numbering)
const MEDIA_TYPES=[[0,"Water"],[1,"Lava"],[2,"Alien goo"],[3,"Sewage"],[4,"Jjaro goo"]];
const MEDIA_TEX={0:19,1:19,2:19,3:19,4:19};const MEDIA_TINT={0:[0.55,0.75,1],1:[1,0.55,0.25],2:[0.75,0.45,1],3:[0.6,0.8,0.4],4:[0.5,1,0.9]};
const XFERS=[[0,"Normal"],[4,"Pulsate"],[5,"Wobble"],[6,"Fast wobble"],[7,"Static"],[9,"Landscape (sky)"],[15,"Horizontal slide"],[16,"Fast horizontal slide"],[17,"Vertical slide"],[18,"Fast vertical slide"],[19,"Wander"],[20,"Fast wander"],[2,"Invisible"]];
// Control panels: index into Aleph One's panel table depends on the environment (devices.cpp)
const PANEL_BASE={0:0,1:10,2:21,4:32,3:43};
const PANELS_WATER=[["oxygen","Oxygen recharger",0,2],["shield","Shield recharger",1,2],["shield2","2x shield recharger",2,2],["chip","Chip insertion slot",3,0],["light","Light switch",4,0],["platform","Platform switch",5,0],["tag","Tag switch",6,0],["buffer","Pattern buffer (save)",7,4],["terminal","Terminal",8,4],["destroy","Destructible switch",9,1]];
const PANELS_OTHER=[["shield","Shield recharger",0,2],["shield2","2x shield recharger",1,2],["shield3","3x shield recharger",2,2],["light","Light switch",3,0],["platform","Platform switch",4,0],["tag","Tag switch",5,0],["buffer","Pattern buffer (save)",6,4],["terminal","Terminal",7,4],["oxygen","Oxygen recharger",8,2],["chip","Chip insertion slot",9,0],["destroy","Destructible switch",10,1]];
function panelList(env){const base=PANEL_BASE[env]??0;return (env===0?PANELS_WATER:PANELS_OTHER).map(([k,l,off,tex])=>({key:k,label:l,type:base+off,tex}));}
const PANEL_PERM={light:"Light #",platform:"Platform polygon #",tag:"Tag #",terminal:"Terminal #",chip:"Tag #",destroy:"Tag #"};
// Surface settings (what Forge's right-click dialog edited)
function openSurfaceDialog(s,onDone){
  const q=s.poly;const isWall=s.kind==="wall";
  const cur=isWall?{...(s.part==="trans"?((sideGet(s.a,s.b)||{}).trans||{b:0,ox:0,oy:0}):wallTex(q,s.a,s.b,s.part))}:s.kind==="floor"?{b:q.ftex,ox:q.fox||0,oy:q.foy||0,xfer:q.fxfer||0,light:q.flight,li:q.fli,col:q.fcol,clut:q.fclut}:{b:q.ctex,ox:q.cox||0,oy:q.coy||0,xfer:q.cxfer||0,light:q.clight,li:q.cli,col:q.ccol,clut:q.cclut};
  const origLight=cur.light;
  const side=isWall?(sideGet(s.a,s.b)||{}):null;let panel=side&&side.panel?{...side.panel}:null;
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="10px";
  const where=document.createElement("p");where.className="note";where.textContent=`${s.kind==="floor"?"Floor":s.kind==="ceil"?"Ceiling":({full:"Wall",upper:"Upper wall",lower:"Lower wall"})[s.part]} of polygon ${doc.polys.indexOf(q)}.`;body.appendChild(where);
  let tex=cur.b;const origTex=cur.b;const tb=document.createElement("button");tb.type="button";tb.className="texpick";
  const drawTb=()=>{tb.innerHTML="";tb.appendChild(thumb(tex,28));const sp=document.createElement("span");sp.textContent=`Texture ${tex}`;tb.appendChild(sp);};drawTb();
  tb.onclick=()=>{
    openTexturePicker("Texture",tex,v=>{cur.b=v;tex=v;applyAndReopen();});
    function applyAndReopen(){commit(false);openSurfaceDialog(s,onDone);}};
  body.appendChild(field("Texture",tb));
  const ox=numInput("sfX",((cur.ox||0)/WU).toFixed(3),"0.03125",()=>{});const oy=numInput("sfY",((cur.oy||0)/WU).toFixed(3),"0.03125",()=>{});
  body.appendChild(field("X offset",ox,"WU"));body.appendChild(field("Y offset",oy,"WU"));
  const xf=sel_("sfXfer",XFERS,cur.xfer||0,()=>{});body.appendChild(field("Transfer mode",xf));
  const useOwn=document.createElement("input");useOwn.type="checkbox";useOwn.id="sfOwnLight";useOwn.checked=cur.light!=null;
  const lt=numInput("sfLight",cur.light??q.light,"5",()=>{});lt.disabled=!useOwn.checked;useOwn.onchange=()=>{lt.disabled=!useOwn.checked;};
  const lw=document.createElement("div");lw.className="unit";lw.appendChild(useOwn);lw.appendChild(lt);const em=document.createElement("em");em.textContent=`% (room is ${q.light}%)`;lw.appendChild(em);
  body.appendChild(field("Own light",lw));
  let pSel,pPerm,pOn,pRepair;
  if(isWall){
    const g=group("Control panel");const list=panelList(doc.info.env);
    pSel=sel_("sfPanel",[["","None"],...list.map(p=>[String(p.type),p.label])],panel?String(panel.type):"",()=>renderPanel());
    g.appendChild(field("Type",pSel));
    const extra=document.createElement("div");extra.style.display="flex";extra.style.flexDirection="column";extra.style.gap="8px";g.appendChild(extra);
    function renderPanel(){extra.innerHTML="";const t=pSel.value;if(!t)return;const def=list.find(p=>String(p.type)===t);
      if(PANEL_PERM[def.key]){pPerm=numInput("sfPerm",panel&&panel.type===+t?panel.perm:0,"1",()=>{});extra.appendChild(field(PANEL_PERM[def.key],pPerm));}else pPerm=null;
      const ck=document.createElement("div");ck.className="checks";
      ck.innerHTML=`<label><input type="checkbox" id="sfOn"> Starts on / active</label><label><input type="checkbox" id="sfRepair"> Repair switch (needed to finish level)</label>`;
      extra.appendChild(ck);pOn=ck.querySelector("#sfOn");pRepair=ck.querySelector("#sfRepair");pOn.checked=panel?!!(panel.flags&1):true;pRepair.checked=panel?!!(panel.flags&4):false;
      const n=document.createElement("p");n.className="note";n.textContent=`Uses the ${def.label.toLowerCase()} texture (${def.tex}) unless you pick another.`;extra.appendChild(n);}
    renderPanel();body.appendChild(g);
  }
  function commit(close){
    pushUndo();
    const t={b:cur.b,ox:Math.round((parseFloat(ox.value)||0)*WU),oy:Math.round((parseFloat(oy.value)||0)*WU)};
    if(cur.b===origTex){if(cur.col!=null)t.col=cur.col;if(cur.clut)t.clut=cur.clut;}
    const x=+xf.value;if(x)t.xfer=x;
    if(useOwn.checked)t.light=clamp(Math.round(parseFloat(lt.value)||0),0,100);
    if(cur.li!=null&&t.light===origLight)t.li=cur.li;
    if(isWall){sideSet(s.a,s.b,s.part,t);
      const rec=sideGet(s.a,s.b)||{};
      if(pSel&&pSel.value){const def=panelList(doc.info.env).find(p=>String(p.type)===pSel.value);
        const wasNew=!rec.panel||rec.panel.type!==def.type;
        rec.panel={type:def.type,perm:pPerm?(parseInt(pPerm.value)||0):0,flags:(pOn&&pOn.checked?1:0)|(pRepair&&pRepair.checked?4:0)};
        if(wasNew&&tex===origTex)rec[s.part]={...(rec[s.part]||t),b:def.tex};
        doc.sides.set(sideKey(s.a,s.b),rec);}
      else if(rec.panel){delete rec.panel;doc.sides.set(sideKey(s.a,s.b),rec);}}
    else if(s.kind==="floor"){q.ftex=t.b;q.fox=t.ox;q.foy=t.oy;q.fxfer=t.xfer||0;if(t.light!=null)q.flight=t.light;else delete q.flight;if(t.li==null)delete q.fli;if(t.col!=null)q.fcol=t.col;else delete q.fcol;if(t.clut)q.fclut=t.clut;else delete q.fclut;}
    else{q.ctex=t.b;q.cox=t.ox;q.coy=t.oy;q.cxfer=t.xfer||0;if(t.light!=null)q.clight=t.light;else delete q.clight;if(t.li==null)delete q.cli;if(t.col!=null)q.ccol=t.col;else delete q.ccol;if(t.clut)q.cclut=t.clut;else delete q.cclut;}
    if(close){closeModal();onDone&&onDone();}
  }
  openModal("Surface settings",body,[button("Cancel",()=>{closeModal();onDone&&onDone();}),button("Apply",()=>commit(true),"primary")]);
}
let paintTex=5;let view3d=null;let paletteShown=true;
function open3D(){
  if(view3d)return;
  if(typeof THREE==="undefined"){toast("The 3D library didn't load. Check your connection and reload.");return;}
  if(!doc.polys.length){toast("Draw or generate a level first.");return;}
  chain=[];
  const wrap=document.createElement("div");wrap.className="view3d";
  wrap.innerHTML=`<div class="hud"><span class="t">3D</span>
    <button class="btn" id="h3fly" title="Fly through walls (F)">Fly</button><button class="btn" id="h3doors" title="Show doors and lifts open or as they start (O)">Doors: start</button><button class="btn" id="h3palbtn" title="Show or hide the texture palette (P)">Palette</button>
    <button class="btn" id="h3start">Back to start</button><button class="btn" id="h3shapes" hidden>Load Shapes…</button>
    <span style="flex:1"></span><span id="h3pos"></span><button class="btn" id="h3close">Close</button>
    <div class="help" id="h3help"></div></div>
  <div class="crosshair" id="h3cross"></div>
  <div class="paintbar" id="h3bar">
    <div class="paintinfo"><span id="h3aim">Aim at a surface</span><span class="paintkeys">Space paints · Shift+Space paints the whole room · G grabs a texture · right-click edits the surface · J L I K shift the texture · + − light · [ ] change texture · Ctrl+Z undo</span></div>
    <div class="palette" id="h3pal"></div></div>
  <div class="pad" id="h3pad"><button data-a="paint" aria-label="Paint">Paint</button><button data-k="f" aria-label="Forward">▲</button><button data-a="edit" aria-label="Edit surface">Edit</button><button data-k="l" aria-label="Turn left">◀</button><button data-k="b" aria-label="Back">▼</button><button data-k="r" aria-label="Turn right">▶</button></div>`;
  document.body.appendChild(wrap);
  const cv=document.createElement("canvas");wrap.insertBefore(cv,wrap.firstChild);
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  const scene=new THREE.Scene();
  const sky=[[96,130,170],[14,16,30],[30,30,40],[2,2,8]][doc.info.landscape]||[0,0,0];
  scene.background=new THREE.Color(`rgb(${sky})`);scene.fog=new THREE.Fog(scene.background,6,40);
  const camera=new THREE.PerspectiveCamera(75,1,0.05,200);
  const S=1/WU;
  const mats=new Map();const disposables=[];
  function matFor(key){if(mats.has(key))return mats.get(key);const [b,col,clut,kind]=key.split(":");const src=texCanvasFor(+b,col===""?undefined:+col,+clut);
    let cvs=src;if(kind==="t"){cvs=document.createElement("canvas");cvs.width=src.width;cvs.height=src.height;const g=cvs.getContext("2d");g.drawImage(src,0,0);const im=g.getImageData(0,0,cvs.width,cvs.height);
      const r0=im.data[0],g0=im.data[1],b0=im.data[2];for(let i=0;i<im.data.length;i+=4)if(im.data[i]===r0&&im.data[i+1]===g0&&im.data[i+2]===b0)im.data[i+3]=0;g.putImageData(im,0,0);}
    const t=new THREE.CanvasTexture(cvs);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestMipmapLinearFilter;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    const m=kind==="m"?new THREE.MeshBasicMaterial({color:0xffffff,map:t,vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:0.65,depthWrite:false})
      :new THREE.MeshBasicMaterial({map:t,vertexColors:true,side:THREE.DoubleSide,transparent:kind==="t",alphaTest:kind==="t"?0.5:0});mats.set(key,m);disposables.push(t,m);return m;}
  let meshes=[],geos=[];const surfOf=new Map();let sprites=[];
  function build(){
    for(const m of meshes)scene.remove(m);for(const g of geos)g.dispose();meshes=[];geos=[];surfOf.clear();
    for(const s of sprites){scene.remove(s);s.material.map.dispose();s.material.dispose();}sprites=[];
    const groups=new Map();const grp=(b,col,clut,kind="")=>{const key=`${b}:${col??""}:${clut|0}:${kind}`;if(!groups.has(key))groups.set(key,{b:key,pos:[],uv:[],col:[],surf:[]});return groups.get(key);};
    const PI=platformInfo(doc);const H=q=>{const r=PI.get(q);return r&&!openDoors?{floor:r.floor,ceil:r.ceil}:r&&openDoors?{floor:r.minF,ceil:r.maxC}:q;};
    const edgeOwner=new Map();doc.polys.forEach((q,i)=>q.verts.forEach((v,k)=>edgeOwner.set(sideKey(v,q.verts[(k+1)%q.verts.length]),i)));
    const lv=p=>0.2+0.8*p/100;
    function quad(q,a,b,y0,y1,part,orient){
      if(y1-y0<1)return;const t=part==="trans"?((sideGet(a,b)||{}).trans):wallTex(q,a,b,part);if(!t)return;const g=grp(t.b,t.col,t.clut,part==="trans"?"t":"");const len=Math.hypot(b.x-a.x,b.y-a.y);const shade=lv(t.light??q.light)*orient;
      const P=[[a.x*S,y0*S,a.y*S],[b.x*S,y0*S,b.y*S],[b.x*S,y1*S,b.y*S],[a.x*S,y1*S,a.y*S]];
      const u0=(t.ox||0)/WU,u1=(len+(t.ox||0))/WU,vt=-(t.oy||0)/WU,vb=-((y1-y0)+(t.oy||0))/WU;
      const U=[[u0,vb],[u1,vb],[u1,vt],[u0,vt]];
      for(const i of [0,1,2,0,2,3]){g.pos.push(...P[i]);g.uv.push(U[i][0],U[i][1]+1);g.col.push(shade,shade,shade);}
      const sf={kind:"wall",poly:q,a,b,part,corners:P};g.surf.push(sf,sf);}
    doc.polys.forEach(q0=>{
      const q=q0,h=H(q0),F=h.floor,C=h.ceil;
      const fl=lv(q.flight??q.light),cl=lv(q.clight??q.light)*0.9;
      const fg=grp(q.ftex,q.fcol,q.fclut),cg=grp(q.ctex,q.ccol,q.cclut);const fs={kind:"floor",poly:q},cs={kind:"ceil",poly:q};
      fs.corners=q.verts.map(v=>[v.x*S,F*S+0.002,v.y*S]);cs.corners=q.verts.map(v=>[v.x*S,C*S-0.002,v.y*S]);
      for(let k=1;k<q.verts.length-1;k++){const tri=[q.verts[0],q.verts[k],q.verts[k+1]];
        for(const v of tri){fg.pos.push(v.x*S,F*S,v.y*S);fg.uv.push((v.x+(q.fox||0))/WU,-(v.y+(q.foy||0))/WU);fg.col.push(fl,fl,fl);}fg.surf.push(fs);
        for(const v of [tri[0],tri[2],tri[1]]){cg.pos.push(v.x*S,C*S,v.y*S);cg.uv.push((v.x+(q.cox||0))/WU,-(v.y+(q.coy||0))/WU);cg.col.push(cl,cl,cl);}cg.surf.push(cs);}
      if(q.media){const m=q.media,mh=m.high;if(mh>F){const mg=grp(MEDIA_TEX[m.type]??0,null,0,"m");const ml=lv(q.light);const ms={kind:"media",poly:q};
        for(let k=1;k<q.verts.length-1;k++){for(const v of [q.verts[0],q.verts[k],q.verts[k+1]]){mg.pos.push(v.x*S,Math.min(mh,C)*S,v.y*S);mg.uv.push(v.x/WU,-v.y/WU);const c=MEDIA_TINT[m.type]||[1,1,1];mg.col.push(c[0]*ml,c[1]*ml,c[2]*ml);}mg.surf.push(ms);}}}
      q.verts.forEach((a,k)=>{const b=q.verts[(k+1)%q.verts.length];const oi=edgeOwner.get(sideKey(b,a));const o0=oi!=null?doc.polys[oi]:null;const o=o0?H(o0):null;
        const nx=-(b.y-a.y),ny=b.x-a.x,nl=Math.hypot(nx,ny)||1;const orient=0.74+0.26*Math.abs((nx*0.6+ny*0.8)/nl);
        if(!o||o.floor>=C||o.ceil<=F)quad(q,a,b,F,C,"full",orient);
        else{if(o.floor>F)quad(q,a,b,F,Math.min(o.floor,C),"lower",orient);if(o.ceil<C)quad(q,a,b,Math.max(o.ceil,F),C,"upper",orient);
          if((sideGet(a,b)||{}).trans)quad(q,a,b,Math.max(o.floor,F),Math.min(o.ceil,C),"trans",orient);}});
    });
    for(const g of groups.values()){const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(g.pos,3));geo.setAttribute("uv",new THREE.Float32BufferAttribute(g.uv,2));geo.setAttribute("color",new THREE.Float32BufferAttribute(g.col,3));
      const mesh=new THREE.Mesh(geo,matFor(g.b));scene.add(mesh);meshes.push(mesh);geos.push(geo);surfOf.set(mesh,g.surf);}
    for(const o of doc.objs){const q=polyAtPoint(o);if(!q)continue;const s=spriteFor(o);const size=o.kind===2?0.35:0.6;s.scale.set(size,size,1);s.position.set(o.x*S,(q.floor+(o.z||0))*S+size/2,o.y*S);scene.add(s);sprites.push(s);}
  }
  let openDoors=false;let PInow=platformInfo(doc);
  const hNow=q=>{const r=PInow.get(q);return r?(openDoors?{floor:r.minF,ceil:r.maxC}:{floor:r.floor,ceil:r.ceil}):q;};
  build();
  const hlGeo=new THREE.BufferGeometry();const hl=new THREE.LineLoop(hlGeo,new THREE.LineBasicMaterial({color:0xffb040,depthTest:false}));hl.renderOrder=10;hl.visible=false;scene.add(hl);disposables.push(hlGeo,hl.material);
  const ray=new THREE.Raycaster();let aim=null;const center=new THREE.Vector2(0,0);
  function updateAim(){ray.setFromCamera(center,camera);const hit=ray.intersectObjects(meshes,false)[0];
    aim=hit?surfOf.get(hit.object)[hit.faceIndex]:null;if(aim&&aim.kind==="media")aim=null;
    if(aim){hlGeo.setAttribute("position",new THREE.Float32BufferAttribute(aim.corners.flat(),3));hl.visible=paletteShown;}else hl.visible=false;}
  const start=doc.objs.find(o=>o.kind===3&&polyAtPoint(o))||(()=>{const c=centroid(doc.polys[0].verts);return {x:c.x,y:c.y,facing:0};})();
  const st={x:0,y:0,feet:0,yaw:0,pitch:0,vy:0};let fly=false;
  function reset(){st.x=start.x;st.y=start.y;const q=polyAtPoint(start);st.feet=q?q.floor:0;st.yaw=(start.facing||0)*Math.PI/180;st.pitch=0;st.vy=0;}
  reset();
  const keys=new Set();const EYE=0.66*WU,BODY=0.8*WU,STEP=0.3*WU;
  function canMove(nx,ny){
    if(fly)return Math.abs(nx)<MAXC&&Math.abs(ny)<MAXC;
    const q0=polyAtPoint({x:nx,y:ny});if(!q0)return false;const q=hNow(q0);
    if(q.floor-st.feet>STEP)return false;if(q.ceil-Math.max(q.floor,st.feet)<BODY)return false;
    for(const l of doc.lines)if(l.solid&&segIntersect({x:st.x,y:st.y},{x:nx,y:ny},l.a,l.b))return false;
    return true;}
  const pal=wrap.querySelector("#h3pal");
  function renderPalette(){pal.innerHTML="";const n=texCount();paintTex=clamp(paintTex,0,n-1);for(let i=0;i<n;i++){const b=document.createElement("button");b.className="texbtn"+(i===paintTex?" on":"");b.title=`Texture ${i}`;b.appendChild(thumb(i,52));const s=document.createElement("span");s.textContent=i;b.appendChild(s);b.onclick=()=>{paintTex=i;renderPalette();};pal.appendChild(b);}
    const on=pal.querySelector(".on");if(on)on.scrollIntoView({block:"nearest",inline:"nearest"});}
  function texOfSurf(s){if(s.kind==="floor")return {b:s.poly.ftex,ox:s.poly.fox,oy:s.poly.foy,light:s.poly.flight};if(s.kind==="ceil")return {b:s.poly.ctex,ox:s.poly.cox,oy:s.poly.coy,light:s.poly.clight};if(s.part==="trans")return (sideGet(s.a,s.b)||{}).trans||{b:0};return wallTex(s.poly,s.a,s.b,s.part);}
  const partName={full:"Wall",upper:"Upper wall",lower:"Lower wall",trans:"See-through texture"};
  function describe(s){if(!s)return "Aim at a surface";const t=texOfSurf(s);const where=s.kind==="floor"?"Floor":s.kind==="ceil"?"Ceiling":partName[s.part];
    const pn=s.kind==="wall"&&(sideGet(s.a,s.b)||{}).panel;const pl=pn?panelList(doc.info.env).find(p=>p.type===pn.type):null;
    return `${where} · polygon ${doc.polys.indexOf(s.poly)} · texture ${t.b} · offset ${((t.ox||0)/WU).toFixed(3)}, ${((t.oy||0)/WU).toFixed(3)} · light ${t.light??s.poly.light}%${pl?" · "+pl.label:""}`;}
  function applyTex(s,b){if(s.kind==="floor"){s.poly.ftex=b;delete s.poly.fcol;delete s.poly.fclut;}else if(s.kind==="ceil"){s.poly.ctex=b;delete s.poly.ccol;delete s.poly.cclut;}
    else{const cur=(sideGet(s.a,s.b)||{})[s.part];const t={...(cur||{ox:0,oy:0}),b};delete t.col;delete t.clut;sideSet(s.a,s.b,s.part,t);}}
  function refresh(){dirty=true;PInow=platformInfo(doc);build();updateAim();lastAim=undefined;}
  function paint(all){if(!aim)return;pushUndo();const s=aim;
    if(all){const q=s.poly;if(s.kind==="wall"){q.verts.forEach((a,k)=>{const b=q.verts[(k+1)%q.verts.length];for(const part of ["full","upper","lower"]){const cur=(sideGet(a,b)||{})[part];sideSet(a,b,part,{...(cur||{ox:0,oy:0}),b:paintTex});}});q.wtex=paintTex;}else applyTex(s,paintTex);}
    else applyTex(s,paintTex);
    refresh();}
  function grab(){if(!aim)return;paintTex=texOfSurf(aim).b;renderPalette();status(`Picked up texture ${paintTex}.`);}
  function nudge(dx,dy){if(!aim)return;const s=aim;pushUndo();
    if(s.kind==="floor"){s.poly.fox=(s.poly.fox||0)+dx;s.poly.foy=(s.poly.foy||0)+dy;}
    else if(s.kind==="ceil"){s.poly.cox=(s.poly.cox||0)+dx;s.poly.coy=(s.poly.coy||0)+dy;}
    else{const t=texOfSurf(s);sideSet(s.a,s.b,s.part,{...t,ox:(t.ox||0)+dx,oy:(t.oy||0)+dy});}
    refresh();}
  function editSurface(){if(!aim)return;try{if(document.pointerLockElement)document.exitPointerLock();}catch(_){}keys.clear();
    openSurfaceDialog(aim,()=>{refresh();});}
  let dirty=false,lastAim;
  function setFly(v){fly=v;wrap.querySelector("#h3fly").classList.toggle("on",v);status(v?"Flying: walls don't stop you. R rises, C sinks.":"Walking.");}
  function setPalette(v){paletteShown=v;wrap.querySelector("#h3bar").hidden=!v;wrap.querySelector("#h3palbtn").classList.toggle("on",v);
    wrap.querySelector("#h3pad").style.bottom=v?"calc(150px + env(safe-area-inset-bottom,0px))":"";if(v)renderPalette();updateAim();}
  wrap.querySelector("#h3help").textContent="WASD / arrows move · click to look with the mouse (Esc frees it) · Shift runs · F flies · P palette · Esc closes";
  const shBtn=wrap.querySelector("#h3shapes");shBtn.hidden=realTextures();shBtn.onclick=()=>{try{if(document.pointerLockElement)document.exitPointerLock();}catch(_){}openShapesDialog(false);};
  const onShapes=()=>{mats.forEach(m=>{m.map.dispose();m.dispose();});mats.clear();build();shBtn.hidden=realTextures();if(paletteShown)renderPalette();};
  window.addEventListener("forge-shapes",onShapes);
  const onKey=e=>{if(!$("modal").hidden)return;const k=e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey)&&k==="z"){e.preventDefault();e.shiftKey?redo():undo();refresh();return;}
    if(k==="escape"){if(document.pointerLockElement)return;close();return;}
    if(k===" "){e.preventDefault();if(!e.repeat)paint(e.shiftKey);return;}
    if(k==="f"){setFly(!fly);return;}if(k==="p"||k==="tab"){e.preventDefault();setPalette(!paletteShown);return;}
    if(k==="g"){grab();return;}if(k==="o"){wrap.querySelector("#h3doors").click();return;}
    if(k==="["||k==="]"){paintTex=clamp(paintTex+(k==="]"?1:-1),0,texCount()-1);renderPalette();return;}
    if(aim){const step=e.shiftKey?128:32;
      if(k==="j"){nudge(-step,0);return;}if(k==="l"){nudge(step,0);return;}if(k==="i"){nudge(0,-step);return;}if(k==="k"){nudge(0,step);return;}
      if(k==="="||k==="+"||k==="-"){pushUndo();const d=k==="-"?-5:5;const q=aim.poly;
        if(aim.kind==="floor"){if(q.flight!=null){q.flight=clamp(q.flight+d,0,100);delete q.fli;}else{q.light=clamp(q.light+d,0,100);clearPolyLightIdx(q);}}
        else if(aim.kind==="ceil"){if(q.clight!=null){q.clight=clamp(q.clight+d,0,100);delete q.cli;}else{q.light=clamp(q.light+d,0,100);clearPolyLightIdx(q);}}
        else{const t=texOfSurf(aim);if(t.light!=null){const n={...t,light:clamp(t.light+d,0,100)};delete n.li;sideSet(aim.a,aim.b,aim.part,n);}else{q.light=clamp(q.light+d,0,100);clearPolyLightIdx(q);}}
        refresh();return;}}
    if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","q","e","shift","r","c"].includes(k)){keys.add(k);e.preventDefault();}};
  const offKey=e=>{keys.delete(e.key.toLowerCase());if(e.key==="Shift")keys.delete("shift");};
  document.addEventListener("keydown",onKey,true);document.addEventListener("keyup",offKey);
  let look=null;
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("pointerdown",e=>{
    const locked=document.pointerLockElement===cv;
    if(e.button===2){updateAim();editSurface();return;}
    if(locked){if(e.button===0)paint(e.shiftKey);return;}
    look={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,touch:e.pointerType!=="mouse"};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener("pointermove",e=>{
    if(document.pointerLockElement===cv){st.yaw+=e.movementX*0.0025;st.pitch=clamp(st.pitch-e.movementY*0.0025,-1.3,1.3);return;}
    if(!look)return;st.yaw+=(e.clientX-look.x)*0.005;st.pitch=clamp(st.pitch-(e.clientY-look.y)*0.005,-1.3,1.3);look.x=e.clientX;look.y=e.clientY;});
  cv.addEventListener("pointerup",e=>{const l=look;look=null;if(!l)return;
    if(Math.hypot(e.clientX-l.sx,e.clientY-l.sy)<6&&!l.touch&&cv.requestPointerLock){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}}});
  const pad=wrap.querySelector("#h3pad");const padKeys={f:"w",b:"s",l:"arrowleft",r:"arrowright"};
  pad.querySelectorAll("button[data-k]").forEach(b=>{const k=padKeys[b.dataset.k];b.addEventListener("pointerdown",e=>{e.preventDefault();keys.add(k);b.setPointerCapture(e.pointerId);});const up=()=>keys.delete(k);b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);});
  pad.querySelector('[data-a="paint"]').onclick=()=>{updateAim();paint(false);};pad.querySelector('[data-a="edit"]').onclick=()=>{updateAim();editSurface();};
  wrap.querySelector("#h3fly").onclick=()=>setFly(!fly);
  const setDoors=v=>{openDoors=v;wrap.querySelector("#h3doors").textContent=v?"Doors: open":"Doors: start";wrap.querySelector("#h3doors").classList.toggle("on",v);build();updateAim();};
  wrap.querySelector("#h3doors").onclick=()=>setDoors(!openDoors);wrap.querySelector("#h3palbtn").onclick=()=>setPalette(!paletteShown);
  wrap.querySelector("#h3start").onclick=reset;wrap.querySelector("#h3close").onclick=()=>close();
  function size(){const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  window.addEventListener("resize",size);size();
  setPalette(paletteShown);
  let last=performance.now(),raf=0;const posEl=wrap.querySelector("#h3pos"),aimEl=wrap.querySelector("#h3aim");
  function frame(now){
    const dt=Math.min(0.05,(now-last)/1000);last=now;
    const run=keys.has("shift")?2:1,spd=2.6*WU*run*dt;
    if(keys.has("arrowleft")||keys.has("q"))st.yaw-=2.2*dt;if(keys.has("arrowright")||keys.has("e"))st.yaw+=2.2*dt;
    let fx=0,fy=0;const cy=Math.cos(st.yaw),sy=Math.sin(st.yaw);
    if(keys.has("w")||keys.has("arrowup")){fx+=cy;fy+=sy;}if(keys.has("s")||keys.has("arrowdown")){fx-=cy;fy-=sy;}
    if(keys.has("a")){fx+=sy;fy-=cy;}if(keys.has("d")){fx-=sy;fy+=cy;}
    const m=Math.hypot(fx,fy);
    if(m>0){fx=fx/m*spd;fy=fy/m*spd;
      if(fly){const cp=Math.cos(st.pitch);st.x+=fx*cp;st.y+=fy*cp;if(keys.has("w")||keys.has("arrowup"))st.feet+=Math.sin(st.pitch)*spd;if(keys.has("s")||keys.has("arrowdown"))st.feet-=Math.sin(st.pitch)*spd;}
      else if(canMove(st.x+fx,st.y+fy)){st.x+=fx;st.y+=fy;}else if(canMove(st.x+fx,st.y)){st.x+=fx;}else if(canMove(st.x,st.y+fy)){st.y+=fy;}}
    st.x=clamp(st.x,-MAXC,MAXC);st.y=clamp(st.y,-MAXC,MAXC);
    if(fly){if(keys.has("r"))st.feet+=spd;if(keys.has("c"))st.feet-=spd;}
    else{const q0=polyAtPoint(st);const q=q0?hNow(q0):null;if(q){if(st.feet<q.floor)st.feet=Math.min(q.floor,st.feet+4*WU*dt);else if(st.feet>q.floor){st.vy-=9*WU*dt;st.feet=Math.max(q.floor,st.feet+st.vy*dt);}if(st.feet<=q.floor)st.vy=0;}}
    camera.position.set(st.x*S,(st.feet+EYE)*S,st.y*S);
    const cp=Math.cos(st.pitch);camera.lookAt(camera.position.x+Math.cos(st.yaw)*cp,camera.position.y+Math.sin(st.pitch),camera.position.z+Math.sin(st.yaw)*cp);
    updateAim();if(aim!==lastAim){aimEl.textContent=describe(aim);lastAim=aim;}
    renderer.render(scene,camera);
    const q=polyAtPoint(st);posEl.textContent=`x ${(st.x/WU).toFixed(2)} y ${(st.y/WU).toFixed(2)} · ${q?"polygon "+doc.polys.indexOf(q):"outside"}`;
    raf=requestAnimationFrame(frame);}
  raf=requestAnimationFrame(frame);
  function close(){cancelAnimationFrame(raf);document.removeEventListener("keydown",onKey,true);document.removeEventListener("keyup",offKey);window.removeEventListener("resize",size);window.removeEventListener("forge-shapes",onShapes);
    try{if(document.pointerLockElement)document.exitPointerLock();}catch(_){}
    for(const g of geos)g.dispose();for(const s of sprites){s.material.map.dispose();s.material.dispose();}
    disposables.forEach(d=>d.dispose&&d.dispose());renderer.dispose();wrap.remove();view3d=null;if(dirty){changed();status("Surfaces painted in 3D. Export to see them in Aleph One.");}}
  view3d={close,build:refresh};
}

// =============================================================== scenario: several levels, pictures, physics
// The editor always works on `doc`, the current level. The scenario holds every level plus shared pictures and physics.
const scenario={name:"Untitled Scenario",levels:[],cur:0,pictures:[],resources:[],physicsLib:[]};
function curLevel(){return scenario.levels[scenario.cur];}
function syncLevel(){const L=curLevel();if(L){L.doc=doc;L.ser=null;}}
function wrapLevel(d){return {doc:d,undo:[],redo:[],ser:null};}
function switchLevel(i){
  if(i<0||i>=scenario.levels.length||i===scenario.cur&&curLevel().doc===doc)return;
  const L=curLevel();if(L){L.doc=doc;L.undo=undoStack;L.redo=redoStack;}
  scenario.cur=i;const N=curLevel();doc=N.doc;undoStack=N.undo;redoStack=N.redo;resetPolyRefs();patternCache.clear();
  afterLoad(`Editing level ${i}: ${doc.info.name}.`);fitView();
}
function addLevel(d,{select=true,at=null}={}){const w=wrapLevel(d);const i=at==null?scenario.levels.length:at;scenario.levels.splice(i,0,w);if(select)switchLevel(i);else saveScenarioSoon();return i;}
function removeLevel(i){if(scenario.levels.length<=1){toast("A scenario needs at least one level.");return;}
  const wasCur=i===scenario.cur;scenario.levels.splice(i,1);if(scenario.cur>=scenario.levels.length||i<scenario.cur)scenario.cur=Math.max(0,scenario.cur-(i<scenario.cur?1:0));
  if(wasCur||scenario.cur>=scenario.levels.length){scenario.cur=Math.min(i,scenario.levels.length-1);const N=curLevel();doc=N.doc;undoStack=N.undo;redoStack=N.redo;resetPolyRefs();afterLoad();fitView();}else{renderPane();}
  saveScenarioSoon();}
function moveLevel(i,d){const j=i+d;if(j<0||j>=scenario.levels.length)return;const L=scenario.levels;[L[i],L[j]]=[L[j],L[i]];
  if(scenario.cur===i)scenario.cur=j;else if(scenario.cur===j)scenario.cur=i;renderPane();saveScenarioSoon();}
function pictureById(id){return scenario.pictures.find(p=>p.id===id);}
function setPicture(id,name,data){const old=pictureById(id);if(old){old.data=data;old.name=name;}else{scenario.pictures.push({id,name,data});scenario.pictures.sort((a,b)=>a.id-b.id);}saveScenarioSoon();}
function serializeScenario(){
  syncLevel();
  return JSON.stringify({format:"forge-scenario",version:1,name:scenario.name,cur:scenario.cur,
    levels:scenario.levels.map(L=>{if(!L.ser)L.ser=serialize(L.doc);return L.ser;}),
    pictures:scenario.pictures.map(p=>({id:p.id,name:p.name||"",data:p.b64||(p.b64=b64enc(p.data))})),
    resources:scenario.resources.map(r=>({type:r.type,id:r.id,name:r.name||"",data:r.b64||(r.b64=b64enc(r.data))})),
    physicsLib:scenario.physicsLib});
}
function loadScenarioObject(o){
  scenario.name=o.name||"Untitled Scenario";
  scenario.levels=(o.levels||[]).map(s=>{const w=wrapLevel(deserialize(s));w.ser=typeof s==="string"?s:null;return w;});
  if(!scenario.levels.length)scenario.levels.push(wrapLevel(newDoc()));
  scenario.pictures=(o.pictures||[]).map(p=>({id:p.id,name:p.name,data:b64dec(p.data),b64:p.data}));
  scenario.resources=(o.resources||[]).map(r=>({type:r.type,id:r.id,name:r.name,data:b64dec(r.data),b64:r.data}));
  scenario.physicsLib=o.physicsLib||[];
  scenario.cur=clamp(o.cur|0,0,scenario.levels.length-1);
  const N=curLevel();doc=N.doc;undoStack=N.undo;redoStack=N.redo;resetPolyRefs();pictCanvasCache.clear();
}
let scenTimer=null;
function saveScenarioSoon(){clearTimeout(scenTimer);scenTimer=setTimeout(async()=>{try{const s=serializeScenario();await idb.put("scenario",s);}catch(e){}},900);}
// ---- merged export (map compiling): every level, its physics, terminals, and the scenario's pictures
function buildScenarioFile(levelIdxs){
  const entries=levelIdxs.map(i=>{const d=scenario.levels[i].doc;return {d,...buildMapChunks(d)};});
  const multi=entries.length>1;
  const body=new BW();const dir=[];
  entries.forEach((e,k)=>{const start=body.n;let off=0;
    e.chunks.forEach(([t,data],i)=>{body.i32(tag(t));const last=i===e.chunks.length-1;body.i32(last?0:off+16+data.length);body.i32(data.length);body.i32(0);body.bytes(data);off+=16+data.length;});
    dir.push({off:128+start,size:body.n-start,idx:k,d:e.d});});
  const w=new BW();const name=safeName(scenario.name);
  w.i16(multi?4:2);w.i16(1);w.str(multi?name:safeName(entries[0].d.info.name),64);w.i32(0);w.i32(128+body.n);w.i16(entries.length);w.i16(multi?74:0);w.i16(16);w.i16(10);w.i32(0);w.zeros(40);
  w.bytes(body.out());
  for(const e of dir){w.i32(e.off);w.i32(e.size);w.i16(e.idx);
    if(multi){const i=e.d.info;w.i16(i.mission|0);w.i16(i.envFlags|0);w.i32(i.entry||1);w.str(i.name||"Untitled Level",66);}}
  const file=w.out();const c=crc32(file);file[68]=c>>>24;file[69]=(c>>>16)&255;file[70]=(c>>>8)&255;file[71]=c&255;
  const res=[...scenario.pictures.map(p=>({type:"PICT",id:p.id,name:p.name,data:p.data})),...scenario.resources];
  const stats=entries.map(e=>e.stats);
  if(!res.length)return {file,stats,mac:false};
  return {file:macBinary(name,"sce2","26.∞",file,buildResourceFork(res)),stats,mac:true};
}
// ---- physics files (.phyA): the five physics sections, embedded per level when compiling
function parsePhysicsFile(buf){
  const un=unwrapMacFile(buf);const data=un.data||buf;const u=new Uint8Array(data),dv=new DataView(data);
  const dirOff=dv.getInt32(72),count=dv.getInt16(76),app=dv.getInt16(78);if(dv.getInt16(80)!==16)throw new Error("That isn't a physics file.");
  const off=dv.getInt32(dirOff);const chunks={};let pos=off;
  for(let g=0;g<50;g++){const t=macDecode(u.subarray(pos,pos+4)),next=dv.getInt32(pos+4),len=dv.getInt32(pos+8);if(PHYSICS_TAGS.includes(t))chunks[t]=b64enc(u.slice(pos+16,pos+16+len));if(next<=0)break;pos=off+next;}
  if(!chunks.MNpx)throw new Error("No physics found in that file.");
  return chunks;
}
function panelKeyOf(type){for(const e of [0,1,2,4,3]){const p=panelList(e).find(x=>x.type===type);if(p)return p.key;}return null;}

// =============================================================== doors, lifts and liquids (inspector sections)
const PLAT_TYPES=[[0,"S'pht door"],[1,"S'pht split door"],[2,"Locked S'pht door"],[3,"S'pht platform"],[4,"Noisy S'pht platform"],[5,"Heavy S'pht door"],[6,"Pfhor door"],[7,"Heavy S'pht platform"],[8,"Pfhor platform"]];
const PLAT_SPEEDS=[[8,"Very slow"],[17,"Slow"],[34,"Fast"],[51,"Very fast"],[68,"Blindingly fast"]];
const PB=n=>1<<n;
const PLAT_PRESETS={
  door:{label:"Door",p:{type:0,speed:34,delay:120,min:-1,max:-1,flags:PB(1)|PB(3)|PB(5)|PB(7)|PB(13)|PB(14)|PB(15)|PB(26)}},
  split:{label:"Split door",p:{type:1,speed:17,delay:120,min:-1,max:-1,flags:PB(1)|PB(3)|PB(5)|PB(6)|PB(7)|PB(13)|PB(14)|PB(15)|PB(26)}},
  pfhor:{label:"Pfhor door",p:{type:6,speed:34,delay:120,min:-1,max:-1,flags:PB(1)|PB(3)|PB(5)|PB(7)|PB(13)|PB(14)|PB(15)|PB(26)}},
  lift:{label:"Lift",p:{type:3,speed:34,delay:60,min:-1,max:-1,flags:PB(3)|PB(6)|PB(13)|PB(14)|PB(15)}},
  stairs:{label:"Rising floor (once)",p:{type:7,speed:17,delay:60,min:-1,max:-1,flags:PB(2)|PB(6)|PB(10)|PB(15)|PB(16)}},
  crusher:{label:"Crusher",p:{type:5,speed:34,delay:30,min:-1,max:-1,flags:PB(0)|PB(7)|PB(8)}}};
const PLAT_FLAG_GROUPS=[
  ["How it starts",[[0,"Active"],[1,"Extended (closed / raised)"],[18,"Waits before first move"]]],
  ["Who can use it",[[13,"Players"],[14,"Monsters"],[26,"Is a door"],[24,"Locked"],[25,"Secret"]]],
  ["How it moves",[[6,"Rises from floor"],[7,"Lowers from ceiling"],[5,"Closes floor to ceiling"],[15,"Reverses when blocked"],[8,"Crushes when blocked"],[22,"Opens slower than it closes"],[17,"Uses its own heights"]]],
  ["When it stops",[[2,"At each end"],[3,"Back at its start"],[10,"Works only once"],[16,"Can't be stopped by switches"]]],
  ["Chain reactions",[[19,"Starts neighbours when starting"],[4,"Starts neighbours when stopping"],[23,"Starts neighbours at each end"],[20,"Stops neighbours when starting"],[21,"Stops neighbours when stopping"],[9,"Doesn't restart what started it"],[11,"Turns lights on as it moves"],[12,"Turns lights off as it stops"]]]];
function platformSection(items,one,p){
  const all=fn=>items.forEach(fn);
  const pf={...PLAT_DEFAULT(),...(one.plat||{})};
  const g=group("Door / lift");
  const pr=document.createElement("div");pr.className="row";
  for(const [k,v] of Object.entries(PLAT_PRESETS))pr.appendChild(button(v.label,()=>{pushUndo();all(q=>q.plat={...v.p,tag:(q.plat&&q.plat.tag)||0});changed();status(`Made ${items.length>1?items.length+" polygons":"this polygon"} a ${v.label.toLowerCase()}.`);}));
  g.appendChild(pr);
  const setP=(key,val)=>{pushUndo();all(q=>{q.plat={...PLAT_DEFAULT(),...(q.plat||{}),[key]:val};});changed();};
  g.appendChild(field("Sound set",sel_("plType",PLAT_TYPES,pf.type,v=>setP("type",+v))));
  const sp=PLAT_SPEEDS.find(s=>s[0]===pf.speed)?PLAT_SPEEDS:[...PLAT_SPEEDS,[pf.speed,`Custom (${pf.speed})`]];
  g.appendChild(field("Speed",sel_("plSpeed",sp,pf.speed,v=>setP("speed",+v))));
  g.appendChild(field("Waits",numInput("plDelay",(pf.delay/30).toFixed(1),"0.5",v=>{if(isFinite(v))setP("delay",Math.round(v*30));}),"seconds"));
  const PI=platformInfo(doc).get(one);
  for(const [key,lab] of [["min","Lowest"],["max","Highest"]]){const wrap=document.createElement("div");wrap.className="unit";
    const auto=document.createElement("input");auto.type="checkbox";auto.id="plAuto"+key;auto.checked=pf[key]===-1;
    const inp=document.createElement("input");inp.type="number";inp.step="0.125";inp.id="pl"+key;inp.disabled=auto.checked;
    inp.value=((pf[key]===-1?(key==="min"?(PI?Math.min(PI.minF,PI.minC):one.floor):(PI?Math.max(PI.maxF,PI.maxC):one.ceil)):pf[key])/WU).toFixed(3);
    auto.onchange=()=>setP(key,auto.checked?-1:Math.round(parseFloat(inp.value)*WU));inp.onchange=()=>setP(key,Math.round(parseFloat(inp.value)*WU));
    wrap.appendChild(auto);wrap.append(" auto ");wrap.appendChild(inp);const em=document.createElement("em");em.textContent="WU";wrap.appendChild(em);g.appendChild(field(lab,wrap));}
  if(PI){const n=document.createElement("p");n.className="note";const fl=PI.minF!==PI.maxF?`floor moves ${fmt(PI.minF)}–${fmt(PI.maxF)} WU`:"",ce=PI.minC!==PI.maxC?`ceiling moves ${fmt(PI.minC)}–${fmt(PI.maxC)} WU`:"";
    n.textContent=(fl||ce?`Travel: ${[fl,ce].filter(Boolean).join(", ")}.`:"This platform doesn't move yet: tick “Rises from floor” or “Lowers from ceiling”.")+" Auto limits come from the neighbouring polygons, the way Aleph One works them out.";g.appendChild(n);}
  g.appendChild(field("Tag",numInput("plTag",pf.tag,"1",v=>setP("tag",v|0))));
  p.appendChild(g);
  for(const [title,list] of PLAT_FLAG_GROUPS){const gg=group(title);const d=document.createElement("div");d.className="checks";
    for(const [bit,lab] of list){const l=document.createElement("label");const i=document.createElement("input");i.type="checkbox";i.id="plf"+bit;i.checked=!!((pf.flags>>>0)&(1<<bit));
      i.onchange=()=>{pushUndo();all(q=>{const c={...PLAT_DEFAULT(),...(q.plat||{})};c.flags=i.checked?((c.flags>>>0)|(1<<bit))>>>0:((c.flags>>>0)&~(1<<bit))>>>0;q.plat=c;});changed();};
      l.appendChild(i);l.append(" "+lab);d.appendChild(l);}
    gg.appendChild(d);p.appendChild(gg);}
}
function liquidSection(items,one,p){
  const all=fn=>items.forEach(fn);const m=one.media;
  const g=group("Liquid");
  g.appendChild(field("Liquid",sel_("lqType",[["-1","None"],...MEDIA_TYPES],m?m.type:-1,v=>{pushUndo();all(q=>{if(+v<0)delete q.media;else q.media={...(q.media||{low:q.floor+WU/2,high:q.floor+WU/2,dir:0,speed:0,flags:0}),type:+v};});changed();})));
  if(m){
    const tide=m.low!==m.high;
    g.appendChild(field(tide?"High tide":"Surface",wuInput("lqHigh",()=>m.high,v=>all(q=>{if(!q.media)return;const t=q.media.low!==q.media.high;q.media={...q.media,high:v};if(!t)q.media.low=v;delete q.media.li;})),"WU"));
    if(tide)g.appendChild(field("Low tide",wuInput("lqLow",()=>m.low,v=>all(q=>{if(q.media)q.media={...q.media,low:v};})),"WU"));
    const tl=document.createElement("label");tl.className="checks";const ti=document.createElement("input");ti.type="checkbox";ti.id="lqTide";ti.checked=tide;
    ti.onchange=()=>{pushUndo();all(q=>{if(!q.media)return;q.media={...q.media,low:ti.checked?q.media.high-WU/2:q.media.high};});changed();};tl.appendChild(ti);tl.append(" Rises and falls (tide follows a light)");g.appendChild(tl);
    g.appendChild(field("Current toward",numInput("lqDir",m.dir||0,"15",v=>{pushUndo();all(q=>{if(q.media)q.media={...q.media,dir:((Math.round(v)%360)+360)%360};});changed();}),"°"));
    g.appendChild(field("Current speed",numInput("lqSpd",m.speed||0,"1",v=>{pushUndo();all(q=>{if(q.media)q.media={...q.media,speed:clamp(v|0,0,512)};});changed();}),"units"));
    const n=document.createElement("p");n.className="note";n.textContent=m.high<=one.floor?"The surface is below the floor, so the liquid won't show.":`Liquid is ${fmt(m.high-one.floor)} WU deep here.`;g.appendChild(n);
  }
  p.appendChild(g);
}

// =============================================================== terminals
const TERM_HELP=`#LOGON 1600        logon screen with picture 1600
#PICT 10011        a page showing picture 10011 (add RIGHT or CENTER)
#INFORMATION       a full-width text page
#CHECKPOINT 3      a page showing map spot (goal) 3
#INTERLEVEL TELEPORT 5   send the player to level 5
#INTRALEVEL TELEPORT 120 send the player to polygon 120
#SOUND n  #TRACK n  #MOVIE n  #STATIC n  #TAG n  #CAMERA n
#UNFINISHED / #SUCCESS / #FAILURE   what shows before / after the mission is done
#LOGOFF 1600       logoff screen      #END   end of the terminal
Text: $B bold $b, $I italic $i, $U underline $u, $C0–$C7 colour. Lines starting with ; are comments.`;
function openTerminals(start=0){
  doc.terms=doc.terms||[];let cur=Math.min(start,Math.max(0,doc.terms.length-1));
  const body=document.createElement("div");body.className="termed";
  body.innerHTML=`<div class="termlist" id="tmList"></div><div class="termmain"><textarea id="tmText" spellcheck="false"></textarea><div class="termerr" id="tmErr"></div><details><summary>Commands</summary><pre class="termhelp"></pre></details></div><div class="termprev" id="tmPrev" aria-label="Preview"></div>`;
  body.querySelector(".termhelp").textContent=TERM_HELP;
  const ta=body.querySelector("#tmText"),list=body.querySelector("#tmList"),err=body.querySelector("#tmErr"),prev=body.querySelector("#tmPrev");
  const drafts=doc.terms.map(t=>t.script);
  function renderList(){list.innerHTML="";drafts.forEach((s,i)=>{const b=button(`Terminal ${i}`,()=>{drafts[cur]=ta.value;cur=i;load();});b.className="btn"+(i===cur?" on":"");b.title=(s.split("\n").find(l=>l&&!l.startsWith("#"))||"").slice(0,60);list.appendChild(b);});
    list.appendChild(button("+ New terminal",()=>{if(cur<drafts.length)drafts[cur]=ta.value;drafts.push("#UNFINISHED\n#LOGON 1600\n#INFORMATION\nType the terminal text here.\n#LOGOFF 1600\n#END");cur=drafts.length-1;load();}));
    if(drafts.length)list.appendChild(button("Delete this one",()=>{drafts.splice(cur,1);cur=Math.max(0,cur-1);load();}));}
  let pv=0;
  async function preview(){const my=++pv;const r=compileTerminal(ta.value);err.textContent=r.errs.length?r.errs.join(" "):`${r.groups} page${r.groups===1?"":"s"}. Walls use terminal ${cur} through a Terminal control panel.`;err.className="termerr"+(r.errs.length?" bad":"");
    prev.innerHTML="";const lines=ta.value.split("\n");let pageEl=null;
    for(const line of lines){if(line.startsWith(";"))continue;
      if(line.startsWith("#")){pageEl=document.createElement("div");pageEl.className="tpage";const h=document.createElement("div");h.className="thead";h.textContent=line.trim();pageEl.appendChild(h);prev.appendChild(pageEl);
        const m=line.match(/^#(PICT|LOGON|LOGOFF)\s+(-?\d+)/i);if(m){const pic=pictureById(+m[2]);const box=document.createElement("div");box.className="tpic";
          if(pic){const cv=await pictToCanvas(pic);if(my!==pv)return;if(cv){const c2=document.createElement("canvas");c2.width=cv.width;c2.height=cv.height;c2.getContext("2d").drawImage(cv,0,0);box.appendChild(c2);}else box.textContent=`Picture ${m[2]} can't be shown`;}
          else{box.textContent=`Picture ${m[2]} isn't in this scenario yet`;box.classList.add("missing");}
          pageEl.appendChild(box);}
        continue;}
      if(!pageEl){pageEl=document.createElement("div");pageEl.className="tpage";prev.appendChild(pageEl);}
      const t=document.createElement("div");t.className="tline";t.textContent=line.replace(/\$[BbIiUu]|\$C[0-7]/g,"")||" ";pageEl.appendChild(t);}}
  function load(){renderList();ta.value=drafts[cur]??"";ta.disabled=!drafts.length;if(!drafts.length){prev.innerHTML="";err.textContent="No terminals yet. Add one, then put a Terminal control panel on a wall (right-click it in the 3D view) with this terminal's number.";}else preview();}
  let t0=null;ta.addEventListener("input",()=>{clearTimeout(t0);t0=setTimeout(preview,250);});
  load();
  openModal(`Terminals · ${doc.info.name}`,body,[button("Cancel",closeModal),button("Save terminals",()=>{if(cur<drafts.length)drafts[cur]=ta.value;pushUndo();doc.terms=drafts.map(s=>({script:s}));closeModal();changed();status(`Saved ${drafts.length} terminal${drafts.length===1?"":"s"}.`);},"primary")],{wide:true});
}

// =============================================================== pictures (chapter screens, terminal pictures)
const PIC_KINDS=[["chapter","Chapter screen (shown before a level)",1500],["logon","Logon / logoff screen",1600],["terminal","Terminal picture",10000],["other","Other",1]];
function picKind(id){return id>=1500&&id<1600?"chapter":id>=1600&&id<1700?"logon":id>=10000&&id<20000?"terminal":"other";}
function nextFreeId(base){let id=base;while(pictureById(id))id++;return id;}
function openPictures(){
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="10px";
  const intro=document.createElement("p");intro.className="note";
  intro.textContent="Pictures are stored in the map file the way Bungie's were. A chapter screen is shown before the level whose number matches: picture 1500 before level 0, 1501 before level 1, and so on. Terminals show pictures by number with #PICT, #LOGON and #LOGOFF.";body.appendChild(intro);
  const addRow=document.createElement("div");addRow.className="row";addRow.style.alignItems="center";
  const kindSel=sel_("picKind",PIC_KINDS.map(k=>[k[0],k[1]]),"terminal",()=>{idIn.value=defaultId();});
  const idIn=document.createElement("input");idIn.type="number";idIn.id="picId";idIn.style.width="90px";
  const defaultId=()=>{const k=kindSel.value;if(k==="chapter")return 1500+scenario.cur;const base=PIC_KINDS.find(x=>x[0]===k)[2];return nextFreeId(base);};idIn.value=defaultId();
  const fileIn=document.createElement("input");fileIn.type="file";fileIn.accept="image/*";fileIn.hidden=true;fileIn.id="picFile";
  fileIn.onchange=async()=>{const f=fileIn.files[0];fileIn.value="";if(!f)return;
    try{const bmp=await createImageBitmap(f);const k=kindSel.value;const max=k==="chapter"?[640,480]:k==="logon"?[320,240]:[640,480];
      const sc=Math.min(1,max[0]/bmp.width,max[1]/bmp.height);const w=Math.max(1,Math.round(bmp.width*sc)),h=Math.max(1,Math.round(bmp.height*sc));
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;const g=cv.getContext("2d");g.drawImage(bmp,0,0,w,h);
      const data=encodePict(g.getImageData(0,0,w,h));const id=parseInt(idIn.value)||defaultId();
      pushUndo();setPicture(id,f.name.replace(/\.[^.]+$/,""),data);status(`Added picture ${id} (${w}×${h}).`);render();idIn.value=defaultId();}
    catch(e){toast("Couldn't use that image: "+e.message);}};
  addRow.appendChild(kindSel);addRow.append(" number ");addRow.appendChild(idIn);addRow.appendChild(fileIn);addRow.appendChild(button("Add image…",()=>fileIn.click(),"primary"));
  body.appendChild(addRow);
  const grid=document.createElement("div");grid.className="picgrid";body.appendChild(grid);
  async function render(){grid.innerHTML="";
    if(!scenario.pictures.length){const e=document.createElement("div");e.className="empty";e.textContent="No pictures yet. Open a map that has them (like Infinity's Map.sceA) or add your own images.";grid.appendChild(e);return;}
    for(const pic of scenario.pictures){const card=document.createElement("div");card.className="piccard";
      const cap=document.createElement("div");cap.className="piccap";const kind=picKind(pic.id);
      cap.innerHTML=`<b></b><span></span>`;cap.querySelector("b").textContent=pic.id;
      cap.querySelector("span").textContent=kind==="chapter"?`Chapter screen · level ${pic.id-1500}${scenario.levels[pic.id-1500]?": "+scenario.levels[pic.id-1500].doc.info.name:""}`:kind==="logon"?"Logon / logoff":kind==="terminal"?"Terminal picture":(pic.id>=20000?"Alternate version":"Other");
      const box=document.createElement("div");box.className="picbox";card.appendChild(box);card.appendChild(cap);
      const del=button("Remove",()=>{pushUndo();scenario.pictures=scenario.pictures.filter(x=>x!==pic);saveScenarioSoon();render();});del.classList.add("picdel");card.appendChild(del);
      grid.appendChild(card);
      pictToCanvas(pic).then(cv=>{if(cv){const c2=document.createElement("canvas");c2.width=cv.width;c2.height=cv.height;c2.getContext("2d").drawImage(cv,0,0);box.appendChild(c2);}else box.textContent="Can't preview";});}}
  render();
  openModal(`Pictures · ${scenario.pictures.length}`,body,[button("Done",()=>{closeModal();changed();},"primary")],{wide:true});
}

// =============================================================== levels tab (the scenario)
function renderLevels(p){
  const h=document.createElement("h3");h.innerHTML=`Scenario <small></small>`;h.querySelector("small").textContent=`${scenario.levels.length} level${scenario.levels.length===1?"":"s"} · ${scenario.pictures.length} pictures`;p.appendChild(h);
  const g=group();const nm=document.createElement("input");nm.id="scName";nm.value=scenario.name;nm.maxLength=60;nm.onchange=()=>{scenario.name=nm.value.trim()||"Untitled Scenario";saveScenarioSoon();};
  g.appendChild(field("Name",nm));p.appendChild(g);
  const gl=group("Levels");const list=document.createElement("div");list.className="lvlist";
  scenario.levels.forEach((L,i)=>{const d=i===scenario.cur?doc:L.doc;const row=document.createElement("div");row.className="lvrow"+(i===scenario.cur?" on":"");
    const b=document.createElement("button");b.className="lvname";b.innerHTML=`<b></b><span></span>`;b.querySelector("b").textContent=`${i}. ${d.info.name}`;
    const bits=[envName(d.info.game,d.info.env),(d.info.entry&1)?"solo":"net",d.terms&&d.terms.length?`${d.terms.length} terminal${d.terms.length>1?"s":""}`:"",pictureById(1500+i)?"chapter screen":"",d.physics&&d.physics.mode!=="none"?"own physics":""].filter(Boolean);
    b.querySelector("span").textContent=bits.join(" · ");b.onclick=()=>switchLevel(i);row.appendChild(b);
    const ctl=document.createElement("div");ctl.className="lvctl";
    for(const [lab,fn,title] of [["↑",()=>moveLevel(i,-1),"Move up"],["↓",()=>moveLevel(i,1),"Move down"],["⧉",()=>{syncLevel();addLevel(deserialize(serialize(d)),{at:i+1});},"Duplicate"],["✕",()=>confirmBox("Remove this level?",`“${d.info.name}” will be removed from the scenario. This can't be undone.`,"Remove",()=>removeLevel(i)),"Remove"]]){
      const x=button(lab,fn);x.title=title;x.setAttribute("aria-label",`${title} level ${i}`);ctl.appendChild(x);}
    row.appendChild(ctl);list.appendChild(row);});
  gl.appendChild(list);
  const r=document.createElement("div");r.className="row";r.appendChild(button("New level…",openNewLevel));r.appendChild(button("Open map file…",()=>$("fileIn").click()));gl.appendChild(r);
  const nn=document.createElement("p");nn.className="note";nn.textContent="Level order is play order. Terminals send players to a level by its number here.";gl.appendChild(nn);p.appendChild(gl);
  const gp=group("Pictures");const pn=document.createElement("p");pn.className="note";const ch=scenario.pictures.filter(x=>picKind(x.id)==="chapter").length;
  pn.textContent=`${scenario.pictures.length} picture${scenario.pictures.length===1?"":"s"}: ${ch} chapter screen${ch===1?"":"s"}, the rest for terminals.`;gp.appendChild(pn);gp.appendChild(button("Manage pictures…",openPictures));p.appendChild(gp);
  const gy=group("Physics");const yn=document.createElement("p");yn.className="note";
  yn.textContent="Load a physics file (like Physics Models/Standard.phyA, or one made in an Anvil-style tool) to embed it in levels. Each level picks its physics in the Level tab.";gy.appendChild(yn);
  for(const lib of scenario.physicsLib){const row=document.createElement("div");row.className="row";row.style.alignItems="center";const s=document.createElement("span");s.textContent=lib.name;s.style.flex="1";row.appendChild(s);
    row.appendChild(button("Remove",()=>{scenario.physicsLib=scenario.physicsLib.filter(x=>x!==lib);saveScenarioSoon();renderPane();}));gy.appendChild(row);}
  const pin=document.createElement("input");pin.type="file";pin.hidden=true;pin.id="physIn";
  pin.onchange=async()=>{const f=pin.files[0];pin.value="";if(!f)return;try{const chunks=parsePhysicsFile(await f.arrayBuffer());const name=f.name.replace(/\.[^.]+$/,"");scenario.physicsLib=scenario.physicsLib.filter(x=>x.name!==name);scenario.physicsLib.push({name,chunks});saveScenarioSoon();renderPane();toast(`Loaded physics “${name}”.`);}catch(e){toast("Couldn't read that physics file: "+e.message);}};
  gy.appendChild(pin);gy.appendChild(button("Load physics file…",()=>pin.click()));p.appendChild(gy);
}
function levelExtras(p){
  const i=doc.info;
  const gt=group("Terminals");const tn=document.createElement("p");tn.className="note";const nT=(doc.terms||[]).length;
  tn.textContent=nT?`${nT} terminal${nT>1?"s":""} on this level.`:"No terminals yet.";gt.appendChild(tn);gt.appendChild(button("Edit terminals…",()=>openTerminals(0)));p.appendChild(gt);
  const gc=group("Chapter screen");const cn=document.createElement("p");cn.className="note";const pic=pictureById(1500+scenario.cur);
  cn.textContent=pic?`Picture ${1500+scenario.cur} shows before this level.`:`None. Add picture ${1500+scenario.cur} in Pictures to show one before this level.`;gc.appendChild(cn);
  if(pic){const box=document.createElement("div");box.className="picbox small";gc.appendChild(box);pictToCanvas(pic).then(cv=>{if(cv){const c2=document.createElement("canvas");c2.width=cv.width;c2.height=cv.height;c2.getContext("2d").drawImage(cv,0,0);box.appendChild(c2);}});}
  gc.appendChild(button("Pictures…",openPictures));p.appendChild(gc);
  const gy=group("Physics");const opts2=[["none","Scenario default (nothing embedded)"]];if(doc.physics&&doc.physics.keep)opts2.push(["keep","This level's own physics"]);for(const l of scenario.physicsLib)opts2.push(["lib:"+l.name,"Embed: "+l.name]);
  const curv=doc.physics?(doc.physics.mode==="lib"?"lib:"+doc.physics.lib:doc.physics.mode):"none";
  gy.appendChild(field("Physics",sel_("lvPhys",opts2,curv,v=>{pushUndo();const keep=doc.physics&&doc.physics.keep;doc.physics=v.startsWith("lib:")?{mode:"lib",lib:v.slice(4),keep}:{mode:v,keep};changed();})));p.appendChild(gy);
}

// =============================================================== export dialog
function openExport(){
  issues=validate();
  const blocking=issues.filter(i=>i.lv==="error"&&!/corners$/.test(i.title));
  if(blocking.length){setTab("issues");toast(`Fix ${blocking.length} error${blocking.length>1?"s":""} on this level before exporting.`);return;}
  const n=scenario.levels.length;
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="10px";
  body.innerHTML=`<label class="checks"><input type="radio" name="exWhat" id="exAll" ${n>1?"checked":""}> <span><b>Whole scenario</b>: all ${n} level${n>1?"s":""}, with their terminals and physics, plus ${scenario.pictures.length} picture${scenario.pictures.length===1?"":"s"}</span></label>
  <label class="checks"><input type="radio" name="exWhat" id="exOne" ${n>1?"":"checked"}> <span><b>Only “${doc.info.name.replace(/[<>&]/g,"")}”</b> (level ${scenario.cur})</span></label>
  <p class="note">${inClaude()?"You get a zip with the map file and a short readme.":"You get the map file (.sceA)."} In Aleph One, put the map in your scenario's folder in place of <b>Map.sceA</b> (keep a copy of the original), or select it as the map file. Pictures travel inside the map file, as in Bungie's.</p>`;
  openModal("Export for Aleph One",body,[button("Cancel",closeModal),button("Export",()=>{const allLv=body.querySelector("#exAll").checked;closeModal();doExport(allLv);},"primary")]);
}
function doExport(all){
  syncLevel();
  let split=0;
  const idxs=all?scenario.levels.map((_,i)=>i):[scenario.cur];
  for(const i of idxs){const d=scenario.levels[i].doc;const save=doc;doc=d;for(const q of [...doc.polys])if(q.verts.length>8){split++;splitPolygon(q);}doc=save;}
  if(split)changed();
  let res;try{res=buildScenarioFile(idxs);}catch(e){toast("Export failed: "+e.message);return;}
  const name=safeName(all?scenario.name:doc.info.name);
  const st=res.stats.reduce((a,s)=>({polys:a.polys+s.polys,objects:a.objects+s.objects,platforms:a.platforms+s.platforms,liquids:a.liquids+s.liquids,terminals:a.terminals+s.terminals}),{polys:0,objects:0,platforms:0,liquids:0,terminals:0});
  const termErrs=res.stats.flatMap(s=>s.termErrs);
  const readme=new TextEncoder().encode(`${all?scenario.name:doc.info.name}\r\nMade with Forge Remake.\r\n\r\n${name}.sceA is a Marathon 2 / Infinity map file for Aleph One${res.mac?" (MacBinary, with its pictures inside)":""}.\r\nTo play it: put it in your scenario folder (for example Marathon Infinity's) in place of Map.sceA,\r\nor choose it as the map file. Keep a copy of the original map.\r\n\r\n${idxs.length} level${idxs.length>1?"s":""}, ${st.polys} polygons, ${st.platforms} doors/lifts, ${st.liquids} liquids, ${st.terminals} terminals, ${st.objects} objects, ${scenario.pictures.length} pictures.\r\n`);
  // claude.ai can't hand out .sceA files, so there the map goes inside a zip; elsewhere it's saved as is
  const direct=!inClaude();const zip=direct?null:zipFiles([{name:name+".sceA",data:res.file},{name:"README.txt",data:readme}]);
  status(`Built ${name}.sceA: ${idxs.length} level${idxs.length>1?"s":""}, ${st.polys} polygons, ${st.platforms} doors/lifts, ${st.terminals} terminals${split?`; split ${split} large polygon${split>1?"s":""}`:""}.`+(termErrs.length?" Terminal problems: "+termErrs[0]:""));
  if(direct)offerFile(name+".sceA",res.file);else offerFile(name+".zip",zip);
}
function saveProject(){syncLevel();offerFile(safeName(scenario.name)+".forge.json",serializeScenario());}

// =============================================================== opening files
async function openFileBuffer(buf,fname){
  const head=new TextDecoder().decode(new Uint8Array(buf.slice(0,200))).trim();
  if(head.startsWith("{")){const o=JSON.parse(new TextDecoder().decode(buf));
    if(o.format==="forge-scenario"){syncLevel();loadScenarioObject(o);afterLoad(`Opened scenario “${scenario.name}”.`);fitView();saveScenarioSoon();return;}
    const d=deserialize(o);addLevel(d);toast(`Added “${d.info.name}” as level ${scenario.cur}.`);return;}
  const wad=parseWad(buf);
  const lv=wad.levels.filter(l=>l.chunks.POLY);
  if(!lv.length)throw new Error("No levels found in that file.");
  if(lv.length===1&&!wad.pictures.length){addImported(lv[0],fname,wad,false);return;}
  const body=document.createElement("div");body.style.display="flex";body.style.flexDirection="column";body.style.gap="10px";
  const n=document.createElement("p");n.className="note";n.textContent=`${fname} holds ${lv.length} level${lv.length>1?"s":""}${wad.pictures.length?` and ${wad.pictures.length} pictures`:""}. Open them all as a new scenario, or add single levels to the one you're editing.`;body.appendChild(n);
  const allB=button(`Open all ${lv.length} as a new scenario`,()=>{closeModal();openWholeMap(wad,lv,fname);},"primary");body.appendChild(allB);
  const list=document.createElement("div");list.className="levellist";
  lv.forEach(l=>list.appendChild(button(`Add level ${l.index}: ${l.name}`,()=>{closeModal();addImported(l,fname,wad,true);})));
  body.appendChild(list);
  openModal("Open map file",body,[]);
}
function addImported(l,fname,wad,withPics){
  const r=levelToDoc(l);
  if(withPics&&wad.pictures.length){const used=new Set([1500+l.index]);for(const t of r.doc.terms||[]){const c=compileTerminal(t.script);for(const id of c.picts||[])used.add(id);}
    let n=0;for(const p of wad.pictures)if(used.has(p.id)||used.has(p.id-10000)){setPicture(p.id===1500+l.index?1500+scenario.levels.length:p.id,p.name,p.data);n++;}}
  addLevel(r.doc);
  toast(`Added “${l.name}” as level ${scenario.cur}${r.notes.length?". "+r.notes.join("; "):""}.`);
}
function openWholeMap(wad,lv,fname){
  syncLevel();
  const levels=[];const notes=new Set();
  for(const l of lv){const r=levelToDoc(l);levels.push(wrapLevel(r.doc));r.notes.forEach(x=>notes.add(x));}
  scenario.name=(wad.name&&wad.name!=="Merged Map Files"?wad.name:fname.replace(/\.[^.]+$/,"")).slice(0,60);
  scenario.levels=levels;scenario.cur=0;scenario.pictures=wad.pictures.map(p=>({id:p.id,name:p.name,data:p.data})).sort((a,b)=>a.id-b.id);scenario.resources=(wad.extraRes||[]).map(r=>({type:r.type,id:r.id,name:r.name,data:r.data}));
  pictCanvasCache.clear();
  const N=curLevel();doc=N.doc;undoStack=N.undo;redoStack=N.redo;resetPolyRefs();
  afterLoad(`Opened ${levels.length} levels and ${scenario.pictures.length} pictures from ${fname}.`);fitView();saveScenarioSoon();setTab("levels");
  if(notes.size)toast([...notes].join("; "));
}

// =============================================================== wiring
function setUI(style){opts.uiStyle=style;document.documentElement.setAttribute("data-ui",style);$("uiModern").setAttribute("aria-pressed",style==="modern");$("uiRetro").setAttribute("aria-pressed",style==="retro");readPalette();savePrefs();redraw();renderLegend();}
$("uiModern").onclick=()=>setUI("modern");$("uiRetro").onclick=()=>setUI("retro");
$("bNew").onclick=openNewLevel;$("bShapes").onclick=()=>openShapesDialog(false);$("bPaint").onclick=()=>{paletteShown=true;open3D();};
$("bOpen").onclick=()=>$("fileIn").click();
$("bSave").onclick=saveProject;$("bExport").onclick=openExport;
$("bUndo").onclick=undo;$("bRedo").onclick=redo;$("bGen").onclick=openGenerate;$("b3d").onclick=open3D;
$("tLevels").onclick=()=>setTab("levels");$("tInspect").onclick=()=>setTab("inspect");$("tLevel").onclick=()=>setTab("level");$("tIssues").onclick=()=>setTab("issues");
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{readPalette();redraw();});
new MutationObserver(()=>{readPalette();redraw();}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
new ResizeObserver(resize).observe($("canvasbox"));

loadPrefs();
document.documentElement.setAttribute("data-ui",opts.uiStyle);
// start with the sample (or the last single level from an older version), then restore the saved scenario if there is one
let legacy=null;try{const s=localStorage.getItem("forge-remake-doc");if(s){const d=deserialize(s);if(d.polys.length)legacy=d;}}catch(e){}
if(legacy)doc=legacy;else buildFromSpec(sampleSpec(),{replace:true});
scenario.name=legacy?doc.info.name:"Cistern (sample)";scenario.levels=[wrapLevel(doc)];scenario.cur=0;
setUI(opts.uiStyle);renderTools();setTool("select");changed();
status(legacy?"Restored your last level.":"Loaded the sample level “Cistern”. Press Tab to walk through it, P to paint it, or New to start fresh.");
(async()=>{try{const s=await idb.get("scenario");if(s){loadScenarioObject(JSON.parse(s));afterLoad(`Restored “${scenario.name}” (${scenario.levels.length} level${scenario.levels.length>1?"s":""}).`);fitView();}}catch(e){}})();
restoreShapes().then(()=>{refreshShapesUI();let seen=false;try{seen=!!localStorage.getItem("forge-remake-setup");}catch(e){}if(!seen&&!GAME_IDS.some(g=>shapeStore[g])&&$("modal").hidden)openShapesDialog(true);});
requestAnimationFrame(()=>{resize();fitView();});
window.__forge={scenario,switchLevel,openFileBuffer,openWholeMap,buildScenarioFile,serializeScenario,loadScenarioObject,compileTerminal,parseTerminalChunk,decodePict,encodePict,parseResourceFork,platformInfo,openTerminals,openPictures,installShapes,shapeStore,texCount,texCanvasFor,openShapesDialog,get doc(){return doc;},buildMapChunks,buildWadFile,validate,serialize,parseWad,levelToDoc,buildFromSpec,randomSpec,sampleSpec,applySpec,autoLabels,walkDistances,parseLabel,setTool,texPalette,doExport,openGenerate,newDoc,setDoc:d=>{doc=d;changed();}};
