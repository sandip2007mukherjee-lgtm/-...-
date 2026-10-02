import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore,collection,getDocs,query,orderBy,limit,doc,getDoc,setDoc,addDoc,deleteDoc,serverTimestamp,onSnapshot,writeBatch } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const ADMIN_EMAIL="sandip2007mukherjee@gmail.com";
const firebaseConfig={apiKey:"AIzaSyCrfUkI-ZE1jQ160INFxcUxhUwSiDvZbbk8",authDomain:"workshop-c2bd7.firebaseapp.com",projectId:"workshop-c2bd7",storageBucket:"workshop-c2bd7.firebasestorage.app",messagingSenderId:"813904771823",appId:"1:813904771823:web:35c19cf502b6dd8e1a791a"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id); const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
let unsubActivity=null,unsubPresence=null,activities=[],presence=[],usersMap=new Map(),currentUser=null,notesCache=[];
const emotionDefaults=[
["sad","🥺","মন খারাপ"],["alone","😔","একা লাগছে"],["hurt","💔","কষ্ট পেয়েছি"],["care","🫂","একটু আদর দরকার"],["miss","❤️","কাউকে মনে পড়ছে"],["quiet","🌙","চুপচাপ থাকতে ইচ্ছে করছে"],["happy","😊","ভালো আছি"],["love","🥰","প্রেমে আছি"],["fresh","✨","নতুন করে শুরু করতে চাই"],["cute","🌸","একটা সুন্দর কথা চাই"]
];

$("loginBtn").onclick=async()=>{const email=$("email").value.trim().toLowerCase(),password=$("password").value;if(email!==ADMIN_EMAIL){$("loginMsg").textContent="এই email-টি Admin নয়।";return}try{await signInWithEmailAndPassword(auth,email,password)}catch(e){$("loginMsg").textContent="Login failed: "+(e.code||e.message)}};
$("logoutBtn").onclick=()=>signOut(auth);
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
$("closeUser").onclick=()=>$("userModal").classList.add("hidden");
$("refreshBtn").onclick=()=>loadSnapshotData();
$("saveSettings").onclick=saveSettings;
$("addNoteBtn").onclick=()=>openNoteEditor();
$("closeNote").onclick=()=>$("noteModal").classList.add("hidden");
$("noteForm").onsubmit=saveNote;
$("seedBtn").onclick=seedAllNotes;
$("addEmotionBtn").onclick=addEmotion;
$("liveToggle").onclick=()=>toggleLive();

function switchTab(tab){document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.tab===tab));document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+tab));if(tab==="notes")loadNotes();}
async function loadSettings(){const s=await getDoc(doc(db,"settings","main"));if(s.exists()){const d=s.data();$("finalMessage").value=d.finalMessage||"";$("intensity").value=d.animationIntensity||"high";$("allowAnimation").checked=d.allowAnimation!==false;$("siteTitle").value=d.siteTitle||"একটু তোমার জন্য";}}
async function saveSettings(){await setDoc(doc(db,"settings","main"),{finalMessage:$("finalMessage").value.trim(),animationIntensity:$("intensity").value,allowAnimation:$("allowAnimation").checked,siteTitle:$("siteTitle").value.trim(),updatedAt:serverTimestamp()},{merge:true});$("saveMsg").textContent="Settings saved ✓";setTimeout(()=>$("saveMsg").textContent="",1800)}

