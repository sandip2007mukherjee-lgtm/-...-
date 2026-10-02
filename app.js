import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:"AIzaSyCrfUkI-ZE1jQ160INFxcUxhUwSiDvZbbk", authDomain:"workshop-c2bd7.firebaseapp.com",
  projectId:"workshop-c2bd7", storageBucket:"workshop-c2bd7.firebasestorage.app",
  messagingSenderId:"813904771823", appId:"1:813904771823:web:35c19cf502b6dd8e1a791a", measurementId:"G-LPFNGZPEDZ"
};
const db = getFirestore(initializeApp(firebaseConfig));

const emotions=[
{id:"sad",emoji:"🥺",title:"মন খারাপ",sub:"আজ মনটা একটু ভারী"},
{id:"alone",emoji:"😔",title:"একা লাগছে",sub:"কথা বলার মতো কাউকে চাই"},
{id:"hurt",emoji:"💔",title:"কষ্ট পেয়েছি",sub:"কিছু কথা মনে লেগে আছে"},
{id:"care",emoji:"🫂",title:"একটু আদর দরকার",sub:"আজ একটু নরম কথা চাই"},
{id:"miss",emoji:"❤️",title:"কাউকে মনে পড়ছে",sub:"কিছু মানুষ দূরে থেকেও কাছে"},
{id:"quiet",emoji:"🌙",title:"চুপচাপ থাকতে ইচ্ছে করছে",sub:"আজ শুধু নীরবতাই ভালো"},
{id:"happy",emoji:"😊",title:"ভালো আছি",sub:"এই ভালো লাগাটা থাকুক"},
{id:"love",emoji:"🥰",title:"প্রেমে আছি",sub:"মনের ভেতর একটু বসন্ত"},
{id:"fresh",emoji:"✨",title:"নতুন করে শুরু করতে চাই",sub:"আজ থেকেই আবার"},
{id:"cute",emoji:"🌸",title:"একটা সুন্দর কথা চাই",sub:"কারণ আজ এমনই ইচ্ছে"}
];

