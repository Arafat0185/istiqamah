var Q=[["Qur’an 94:6","Indeed, with hardship comes ease."],["Qur’an 2:152","Remember Me, and I will remember you."],["Bukhari & Muslim","The most beloved deeds to Allah are the consistent ones, even if small."],["Qur’an 13:28","Verily, in the remembrance of Allah do hearts find rest."],["Qur’an 2:153","Indeed, Allah is with the patient."]];
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
self.addEventListener("push",function(e){var d=null;try{d=e.data?e.data.json():null}catch(x){}
var q=Q[Math.floor(Math.random()*Q.length)],has=d&&d.ti;
e.waitUntil(self.registration.showNotification(has?d.ti:q[0],{body:has?(d.bo||""):q[1],icon:"icon-180.png",badge:"icon-180.png",tag:(d&&d.tag)||"n"}))});
self.addEventListener("notificationclick",function(e){e.notification.close();
e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(function(l){for(var i=0;i<l.length;i++){if("focus" in l[i])return l[i].focus()}return self.clients.openWindow(self.registration.scope+"#prayer")}))});
