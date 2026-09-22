# Emotion Note — Admin Panel

Firebase project: `workshop-c2bd7`
Admin email: `sandip2007mukherjee@gmail.com`

## প্রথমবার
1. Firebase Console → Authentication → Users → Add user.
2. Email: `sandip2007mukherjee@gmail.com`
3. নিজের একটি password দিন।
4. Email verification সম্পন্ন করুন।
5. Firestore → Rules-এ `firestore.rules`-এর rules paste করে Publish করুন।
6. `admin.html` GitHub Pages repo-তে upload করুন।
7. তারপর `https://YOUR-USERNAME.github.io/YOUR-REPO/admin.html` খুলুন।

## গুরুত্বপূর্ণ
বর্তমান dashboard `activities`, `emotions`, `notes`, `settings` collections ব্যবহার করে। Existing main page-এর activity collection যদি অন্য নামে থাকে, `admin.js`-এর collection name একই করতে হবে।

Email/Password login শুধু UI gate নয়; Firestore rules-এ verified admin email-ও check করা হয়েছে।
