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
["Do not lose heart and do not grieve.","Qur’an 3:139"],
["Two blessings many people lose: health and free time.","Bukhari"]
];
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
function state(){return new Promise(function(res){var r=indexedDB.open("ist",1);r.onupgradeneeded=function(){r.result.createObjectStore("kv")};r.onerror=function(){res(null)};r.onsuccess=function(){try{var g=r.result.transaction("kv").objectStore("kv").get("state");g.onsuccess=function(){res(g.result||null)};g.onerror=function(){res(null)}}catch(e){res(null)}}})}
function key(d){return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()}
self.addEventListener("push",function(e){
e.waitUntil(state().then(function(s){
var d=new Date(),h=d.getHours(),title=h<11?"Start your day":h<17?"Midday check-in":h<21?"Evening check-in":"Before you sleep";
var q=Q[(Math.floor(d/864e5)*3+Math.floor(h/8))%Q.length],body=q[0]+" ("+q[1]+")";
if(s&&s.habits){var done=(s.log&&s.log[key(d)])||[],left=s.habits.filter(function(x){return done.indexOf(x.id)<0});
if(!left.length)body="Everything is ticked today, mashaAllah.\n"+body;
else body+="\nStill open: "+left.slice(0,3).map(function(x){return x.name}).join(", ")+(left.length>3?" +"+(left.length-3)+" more":"")}
return self.registration.showNotification(title,{body:body,icon:"icon-180.png",badge:"icon-180.png",tag:"istiqamah"})}))});
self.addEventListener("notificationclick",function(e){e.notification.close();
e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if("focus" in l[i])return l[i].focus()}return self.clients.openWindow(self.registration.scope)}))});
