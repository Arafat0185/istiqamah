var Q=[
["The most beloved deeds to Allah are the consistent ones, even if small.","Bukhari & Muslim"],
["Indeed, with hardship comes ease.","Qur’an 94:6"],
["Verily, in the remembrance of Allah do hearts find rest.","Qur’an 13:28"],
["Remember Me, and I will remember you.","Qur’an 2:152"],
["Whoever walks a path seeking knowledge, Allah makes easy for him a path to Paradise.","Muslim"],
["Allah does not burden a soul beyond what it can bear.","Qur’an 2:286"],
["Those who strive for Us, We will surely guide them to Our ways.","Qur’an 29:69"],
["The best of you are those who learn the Qur’an and teach it.","Bukhari"],
["And whoever relies upon Allah, He is sufficient for them.","Qur’an 65:3"],
["My Lord, increase me in knowledge.","Qur’an 20:114"],
["Do not despair of the mercy of Allah.","Qur’an 39:53"],
["Do not lose heart and do not grieve.","Qur’an 3:139"]
];
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
function state(){return new Promise(function(res){var r=indexedDB.open("ist",1);r.onupgradeneeded=function(){r.result.createObjectStore("kv")};r.onerror=function(){res({})};
r.onsuccess=function(){try{var t=r.result.transaction("kv"),o=t.objectStore("kv"),out={},a=o.get("state"),b=o.get("hifz"),c=o.get("reflect");a.onsuccess=function(){out.s=a.result};b.onsuccess=function(){out.h=b.result};c.onsuccess=function(){out.r=c.result};t.oncomplete=function(){res(out)};t.onerror=function(){res({})}}catch(e){res({})}}})}
function p2(n){return("0"+n).slice(-2)}
function iso(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}
function key(d){return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
function build(d,S,H,RF){
var h=d.getHours(),L=[],title,today=iso(d),yd=iso(new Date(d.getTime()-864e5)),hp=H&&H.d===today?H:null,n=hp?hp.n:0,g=H?H.goal:3,q=Q[(Math.floor(d/864e5)*3+Math.floor(h/8))%Q.length],qs=q[0]+" ("+q[1]+")";
function mon(x){var y=new Date(x.getFullYear(),x.getMonth(),x.getDate());y.setDate(y.getDate()-(y.getDay()+6)%7);return iso(y)}
if(h<11){title="Good morning";L.push(H&&H.why&&Math.floor(d/864e5)%2==0?"“"+H.why+"”":qs);if(H&&H.cur&&n<g)L.push("Today: "+H.cur+", from ayah "+H.nx+" · goal "+g+(g==1?" ayah":" ayat"));var mk=mon(d),wq=H?(H.wk===mk?(H.wd?"":H.wq):(H.wk===mon(new Date(d.getTime()-7*864e5))?H.wqn:"")):"";if(d.getDay()==1&&wq)L.push("New weekly question: "+wq)}
else if(h<16){title="Midday check-in";if(H&&H.rv&&!(hp&&hp.rd))L.push("Revise: "+H.rv);if(H&&n<g)L.push(n+" of "+g+" new ayat so far");if(!L.length)L.push(qs)}
else{title="Evening check-in";if(n<1)L.push(H&&H.st>0&&(H.d===today||H.d===yd)?"Keep your "+H.st+"-day streak alive. One ayah is enough.":"One ayah today keeps you going.");else if(n<g)L.push((g-n)+" more for today’s goal");else L.push("Goal done, mashaAllah")}
if(S&&S.habits){var done=(S.log&&S.log[key(d)])||[],left=S.habits.filter(function(x){return done.indexOf(x.id)<0});
left.sort(function(a,b){return(a.id=="quran"||a.id=="ilm"?0:1)-(b.id=="quran"||b.id=="ilm"?0:1)});
if(left.length)L.push("Still open: "+left.slice(0,3).map(function(x){return x.name}).join(", ")+(left.length>3?" +"+(left.length-3)+" more":""))}
if(h>=16&&!(RF&&RF.last===today))L.push("Take a minute to reflect on your day.");
return{title:title,body:L.join("\n")}}
self.addEventListener("push",function(e){
e.waitUntil(state().then(function(x){var m=build(new Date(),x.s,x.h,x.r);
return self.registration.showNotification(m.title,{body:m.body,icon:"icon-180.png",badge:"icon-180.png",tag:"istiqamah"})}))});
self.addEventListener("notificationclick",function(e){e.notification.close();
e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if("focus" in l[i])return l[i].focus()}return self.clients.openWindow(self.registration.scope)}))});
