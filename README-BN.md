# 🌙 Emotion Note — GitHub + Firebase

এটা একটি mobile-first Bengali emotion/note page starter project।

## 1) GitHub-এ upload
এই ZIP extract করে সব file একটি GitHub repository-তে upload করুন।
GitHub → Settings → Pages → Deploy from branch → `main` → `/root` → Save।

## 2) Firebase তৈরি
Firebase Console-এ একটি project তৈরি করুন।
তারপর:
- Web App add করুন
- Firestore Database চালু করুন
- Firebase config নিয়ে `app.js`-এর `firebaseConfig`-এ বসান

## 3) Firestore
`activity` নামে collection তৈরি করার দরকার নেই; প্রথম activity লিখলেই তৈরি হবে।
Development-এর সময় Firestore rules configure করুন। Production-এ admin authentication/rules অবশ্যই secure করুন।

## 4) AI Note
AI secret কখনো `app.js`-এ দেবেন না।
`functions` folder Firebase Cloud Functions হিসেবে deploy করুন।

Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init functions
cd functions
npm install
firebase functions:secrets:set OPENAI_API_KEY
firebase deploy --only functions
```

Deploy হওয়ার পরে function URL হবে এরকম:
`https://asia-south1-YOUR_PROJECT.cloudfunctions.net/generateNote`

তারপর `app.js`-এর শুরুতে/শেষে:
```js
window.APP_CONFIG = {
  AI_ENDPOINT: "YOUR_FUNCTION_URL"
};
```

## 5) গুরুত্বপূর্ণ
এই starter-এ local fallback notes আছে। AI endpoint না থাকলেও page কাজ করবে।
AI endpoint থাকলে প্রতিবার "আরও একটা কথা শুনি" চাপলে নতুন AI note নেওয়ার চেষ্টা করবে।

## 6) Admin
এই ZIP-এ user page + Firebase event logging আছে। Production admin dashboard আলাদা secure route/app হিসেবে বানানো উচিত।
Admin-এ data দেখানোর সময় Firebase Authentication + Firestore security rules ব্যবহার করুন।

## 7) Customization
`emotions` array এবং `localNotes` এখন code-এ আছে। পরের ধাপে এগুলো Firestore `settings` collection-এ নিয়ে গেলে Admin Panel থেকে code না ছুঁয়েই edit করা যাবে।