function subscribeLive(){
  if(unsubActivity)unsubActivity(); if(unsubPresence)unsubPresence();
  unsubActivity=onSnapshot(query(collection(db,"activity"),orderBy("createdAt","desc"),limit(200)),snap=>{activities=snap.docs.map(d=>({id:d.id,...d.data()}));renderAll()},async()=>{const raw=await getDocs(collection(db,"activity"));activities=raw.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)).slice(0,200);renderAll()});
  unsubPresence=onSnapshot(collection(db,"presence"),snap=>{presence=snap.docs.map(d=>({id:d.id,...d.data()}));renderAll()});
}
function toggleLive(){const on=$("liveDot").classList.toggle("on");$("liveText").textContent=on?"LIVE MONITORING":"PAUSED";if(on)subscribeLive();else{unsubActivity?.();unsubPresence?.();unsubActivity=unsubPresence=null}}
function loadSnapshotData(){renderAll();loadNotes();loadEmotions();loadSettings()}
function renderAll(){
  const now=Date.now(); const live=presence.filter(x=>{const t=x.lastSeen?.toMillis?.()||0;return t&&now-t<45000&&x.online!==false});
  const users=new Map();
  [...activities,...presence].forEach(x=>{if(!x.sessionId)return;const old=users.get(x.sessionId)||{};users.set(x.sessionId,{...old,...x,lastSeen:x.lastSeen||old.lastSeen})});
  usersMap=users;
  $("usersCount").textContent=users.size;$("onlineCount").textContent=live.length;$("notesCount").textContent=activities.filter(x=>x.event==="note_viewed").length;$("finalCount").textContent=activities.filter(x=>x.event==="animation_triggered").length;
  $("activityBody").innerHTML=activities.slice(0,60).map(x=>`<tr><td><button class="userLink" data-session="${esc(x.sessionId)}">${esc(x.name||"Anonymous")}</button></td><td>${esc(x.emotionLabel||x.emotion||"-")}</td><td><span class="eventTag">${esc(eventLabel(x.event))}</span></td><td>${fmt(x.createdAt)}</td></tr>`).join("")||`<tr><td colspan="4">No activity yet.</td></tr>`;
  document.querySelectorAll(".userLink").forEach(b=>b.onclick=()=>openUser(b.dataset.session));
  const liveSorted=[...users.values()].sort((a,b)=>(b.lastSeen?.toMillis?.()||0)-(a.lastSeen?.toMillis?.()||0));
  $("userBody").innerHTML=liveSorted.map(u=>`<tr><td><button class="userLink" data-session="${esc(u.sessionId)}">${esc(u.name||"Anonymous")}</button></td><td>${esc(u.emotionLabel||u.emotion||"-")}</td><td>${esc(u.currentScreen||"-")}</td><td>${isLive(u)?"<span class='livePill'>● LIVE</span>":"Offline"}</td><td>${fmt(u.lastSeen||u.createdAt)}</td></tr>`).join("")||`<tr><td colspan="5">No users yet.</td></tr>`;
  document.querySelectorAll("#userBody .userLink").forEach(b=>b.onclick=()=>openUser(b.dataset.session));
}
function isLive(x){const t=x.lastSeen?.toMillis?.()||0;return t&&Date.now()-t<45000&&x.online!==false}
function eventLabel(e){return ({name_submitted:"নাম দিয়েছে",emotion_selected:"Emotion বেছে নিয়েছে",note_viewed:"Note দেখেছে",animation_triggered:"Final button",back_pressed:"Back চাপেছে",again_pressed:"আবার শুরু"}[e]||e||"-")}
function fmt(t){if(!t)return"-";try{return t.toDate().toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"})}catch{return"-"}}

function openUser(session){
  const user=usersMap.get(session)||{}; currentUser=session;
  const logs=activities.filter(x=>x.sessionId===session).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));
  $("modalTitle").textContent=user.name||"Anonymous User";
  $("modalMeta").textContent=`${isLive(user)?"● LIVE":"Offline"} • ${user.emotionLabel||"No emotion"} • ${user.currentScreen||"-"}`;
  $("userDetails").innerHTML=`<div class="detailGrid"><div><small>Session</small><b>${esc(session)}</b></div><div><small>Current emotion</small><b>${esc(user.emotionLabel||"-")}</b></div><div><small>Screen</small><b>${esc(user.currentScreen||"-")}</b></div><div><small>Last seen</small><b>${fmt(user.lastSeen)}</b></div></div><h3>Activity timeline</h3><div class="timeline">${logs.map(x=>`<div class="timelineItem"><span></span><div><b>${esc(eventLabel(x.event))}</b><p>${esc(x.note||x.emotionLabel||"")}</p><small>${fmt(x.createdAt)}</small></div></div>`).join("")||"<p>No activity.</p>"}</div>`;
  $("userModal").classList.remove("hidden");
}

