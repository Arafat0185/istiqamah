const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb=s=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
const OK=/^https:\/\/[^\/]*(apple\.com|googleapis\.com|mozilla\.com|windows\.com)\//;
const J=(o,s)=>new Response(JSON.stringify(o),{status:s||200,headers:{...H,"Content-Type":"application/json"}});
async function keys(env){
let j=await env.KV.get("vapid","json");
if(!j){const kp=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign"]);
j={jwk:await crypto.subtle.exportKey("jwk",kp.privateKey),pub:b64u(await crypto.subtle.exportKey("raw",kp.publicKey))};
await env.KV.put("vapid",JSON.stringify(j))}
return j}
async function jwt(env,aud){
const {jwk}=await keys(env);
const k=await crypto.subtle.importKey("jwk",jwk,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
const enc=o=>b64u(new TextEncoder().encode(JSON.stringify(o)));
const data=enc({typ:"JWT",alg:"ES256"})+"."+enc({aud,exp:Math.floor(Date.now()/1000)+43200,sub:env.SUBJECT||"mailto:admin@example.com"});
const sig=await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},k,new TextEncoder().encode(data));
return data+"."+b64u(sig)}
const cat=(...a)=>{const o=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let i=0;a.forEach(x=>{o.set(x,i);i+=x.length});return o};
async function hkdf(salt,ikm,info,len){
return new Uint8Array(await crypto.subtle.deriveBits({name:"HKDF",hash:"SHA-256",salt,info},await crypto.subtle.importKey("raw",ikm,"HKDF",false,["deriveBits"]),len*8))}
async function encrypt(sub,text){
const enc=new TextEncoder(),ua=unb(sub.keys.p256dh),auth=unb(sub.keys.auth);
const kp=await crypto.subtle.generateKey({name:"ECDH",namedCurve:"P-256"},true,["deriveBits"]);
const asPub=new Uint8Array(await crypto.subtle.exportKey("raw",kp.publicKey));
const uaKey=await crypto.subtle.importKey("raw",ua,{name:"ECDH",namedCurve:"P-256"},false,[]);
const secret=new Uint8Array(await crypto.subtle.deriveBits({name:"ECDH",public:uaKey},kp.privateKey,256));
const ikm=await hkdf(auth,secret,cat(enc.encode("WebPush: info\0"),ua,asPub),32);
const salt=crypto.getRandomValues(new Uint8Array(16));
const cek=await hkdf(salt,ikm,enc.encode("Content-Encoding: aes128gcm\0"),16);
const nonce=await hkdf(salt,ikm,enc.encode("Content-Encoding: nonce\0"),12);
const key=await crypto.subtle.importKey("raw",cek,"AES-GCM",false,["encrypt"]);
const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv:nonce},key,cat(enc.encode(text),new Uint8Array([2]))));
return cat(salt,new Uint8Array([0,0,16,0]),new Uint8Array([asPub.length]),asPub,ct)}
async function push(env,sub){
const {pub}=await keys(env),aud=new URL(sub.endpoint).origin;
const h={Authorization:"vapid t="+await jwt(env,aud)+", k="+pub,TTL:"3600",Urgency:"high"};
let body=null;
if(sub.keys&&sub.keys.p256dh&&sub.keys.auth){body=await encrypt(sub,'{"t":"tick"}');h["Content-Encoding"]="aes128gcm";h["Content-Type"]="application/octet-stream"}
return fetch(sub.endpoint,{method:"POST",headers:h,body})}
export default{
async fetch(req,env){
if(req.method==="OPTIONS")return new Response(null,{headers:H});
const u=new URL(req.url);
if(u.pathname==="/key")return new Response((await keys(env)).pub,{headers:H});
if(u.pathname==="/health"){const l=await env.KV.list({prefix:"s:"});return J({ok:1,subs:l.keys.length,cron:await env.KV.get("cron"),last:await env.KV.get("last","json")})}
if(req.method==="POST"&&(u.pathname==="/backup"||u.pathname==="/restore")){
let b;try{b=await req.json()}catch(e){return J({error:"bad json"},400)}
const c=String(b.code||"");if(c.length<20||c.length>200)return J({error:"bad code"},400);
const id="b:"+b64u(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(c))).slice(0,43);
if(u.pathname==="/backup"){if(JSON.stringify(b.data||{}).length>2e6)return J({error:"too big"},413);await env.KV.put(id,JSON.stringify({t:new Date().toISOString(),data:b.data}));return J({ok:1})}
const v=await env.KV.get(id,"json");return v?J(v):J({error:"none"},404)}
if(req.method==="POST"&&["/subscribe","/unsubscribe","/test"].includes(u.pathname)){
let b;try{b=await req.json()}catch(e){return J({error:"bad json"},400)}
if(!b.sub||!OK.test(b.sub.endpoint||""))return J({error:"bad endpoint"},400);
const id="s:"+b64u(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(b.sub.endpoint))).slice(0,32);
if(u.pathname==="/test"){try{const r=await push(env,b.sub);return J({status:r.status,body:(await r.text()).slice(0,200)})}catch(e){return J({status:0,body:String(e.message||e)})}}
if(u.pathname==="/unsubscribe")await env.KV.delete(id);
else await env.KV.put(id,JSON.stringify({sub:b.sub,times:(b.times||[]).slice(0,6),tz:b.tz||"UTC"}));
return J({ok:1})}
return new Response("Istiqamah push",{headers:H})},
async scheduled(ev,env){
const now=new Date(),list=await env.KV.list({prefix:"s:"}),codes=[];
await env.KV.put("cron",now.toISOString());
for(const {name} of list.keys){
const s=await env.KV.get(name,"json");if(!s)continue;
let p;try{p=new Intl.DateTimeFormat("en-GB",{timeZone:s.tz,hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(now)}catch(e){continue}
const h=+p.find(x=>x.type==="hour").value%24,m=+p.find(x=>x.type==="minute").value,slot=h*4+Math.floor(m/15);
if(!(s.times||[]).some(t=>{const [a,b]=t.split(":").map(Number);return a*4+Math.floor(b/15)===slot}))continue;
try{const r=await push(env,s.sub);codes.push(r.status);if(r.status===404||r.status===410)await env.KV.delete(name)}catch(e){codes.push(0)}}
if(codes.length)await env.KV.put("last",JSON.stringify({t:now.toISOString(),sent:codes.length,codes}))}};
