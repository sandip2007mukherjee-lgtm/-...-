import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrfUkI-ZE1jQ160INFxcUxhUwSiDvZbbk",
  authDomain: "workshop-c2bd7.firebaseapp.com",
  projectId: "workshop-c2bd7",
  storageBucket: "workshop-c2bd7.firebasestorage.app",
  messagingSenderId: "813904771823",
  appId: "1:813904771823:web:35c19cf502b6dd8e1a791a",
  measurementId: "G-LPFNGZPEDZ"
};

let db = null;
try {
  if (!firebaseConfig.apiKey.startsWith("PASTE_")) {
    db = getFirestore(initializeApp(firebaseConfig));
  }
} catch(e) { console.warn("Firebase not configured yet."); }

const emotions = [
  {id:"sad", emoji:"🥺", title:"মন খারাপ", sub:"আজ মনটা একটু ভারী"},
  {id:"alone", emoji:"😔", title:"একা লাগছে", sub:"কথা বলার মতো কাউকে চাই"},
  {id:"hurt", emoji:"💔", title:"কষ্ট পেয়েছি", sub:"কিছু কথা মনে লেগে আছে"},
  {id:"care", emoji:"🫂", title:"একটু আদর দরকার", sub:"আজ একটু নরম কথা চাই"},
  {id:"miss", emoji:"❤️", title:"কাউকে মনে পড়ছে", sub:"কিছু মানুষ দূরে থেকেও কাছে"},
  {id:"quiet", emoji:"🌙", title:"চুপচাপ থাকতে ইচ্ছে করছে", sub:"আজ শুধু নীরবতাই ভালো"},
  {id:"happy", emoji:"😊", title:"ভালো আছি", sub:"এই ভালো লাগাটা থাকুক"},
  {id:"love", emoji:"🥰", title:"প্রেমে আছি", sub:"মনের ভেতর একটু বসন্ত"},
  {id:"fresh", emoji:"✨", title:"নতুন করে শুরু করতে চাই", sub:"আজ থেকেই আবার"},
  {id:"cute", emoji:"🌸", title:"একটা সুন্দর কথা চাই", sub:"কারণ আজ এমনই ইচ্ছে"}
];

const localNotes = {
  sad:["{name}, সব দিন একই রকম থাকে না। আজ মনটা একটু ভারী হলে তাকে ভারীই থাকতে দাও—নিজেকে জোর করে হাসাতে হবে না। একটু সময় দাও, ভোরের মতো মনও ধীরে ধীরে আলো খুঁজে নেয়।","{name}, কিছু সন্ধ্যা শুধু চুপ করে পাশে বসে থাকার জন্য আসে। আজ তেমনই একটা সন্ধ্যা হলে, মনে রেখো—খারাপ লাগাটা তোমার পুরো গল্প নয়।"],
  alone:["{name}, চারপাশে মানুষ থাকলেও কখনও কখনও মন একা হয়ে যায়। সেই নীরবতাটাকে ভয় পেয়ো না। তুমি যতটা ভাবছো, তার চেয়েও বেশি আলো তোমার ভেতরে আছে।","{name}, আজ যদি কাউকে কিছু বলতে ইচ্ছে না করে, তবুও ঠিক আছে। শুধু নিজের সঙ্গে একটু কোমল থেকো।"],
  hurt:["{name}, যে কথাটা কষ্ট দিয়েছে, সেটা সত্যিই কষ্টের হতে পারে। কিন্তু একটা আঘাত তোমার মূল্য ঠিক করে না। ধীরে ধীরে মনটা আবার নিজের জায়গা খুঁজে নেবে।"],
  care:["{name}, আজ তোমার একটু আদর দরকার—এটা দুর্বলতা নয়। নিজেকে একটু জড়িয়ে ধরো, একটু বিশ্রাম নাও, আর মনে রেখো: তোমাকেও যত্ন পাওয়ার অধিকার আছে।"],
  miss:["{name}, কিছু মানুষকে মনে পড়লে দূরত্বটা একটু বেশি দূরত্ব মনে হয়। তবুও সুন্দর স্মৃতিগুলো তাদের নিজের মতো করে পাশে থাকে।"],
  quiet:["{name}, সব অনুভূতির ব্যাখ্যা দিতে হয় না। কিছু অনুভূতি শুধু নীরবে বসে থাকতে চায়। আজ নিজের নীরবতাটুকু তোমারই থাক।"],
  happy:["{name}, এই ছোট্ট ভালো লাগাটাকে ধরে রাখো। বড় সুখের জন্য অপেক্ষা করতে করতে ছোট সুখগুলো যেন হারিয়ে না যায়। আজকের হাসিটা আজকেরই থাক।"],
  love:["{name}, ভালোবাসা কখনও শুধু বড় বড় কথায় থাকে না—কখনও একটা অপেক্ষা, একটা খোঁজ নেওয়া, কিংবা চুপচাপ মনে পড়ে যাওয়ার মধ্যেও থাকে।"],
  fresh:["{name}, নতুন শুরু মানে আগের সবকিছু মুছে ফেলা নয়। বরং যা শিখেছো, তা সঙ্গে নিয়েই আরেকটু সুন্দরভাবে এগিয়ে যাওয়া।"],
  cute:["{name}, আজ তোমার জন্য খুব ছোট্ট একটা কথা: তুমি নিজের অজান্তেই কারও একটা দিন একটু সুন্দর করে দিতে পারো। তাই হাসিটা রেখে দিও।"]
};