async function loadNotes(){
  const snap=await getDocs(collection(db,"notes")); notesCache=snap.docs.map(d=>({id:d.id,...d.data()}));
  const grouped={};notesCache.forEach(n=>(grouped[n.emotionId]??=[]).push(n));
  $("noteStats").innerHTML=emotionDefaults.map(e=>`<div class="noteStat"><span>${e[1]} ${e[2]}</span><b>${(grouped[e[0]]||[]).length}/50</b><button data-em="${e[0]}">Manage</button></div>`).join("");
  document.querySelectorAll(".noteStat button").forEach(b=>b.onclick=()=>filterNotes(b.dataset.em));
  renderNotesList(notesCache);
}
function filterNotes(em){renderNotesList(notesCache.filter(n=>n.emotionId===em));$("notesFilter").value=em}
function renderNotesList(list){$("notesList").innerHTML=list.slice(0,100).map(n=>`<div class="noteRow"><div><span class="miniBadge">${esc(n.emotionId)}</span><p>${esc(n.text)}</p></div><div class="rowActions"><button data-edit="${n.id}">Edit</button><button class="danger" data-del="${n.id}">Delete</button></div></div>`).join("")||"<p>No notes found.</p>";document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const n=notesCache.find(x=>x.id===b.dataset.edit);openNoteEditor(n)});document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteNote(b.dataset.del))}
$("notesFilter").onchange=e=>filterNotes(e.target.value);
async function deleteNote(id){if(!confirm("এই note delete করবে?"))return;await deleteDoc(doc(db,"notes",id));await loadNotes()}
function openNoteEditor(n={}){$("noteId").value=n.id||"";$("noteEmotion").value=n.emotionId||"sad";$("noteText").value=n.text||"";$("noteActive").checked=n.active!==false;$("noteModal").classList.remove("hidden")}
async function saveNote(e){e.preventDefault();const id=$("noteId").value,data={emotionId:$("noteEmotion").value,text:$("noteText").value.trim(),active:$("noteActive").checked,updatedAt:serverTimestamp()};if(!data.text)return;if(id)await setDoc(doc(db,"notes",id),data,{merge:true});else await addDoc(collection(db,"notes"),{...data,createdAt:serverTimestamp()});$("noteModal").classList.add("hidden");await loadNotes()}

