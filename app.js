import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:"AIzaSyCrfUkI-ZE1jQ160INFxcUxhUwSiDvZbbk8", authDomain:"workshop-c2bd7.firebaseapp.com",
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
  try{await setDoc(doc(db,"presence",state.sessionId),{sessionId:state.sessionId,name:state.name||null,emotion:state.emotion?.id||null,emotionLabel:state.emotion?.title||null,currentScreen:document.querySelector(".screen.active")?.id||"welcome",lastSeen:serverTimestamp(),...extra},{merge:true});}catch(e){}
}
const fallbackNotes={
sad:["{name}, আজ মনটা ভারী হলে তাকে একটু সময় দাও। সব অনুভূতিকে সঙ্গে সঙ্গে ঠিক করে ফেলতে হয় না।","{name}, কিছু দিন শুধু ধীরে চলার জন্য আসে। আজ নিজেকে সেই অনুমতিটুকু দিও।","{name}, তোমার খারাপ লাগাটা ছোট নয়, কিন্তু এটাও তোমার পুরো গল্প নয়।"],
alone:["{name}, একা লাগা আর একা হয়ে যাওয়া এক জিনিস নয়। নীরব সময়টুকুতেও তুমি নিজের পাশে থাকতে পারো।","{name}, আজ কথা কম হলেও নিজের প্রতি কোমল থেকো।","{name}, চারপাশ নীরব হলেও তোমার ভেতরের আলোটা নিভে যায়নি।"],
hurt:["{name}, যে কথায় কষ্ট পেয়েছো, সেটাকে অস্বীকার করতে হবে না। ধীরে ধীরে নিজের জায়গাটা আবার খুঁজে নাও।","{name}, একটা আঘাত তোমার মূল্য ঠিক করে না।","{name}, মনকে সময় দিলে কিছু ভার নিজে থেকেই একটু হালকা হয়।"],
care:["{name}, নিজের যত্ন নেওয়া কোনো দুর্বলতা নয়। আজ একটু বিশ্রাম, একটু শান্তি, আর নিজের প্রতি একটু মায়া রাখো।","{name}, আজ তোমার সঙ্গে নরমভাবে কথা বলার দায়িত্বটাও তোমার নিজের।","{name}, সবসময় শক্ত থাকার দরকার নেই।"],
miss:["{name}, কাউকে মনে পড়া মানেই তাকে ফিরে পাওয়া নয়, কখনও সেটা শুধু সুন্দর স্মৃতির দরজা খুলে দেয়।","{name}, দূরত্ব থাকলেও কিছু স্মৃতি খুব কাছে থাকে।","{name}, আজ মনে পড়া মানুষটার জন্য নয়, নিজের মনের যত্নের জন্যও একটু থেমে থাকো।"],
quiet:["{name}, সব অনুভূতির ব্যাখ্যা দরকার হয় না। কিছু নীরবতা শুধু নীরবতাই হতে চায়।","{name}, আজ যদি চুপ থাকতে ইচ্ছে করে, নিজের সেই প্রয়োজনটাকে সম্মান করো।","{name}, শান্ত একটা দিনও জীবনের অংশ।"],
happy:["{name}, ছোট্ট ভালো লাগাগুলোকে ছোট করে দেখো না। আজকের হাসিটা আজকেরই থাক।","{name}, এই মুহূর্তটার সৌন্দর্য ধরে রাখো, কারণ সুখ অনেক সময় খুব চুপচাপ আসে।","{name}, আজ ভালো আছো, এটুকুও উদযাপন করার মতো কথা।"],
love:["{name}, ভালোবাসা শুধু বড় কথা নয়; যত্ন, অপেক্ষা আর ছোট্ট খোঁজ নেওয়ার মধ্যেও তার অনেকটা থাকে।","{name}, মনের ভেতর বসন্ত এলে তাকে সুন্দরভাবে বাঁচতে দাও।","{name}, ভালোবাসার সঙ্গে নিজের শান্তিটাকেও জায়গা দিও।"],
fresh:["{name}, নতুন শুরু মানে পুরোনো সব মুছে ফেলা নয়। শেখাগুলো সঙ্গে নিয়েই সামনে হাঁটা।","{name}, আজকের ছোট্ট সিদ্ধান্তটাও আগামী দিনের নতুন গল্প হতে পারে।","{name}, আবার শুরু করার জন্য নিখুঁত সময়ের অপেক্ষা করতেই হবে এমন নয়।"],
cute:["{name}, আজ তোমার জন্য ছোট্ট একটা কথা: তোমার হাসি হয়তো কারও একটা দিন সুন্দর করে দিতে পারে।","{name}, পৃথিবীটা একটু নরম লাগে যখন আমরা ছোট ছোট সুন্দর জিনিস খেয়াল করি।","{name}, আজ নিজের জন্য একটা সুন্দর মুহূর্ত জমিয়ে রাখো।"]
};

async function getRandomNote(){
  const ref=collection(db,"notes");
  let snap;
  try{snap=await getDocs(query(ref,where("emotionId","==",state.emotion.id)));}catch(e){snap=null}
  let pool=snap? snap.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.active!==false):[];
  pool=pool.filter(n=>!state.shownNotes.has(n.id));
  if(!pool.length && snap) {
    state.shownNotes.clear();
    pool=snap.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.active!==false);
  }
  if(pool.length){const n=pool[Math.floor(Math.random()*pool.length)];state.shownNotes.add(n.id);state.lastNoteId=n.id;return n.text.replaceAll("{name}",state.name);}
  const arr=fallbackNotes[state.emotion.id]||fallbackNotes.sad;
  return arr[Math.floor(Math.random()*arr.length)].replaceAll("{name}",state.name);
}
async function generateNote(){
  state.noteCount++;
  $("noteText").textContent="তোমার জন্য নতুন একটা কথা খুঁজছি…";
  const note=await getRandomNote();
  $("noteText").textContent=note;
  $("aiStatus").textContent=`নতুন কথা #${state.noteCount} ✨`;
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