let state={name:"",emotion:null,noteCount:0,sessionId:crypto.randomUUID?.()||String(Date.now())};

const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function escapeName(n){return n.replace(/[<>]/g,"").trim().slice(0,30);}
function localNote(){const arr=localNotes[state.emotion.id]||localNotes.sad;return arr[Math.floor(Math.random()*arr.length)].replaceAll("{name}",state.name);}
async function logEvent(type,extra={}){
  if(!db)return;
  try{await addDoc(collection(db,"activity"),{sessionId:state.sessionId,name:state.name,event:type,emotion:state.emotion?.id||null,emotionLabel:state.emotion?.title||null,noteCount:state.noteCount,...extra,createdAt:serverTimestamp()});}catch(e){console.warn(e)}
}
async function generateNote(){
  state.noteCount++;
  $("noteText").textContent=localNote();
  $("aiStatus").textContent="একটা নতুন কথা তোমার জন্য লেখা হলো ✨";
  // Secure AI hook: set your deployed Firebase/Cloud Function URL here.
  // It should accept POST {name, emotion, emotionLabel} and return {note}.
  const endpoint=window.APP_CONFIG?.AI_ENDPOINT||"";
  if(endpoint){
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:state.name,emotion:state.emotion.id,emotionLabel:state.emotion.title})});
      const data=await r.json();
      if(data.note){$("noteText").textContent=data.note;$("aiStatus").textContent="AI তোমার জন্য নতুন একটা কথা লিখেছে ✨";}
    }catch(e){console.warn("AI unavailable; using local note.");}
  }
  await logEvent("note_viewed",{note:$("noteText").textContent});
}
function renderEmotions(){
  $("emotionGrid").innerHTML=emotions.map(e=>`<button class="emotion" data-id="${e.id}"><span class="emoji">${e.emoji}</span><strong>${e.title}</strong><small>${e.sub}</small></button>`).join("");
  document.querySelectorAll(".emotion").forEach(b=>b.onclick=()=>selectEmotion(b.dataset.id));
}
async function selectEmotion(id){
  state.emotion=emotions.find(e=>e.id===id);
  $("emotionBadge").textContent=state.emotion.emoji+" "+state.emotion.title;
  $("noteGreeting").textContent=state.name+"—";
  await logEvent("emotion_selected");
  show("note"); await generateNote();
}
$("startBtn").onclick=async()=>{
  state.name=escapeName($("nameInput").value);
  if(!state.name){$("nameInput").focus();$("nameInput").placeholder="আগে নামটা লিখো 🌸";return;}
  $("helloTitle").textContent=`${state.name}, তুমি কেমন অনুভব করছো?`;
  await logEvent("name_submitted");show("emotions");
};
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("startBtn").click()});
document.querySelectorAll(".back").forEach(b=>b.onclick=()=>show(b.dataset.back));
$("anotherBtn").onclick=generateNote;
$("heartBtn").onclick=async()=>{
  await logEvent("animation_triggered");
  $("finalTitle").textContent=state.name+", তোমার জন্য একটু হাসি রাখা ছিল।";
  $("finalText").textContent="মনটা যেমনই থাকুক, এই ছোট্ট মুহূর্তটা শুধু তোমার। ♡";
  show("final"); runAnimation();
};
$("againBtn").onclick=()=>{state.emotion=null;state.noteCount=0;show("emotions")};

function runAnimation(){
  const b=$("balloons"),h=$("hearts"),g=$("giantHeart"),t=$("teddy");
  b.innerHTML="";h.innerHTML="";g.classList.remove("show");t.style.animationPlayState="running";
  ["🎈","🎈","🎈","🎈","🎈","🎈","🎈","🎈"].forEach((x,i)=>{const el=document.createElement("span");el.className="balloon";el.textContent=x;el.style.left=(7+i*12+Math.random()*5)+"%";el.style.animationDelay=(i*.15)+"s";b.appendChild(el)});
  for(let i=0;i<70;i++){const el=document.createElement("span");el.className="particle";el.textContent=["♥","♡","❤"][i%3];el.style.left=(5+Math.random()*90)+"%";el.style.setProperty("--drift",(Math.random()*100-50)+"px");el.style.animationDelay=(Math.random()*1.4)+"s";h.appendChild(el)}
  setTimeout(()=>g.classList.add("show"),850);
}
renderEmotions();