let state={name:"",emotion:null,noteCount:0,sessionId:crypto.randomUUID?.()||String(Date.now()),shownNotes:new Set(),lastNoteId:null};
const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function clean(n){return n.replace(/[<>]/g,"").trim().slice(0,30);}
async function logEvent(event,extra={}){
  try{await addDoc(collection(db,"activity"),{sessionId:state.sessionId,name:state.name||null,event,emotion:state.emotion?.id||null,emotionLabel:state.emotion?.title||null,noteCount:state.noteCount,currentScreen:document.querySelector(".screen.active")?.id||null,...extra,createdAt:serverTimestamp()});}catch(e){console.warn("activity",e)}
}
async function updatePresence(extra={}){
  try{await setDoc(doc(db,"presence",state.sessionId),{sessionId:state.sessionId,online:true,name:state.name||null,emotion:state.emotion?.id||null,emotionLabel:state.emotion?.title||null,currentScreen:document.querySelector(".screen.active")?.id||"welcome",lastSeen:serverTimestamp(),...extra},{merge:true});}catch(e){}
}
const fallbackParts={
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
const fallbackEnds=[
"নিজেকে তাড়াহুড়ো করে ঠিক করার দরকার নেই। আজ একটু ধীরে থাকো, মনকে নিজের মতো করে নিঃশ্বাস নেওয়ার জায়গা দাও।",
"সব উত্তর আজই খুঁজে পেতে হবে না। ছোট একটা ভালো সিদ্ধান্ত নাও, বাকিটা সময়কে একটু কাজ করতে দাও।",
"তোমার অনুভূতির জায়গা আছে। তাকে অস্বীকার না করে নিজের প্রতি একটু কোমল হও, কারণ তুমিও যত্ন পাওয়ার যোগ্য।",
"জীবনের সুন্দর দিকগুলো অনেক সময় খুব আস্তে আসে। তাই আজকের ছোট্ট আলোটুকুও খেয়াল করে রাখো।",
"ধীরে এগোনোও এগিয়ে যাওয়া। আজ যতটুকু পারছো, সেটুকুই যথেষ্ট, আর আগামীকাল আবার নতুন করে চেষ্টা করা যাবে।"
];
const fallbackNotes=Object.fromEntries(Object.entries(fallbackParts).map(([id,parts])=>[id,parts.flatMap((intro,i)=>fallbackEnds.map((end,j)=>({id:`fallback-${id}-${i*5+j}`,text:`{name}, ${intro}. ${end}`})))]));
function seenKey(){return `emotion-note-seen:${state.name.toLowerCase()}:${state.emotion.id}`}
function getSeen(){try{return new Set(JSON.parse(localStorage.getItem(seenKey())||"[]"))}catch{return new Set()}}
function saveSeen(set){try{localStorage.setItem(seenKey(),JSON.stringify([...set]))}catch{}}
async function getRandomNote(){
  let pool=[];
  try{const snap=await getDocs(query(collection(db,"notes"),where("emotionId","==",state.emotion.id)));pool=snap.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.active!==false && n.text)}catch(e){console.warn("notes read",e)}
  const seen=getSeen();
  let available=pool.filter(n=>!seen.has(n.id));
  if(!available.length && pool.length){seen.clear();available=pool}
  if(available.length){const n=available[Math.floor(Math.random()*available.length)];seen.add(n.id);saveSeen(seen);state.lastNoteId=n.id;return n.text.replaceAll("{name}",state.name)}
  const fallback=fallbackNotes[state.emotion.id]||fallbackNotes.sad;
  const fSeen=new Set([...seen]); let fAvail=fallback.filter(n=>!fSeen.has(n.id));
  if(!fAvail.length){fSeen.clear();fAvail=fallback}
  const n=fAvail[Math.floor(Math.random()*fAvail.length)];fSeen.add(n.id);saveSeen(fSeen);state.lastNoteId=n.id;return n.text.replaceAll("{name}",state.name);
}
async function generateNote(){
  state.noteCount++;
  $("noteText").textContent="তোমার জন্য নতুন একটা কথা খুঁজছি…";
  const note=await getRandomNote();
  $("noteText").textContent=note;
  $("aiStatus").textContent=`নতুন কথা #${state.noteCount} • random ✨`; $("noteCounter").textContent=`NOTE ${String(state.noteCount).padStart(2,"0")}`;
  await logEvent("note_viewed",{note, noteId:state.lastNoteId});
  await updatePresence({lastAction:"note_viewed",noteCount:state.noteCount});
}
function renderEmotions(){
  $("emotionGrid").innerHTML=emotions.map(e=>`<button class="emotion" data-id="${e.id}"><span class="emoji">${e.emoji}</span><strong>${e.title}</strong><small>${e.sub}</small></button>`).join("");
  document.querySelectorAll(".emotion").forEach(b=>b.onclick=()=>selectEmotion(b.dataset.id));
}
async function selectEmotion(id){
  state.emotion=emotions.find(e=>e.id===id); state.shownNotes.clear(); state.noteCount=0;
  $("emotionBadge").textContent=state.emotion.emoji+" "+state.emotion.title;
  $("noteGreeting").textContent=state.name+"—";
  await logEvent("emotion_selected"); await updatePresence({lastAction:"emotion_selected"}); show("note"); await generateNote();
}
$("startBtn").onclick=async()=>{state.name=clean($("nameInput").value);if(!state.name){$("nameInput").focus();$("nameInput").placeholder="আগে নামটা লিখো 🌸";return;}$("helloTitle").textContent=`${state.name}, তুমি কেমন অনুভব করছো?`;await logEvent("name_submitted");await updatePresence({lastAction:"name_submitted"});show("emotions");};
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("startBtn").click()});
document.querySelectorAll(".back").forEach(b=>b.onclick=async()=>{show(b.dataset.back);await logEvent("back_pressed");await updatePresence({lastAction:"back_pressed"});});
$("anotherBtn").onclick=generateNote;
$("heartBtn").onclick=async()=>{await logEvent("animation_triggered");await updatePresence({lastAction:"final_button_pressed"});$("finalTitle").textContent=state.name+", তোমার জন্য একটু হাসি রাখা ছিল।";$("finalText").textContent="মনটা যেমনই থাকুক, এই ছোট্ট মুহূর্তটা শুধু তোমার। ♡";show("final");runAnimation();};
$("againBtn").onclick=async()=>{await logEvent("again_pressed");state.emotion=null;state.noteCount=0;state.shownNotes.clear();show("emotions");await updatePresence({lastAction:"again_pressed"});};
function runAnimation(){
  const stage=$("animationStage");stage.classList.remove("pulse");void stage.offsetWidth;stage.classList.add("pulse");
  const b=$("balloons"),h=$("hearts"),g=$("giantHeart"),t=$("teddy");b.innerHTML="";h.innerHTML="";g.classList.remove("show");t.style.animationPlayState="running";
  ["✦","✧","•","✦","·","✧","✦","•"].forEach((x,i)=>{const el=document.createElement("span");el.className="orb";el.textContent=x;el.style.left=(7+i*12+Math.random()*5)+"%";el.style.animationDelay=(i*.15)+"s";b.appendChild(el)});
  for(let i=0;i<45;i++){const el=document.createElement("span");el.className="particle";el.textContent=["✦","·","♡"][i%3];el.style.left=(5+Math.random()*90)+"%";el.style.setProperty("--drift",(Math.random()*100-50)+"px");el.style.animationDelay=(Math.random()*1.4)+"s";h.appendChild(el)}
  setTimeout(()=>g.classList.add("show"),850);
}
renderEmotions(); updatePresence({lastAction:"opened"});
window.addEventListener("pagehide",()=>updatePresence({online:false,lastAction:"left_page"}));
