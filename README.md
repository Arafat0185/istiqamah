Istiqamah

A minimal, installable habit tracker for building consistency. Track daily habits, memorise and revise Qur'an with a visual progress map, reflect weekly, and stay on track with simple reminders.

Istiqamah means steadiness: small things, done every day.

Features

Habits

Daily checklist with satisfying tick animations and streaks
Fully editable: add, remove and reorder your own habits
Motivation quote of the day

Memorisation

Progress map of all 30 juz, with a tile for every surah inside each one
Track by ayah, with a daily target you choose
Revision queue that moves to the next surah as you finish
Progress graph with a trend line

Reflect

A new question each week, with every answer saved and dated
Look back over your history any time

Reminders

Push notifications for habits, memorisation and prayer times
Simple, short wording

Your data

Stored on your device, with backup and restore through a sync code
Stack
Single-file HTML, CSS and JS PWA with no framework or build step
localStorage and IndexedDB for data
Service worker for notifications
Cloudflare Worker with KV for scheduled push (Web Push, VAPID)
Hosted on GitHub Pages
Files
File	Purpose
index.html	The whole app
sw.js	Service worker for notifications
config.js	Your Worker URL
prayer.js	Prayer timetable data
manifest.webmanifest	Home Screen install info
worker/worker.js	Cloudflare Worker for push
widget/prayer-widget.js	Optional iOS Home Screen widget (Scriptable)
Setup
Upload the files to a GitHub repo and enable Pages (Settings, Pages, deploy from main).
Open the site in Safari, tap Share, then Add to Home Screen.
For notifications, deploy worker/worker.js to Cloudflare, add a KV namespace bound as KV and a cron trigger of */5 * * * *, then put the Worker URL in config.js (no trailing slash).
In the app, open the Prayer tab and turn on reminders.

Notifications need iOS 16.4 or later and the app added to the Home Screen.

Widget

widget/prayer-widget.js runs in the free Scriptable app. Paste it in, set SITE to your own site address, and add a medium Scriptable widget to your Home Screen.

Privacy

No accounts, no tracking. Everything stays on your device unless you choose to back it up.