const seedParts={
sad:["আজ মনটা ভারী হলেও","কিছু কথা মনে চাপা থাকলেও","দিনটা প্রত্যাশামতো না গেলেও","হঠাৎ সবকিছু নিরর্থক লাগলেও","চুপচাপ থাকতে ইচ্ছে করলেও","পুরোনো কোনো কথা মনে পড়লেও","নিজেকে একটু হারিয়ে ফেললেও","হাসতে ইচ্ছে না করলেও","চারপাশটা একটু ফাঁকা লাগলেও","আজকের আকাশটা মলিন মনে হলেও"],
alone:["আজ চারপাশে মানুষ কম মনে হলেও","কথা বলার কাউকে খুঁজে না পেলেও","ভিড়ের মাঝেও একা লাগলেও","ফোনটা নীরব থাকলেও","নিজের কথাগুলো কাউকে বলতে না পারলেও","সন্ধ্যাটা খুব চুপচাপ হলেও","কেউ তোমাকে বুঝছে না মনে হলেও","আজ নিজের সঙ্গটাই অচেনা লাগলেও","একটা পরিচিত কণ্ঠ মিস করলেও","ঘরটা আজ একটু বেশি নীরব হলেও"],
hurt:["কোনো কথায় মনটা ভেঙে গেলেও","কেউ তোমাকে ভুল বুঝলেও","প্রত্যাশার জায়গায় কষ্ট এলেও","বিশ্বাসে একটু ফাটল ধরলেও","পুরোনো আঘাতটা মনে পড়লেও","কাউকে নিয়ে মন খারাপ হলেও","নিজেকে অন্যায়ভাবে দোষ দিলেও","কোনো আচরণ খুব বেশি কষ্ট দিলেও","মনের কথাটা ফিরিয়ে দিতে হলেও","আজ নিজের ভেতরটা অগোছালো হলেও"],
care:["আজ নিজের একটু যত্ন দরকার হলে","সবসময় শক্ত থাকতে ক্লান্ত লাগলে","একটু নরম কথা শুনতে ইচ্ছে করলে","নিজেকে জড়িয়ে ধরতে ইচ্ছে করলে","বিশ্রামের প্রয়োজন বুঝতে পারলে","আজ নিজের জন্য সময় রাখতে চাইলে","মনটাকে একটু আদর করতে চাইলে","কিছু না করেও শান্তি চাইলে","নিজের প্রতি কঠোর হয়ে গেলে","আজ শুধু নিরাপদ একটা মুহূর্ত চাইলে"],
miss:["কাউকে খুব মনে পড়লে","পুরোনো কোনো স্মৃতি ফিরে এলে","একটা পরিচিত নাম চোখে পড়লে","দূরের কারও কথা মনে হলে","কোনো গান পুরোনো সময় মনে করালে","হঠাৎ কোনো জায়গা পরিচিত লাগলে","একটা পুরোনো ছবি মনে এলে","কথা না হওয়া কাউকে মনে করলে","একটা হাসি খুব পরিচিত মনে হলে","আজ দূরত্বটা বেশি মনে হলে"],
quiet:["আজ বেশি কথা বলতে ইচ্ছে না করলে","নীরবতাটাই ভালো লাগলে","নিজের মধ্যে থাকতে চাইলে","সব প্রশ্নের উত্তর দিতে ক্লান্ত হলে","শুধু জানালার পাশে বসতে ইচ্ছে করলে","কিছু অনুভূতি ভাষায় না এলে","আজ ধীর গতিতে চলতে চাইলে","একটু একা সময় দরকার হলে","চারপাশের শব্দ বেশি লাগলে","মনের ভেতরটা শান্ত রাখতে চাইলে"],
happy:["আজ ছোট্ট একটা ভালো খবর পেলে","মনটা অকারণে ভালো থাকলে","কাউকে দেখে হাসি চলে এলে","দিনটা সুন্দরভাবে শুরু হলে","প্রিয় কোনো মুহূর্ত মনে পড়লে","আজ নিজের ওপর ভালো লাগলে","একটা ছোট সাফল্য এলে","চারপাশে সুন্দর কিছু দেখতে পেলে","হঠাৎ মনটা হালকা হয়ে গেলে","আজ হাসিটা একটু বেশি সত্যি হলে"],
love:["কারও কথা মনে পড়লেই হাসি এলে","মনের ভেতর নতুন রঙ লাগলে","কাউকে একটু বেশি আপন মনে হলে","একটা নাম শুনলেই মন বদলে গেলে","কারও যত্নে দিনটা সুন্দর হলে","অপেক্ষাটাও মিষ্টি লাগলে","কাউকে নিয়ে ছোট স্বপ্ন দেখলে","মনের কথা লুকোতে কষ্ট হলে","একটা বার্তা দেখেই হাসি এলে","আজ ভালোবাসাকে কাছে মনে হলে"],
fresh:["আবার নতুন করে শুরু করতে চাইলে","পুরোনো ভুল থেকে শিখে উঠলে","নিজের জন্য নতুন সিদ্ধান্ত নিলে","আজ একটা নতুন সকাল মনে হলে","যা হয়নি তা ছেড়ে সামনে তাকালে","নিজেকে আরেকবার সুযোগ দিলে","ছোট একটা লক্ষ্য ঠিক করলে","আগের চেয়ে একটু সাহসী হতে চাইলে","জীবনটাকে নতুনভাবে দেখতে চাইলে","আজ প্রথম দিনের মতো হাঁটতে চাইলে"],
cute:["আজ একটু সুন্দর কথা শুনতে ইচ্ছে করলে","নিজের জন্য ছোট্ট হাসি চাইলে","কারও দিনটা ভালো করতে চাইলে","একটা মিষ্টি মুহূর্ত জমিয়ে রাখতে চাইলে","আজ সবকিছু একটু নরম লাগলে","নিজের নামটা আদর করে শুনতে চাইলে","ছোট্ট আনন্দকে বড় করে দেখতে চাইলে","আজ অকারণে হাসতে ইচ্ছে করলে","একটা সুন্দর স্মৃতি বানাতে চাইলে","দিনটার শেষে মায়া রেখে যেতে চাইলে"]
};
const seedEnds=[
"মনে রেখো, এই মুহূর্তটা স্থায়ী নয়। নিজের সঙ্গে একটু ধৈর্য রাখলে মন ধীরে ধীরে তার ভার নামাতে শেখে।",
"সবকিছু একসঙ্গে ঠিক করার দরকার নেই। আজ শুধু পরের ছোট্ট ভালো সিদ্ধান্তটুকু নাও, বাকিটা সময়কে করতে দাও।",
"তোমার অনুভূতির জায়গা আছে। তাকে সম্মান করো, তারপর নিজের জন্য এমন একটা ছোট কাজ করো যেটা তোমাকে শান্তি দেয়।",
"জীবনের সুন্দর দিকগুলো অনেক সময় খুব আস্তে আসে। তাই আজকের ছোট্ট আলোটুকুও খেয়াল করে রাখো, সেটাই হয়তো আগামীকালের শুরু।",
"তুমি যা পারছো, সেটাকে কম করে দেখো না। ধীরে এগোনোও এগিয়ে যাওয়া, আর নিজের প্রতি মায়া রাখাও এক ধরনের সাহস।"
];
async function ensureSeeded(){
  const existing=await getDocs(collection(db,"notes"));const counts={};existing.forEach(d=>{const e=d.data().emotionId;counts[e]=(counts[e]||0)+1});
  let missing=0; emotionDefaults.forEach(e=>missing+=Math.max(0,50-(counts[e[0]]||0)));
  if(missing) await seedAllNotes(true);
}
async function seedAllNotes(silent=false){
  const existing=await getDocs(collection(db,"notes"));const counts={};existing.forEach(d=>{const e=d.data().emotionId;counts[e]=(counts[e]||0)+1});
  const batch=writeBatch(db);let total=0;
  for(const e of emotionDefaults){const id=e[0],need=Math.max(0,50-(counts[id]||0));for(let i=0;i<need;i++){const intro=seedParts[id][i%10],end=seedEnds[i%5],text=`{name}, ${intro}. ${end}`;const ref=doc(collection(db,"notes"));batch.set(ref,{emotionId:id,text,active:true,createdAt:serverTimestamp(),seeded:true});total++}}
  if(total){await batch.commit();if(!silent)$("seedMsg").textContent=`${total}টি note তৈরি হয়েছে ✓`;await loadNotes()}else if(!silent)$("seedMsg").textContent="সব emotion-এ ৫০টি note ইতিমধ্যেই আছে ✓";
}
async function loadEmotions(){
  const snap=await getDocs(collection(db,"emotions"));$("emotionManage").innerHTML="";
  if(snap.empty){$("emotionManage").innerHTML="<p>Default emotion ব্যবহার হচ্ছে। Notes system-এর 10 category প্রস্তুত।</p>";return}
  snap.forEach(d=>{const x=d.data();$("emotionManage").insertAdjacentHTML("beforeend",`<div class="manageRow"><span>${esc(x.emoji)} ${esc(x.title)}</span><button data-ed="${d.id}">Edit</button><button class="danger" data-edel="${d.id}">Delete</button></div>`)});
  document.querySelectorAll("[data-ed]").forEach(b=>b.onclick=()=>editEmotion(b.dataset.ed));document.querySelectorAll("[data-edel]").forEach(b=>b.onclick=()=>deleteEmotion(b.dataset.edel));
}
async function addEmotion(){const title=prompt("Emotion title?");if(!title)return;const emoji=prompt("Emoji?","✨")||"✨";await addDoc(collection(db,"emotions"),{title,emoji,description:"",createdAt:serverTimestamp()});await loadEmotions()}
async function editEmotion(id){const d=await getDoc(doc(db,"emotions",id));if(!d.exists())return;const x=d.data(),title=prompt("Title",x.title);if(title)await setDoc(doc(db,"emotions",id),{title,updatedAt:serverTimestamp()},{merge:true});await loadEmotions()}
async function deleteEmotion(id){if(confirm("Delete emotion?")){await deleteDoc(doc(db,"emotions",id));await loadEmotions()}}

onAuthStateChanged(auth,async user=>{if(user&&user.email?.toLowerCase()===ADMIN_EMAIL){$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("adminEmail").textContent=user.email;await loadSettings();await loadEmotions();await ensureSeeded();await loadNotes();subscribeLive()}else{$("appView").classList.add("hidden");$("loginView").classList.remove("hidden");}});
