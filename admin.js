import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';


/* ==============================
   ADMIN EMAIL
============================== */

const ADMIN_EMAIL = 'sandip2007mukherjee@gmail.com';


/* ==============================
   FIREBASE CONFIG
============================== */

const firebaseConfig = {
  apiKey: 'AIzaSyCrfUkI-ZE1jQ160INFxcUxhUwSiDvZbbk',
  authDomain: 'workshop-c2bd7.firebaseapp.com',
  projectId: 'workshop-c2bd7',
  storageBucket: 'workshop-c2bd7.firebasestorage.app',
  messagingSenderId: '813904771823',
  appId: '1:813904771823:web:35c19cf502b6dd8e1a791a'
};


/* ==============================
   INITIALIZE FIREBASE
============================== */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* ==============================
   HELPER
============================== */

const $ = id => document.getElementById(id);


/* ==============================
   LOGIN
============================== */

$('loginBtn').onclick = async () => {

  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;

  if (email !== ADMIN_EMAIL) {
    $('loginMsg').textContent = 'এই email-টি Admin নয়।';
    return;
  }

  if (!password) {
    $('loginMsg').textContent = 'Password লিখো।';
    return;
  }

  try {

    $('loginMsg').textContent = 'Login হচ্ছে...';

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    $('loginMsg').textContent = '';

  } catch (e) {

    console.error('Login error:', e);

    $('loginMsg').textContent =
      'Login failed: ' + (e.code || e.message);
  }
};


/* ==============================
   LOGOUT
============================== */

$('logoutBtn').onclick = async () => {

  try {
    await signOut(auth);
  } catch (e) {
    console.error('Logout error:', e);
  }

};


/* ==============================
   REFRESH
============================== */

$('refreshBtn').onclick = async () => {

  const btn = $('refreshBtn');

  try {

    btn.textContent = 'Loading...';
    await loadAll();

  } catch (e) {

    console.error('Refresh error:', e);

  } finally {

    btn.textContent = 'Refresh';

  }

};


/* ==============================
   SAVE SETTINGS
============================== */

$('saveSettings').onclick = async () => {

  try {

    await setDoc(
      doc(db, 'settings', 'main'),
      {
        finalMessage: $('finalMessage').value.trim(),
        animationIntensity: $('intensity').value,
        updatedAt: serverTimestamp()
      },
      {
        merge: true
      }
    );

    $('saveMsg').textContent = 'Saved ✓';

  } catch (e) {

    console.error('Settings error:', e);

    $('saveMsg').textContent =
      'Error: ' + e.message;

  }

};


/* ==============================
   ADD EMOTION
============================== */

$('addEmotion').onclick = () => {

  addEmotionRow({
    emoji: '✨',
    title: 'নতুন অনুভূতি',
    description: 'আজকের অনুভূতি'
  });

};


/* ==============================
   ESCAPE HTML
============================== */

function esc(s) {

  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

}


/* ==============================
   EMOTION ROW
============================== */

function addEmotionRow(x) {

  const row = document.createElement('div');

  row.className = 'emotionRow';

  row.innerHTML = `
    <input
      class="emEmoji"
      value="${esc(x.emoji || '')}"
      maxlength="4"
    >

    <input
      class="emTitle"
      value="${esc(x.title || '')}"
    >

    <button>Save</button>
  `;


  row.querySelector('button').onclick = async () => {

    try {

      await addDoc(
        collection(db, 'emotions'),
        {
          emoji: row.querySelector('.emEmoji').value.trim(),
          title: row.querySelector('.emTitle').value.trim(),
          description: x.description || '',
          createdAt: serverTimestamp()
        }
      );

      row.remove();

      await loadEmotions();

    } catch (e) {

      console.error('Emotion save error:', e);

      alert(
        'Emotion save হয়নি:\n' + e.message
      );

    }

  };


  $('emotionList').appendChild(row);

}


/* ==============================
   LOAD SETTINGS
============================== */

async function loadSettings() {

  try {

    const s = await getDoc(
      doc(db, 'settings', 'main')
    );

    if (s.exists()) {

      const d = s.data();

      $('finalMessage').value =
        d.finalMessage || '';

      $('intensity').value =
        d.animationIntensity || 'high';

    }

  } catch (e) {

    console.error(
      'Settings loading error:',
      e
    );

  }

}


/* ==============================
   LOAD EMOTIONS
============================== */

async function loadEmotions() {

  try {

    const snap = await getDocs(
      collection(db, 'emotions')
    );

    $('emotionList').innerHTML = '';

    snap.forEach(d => {

      const data = d.data();

      addEmotionRow({
        emoji: data.emoji,
        title: data.title,
        description: data.description,
        id: d.id
      });

    });

  } catch (e) {

    console.error(
      'Emotion loading error:',
      e
    );

    $('emotionList').innerHTML =
      '<p>Emotion load হয়নি।</p>';

  }

}


/* ==============================
   LOAD ACTIVITY
   IMPORTANT:
   USER APP USES "activity"
============================== */

async function loadActivity() {

  let snap;


  /* --------------------------------
     FIRST TRY:
     newest activity first
  -------------------------------- */

  try {

    snap = await getDocs(
      query(
        collection(db, 'activity'),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    );

  } catch (e) {

    console.warn(
      'Ordered activity query failed. Using fallback.',
      e
    );


    /* ------------------------------
       FALLBACK:
       load activity without orderBy
    ------------------------------ */

    try {

      snap = await getDocs(
        collection(db, 'activity')
      );

    } catch (error) {

      console.error(
        'Activity loading failed:',
        error
      );

      $('activityBody').innerHTML = `
        <tr>
          <td colspan="4">
            Activity load হয়নি।
            <br>
            ${esc(error.message)}
          </td>
        </tr>
      `;

      $('usersCount').textContent = '0';
      $('notesCount').textContent = '0';
      $('finalCount').textContent = '0';
      $('animationCount').textContent = '0';

      return;
    }

  }


  /* ==============================
     COUNTERS
  ============================== */

  const users = new Set();

  let notes = 0;
  let finals = 0;
  let animations = 0;

  const rows = [];


  /* ==============================
     READ EVERY ACTIVITY
  ============================== */

  snap.forEach(d => {

    const x = d.data();

    /* USER */

    if (x.name) {
      users.add(x.name);
    }


    /* EVENT */

    const event =
      x.event ||
      x.action ||
      x.type ||
      '';


    /* NOTE VIEW */

    if (
      event === 'note_viewed' ||
      /note.*view/i.test(event)
    ) {

      notes++;

    }


    /* FINAL / HEART BUTTON */

    if (
      event === 'animation_triggered' ||
      /final|button|favorite|yes/i.test(event)
    ) {

      finals++;

    }


    /* ANIMATION */

    if (
      event === 'animation_triggered' ||
      /animation|heart/i.test(event)
    ) {

      animations++;

    }


    rows.push(x);

  });


  /* ==============================
     SORT LOCALLY
     ============================== */

  rows.sort((a, b) => {

    const ta =
      a.createdAt?.toMillis?.() || 0;

    const tb =
      b.createdAt?.toMillis?.() || 0;

    return tb - ta;

  });


  /* ==============================
     UPDATE COUNTERS
  ============================== */

  $('usersCount').textContent =
    users.size;

  $('notesCount').textContent =
    notes;

  $('finalCount').textContent =
    finals;

  $('animationCount').textContent =
    animations;


  /* ==============================
     ACTIVITY TABLE
  ============================== */

  const tableRows = rows
    .slice(0, 50)
    .map(x => {

      return `
        <tr>

          <td>
            ${esc(x.name || '-')}
          </td>

          <td>
            ${esc(
              x.emotionLabel ||
              x.emotion ||
              '-'
            )}
          </td>

          <td>
            ${esc(
              x.event ||
              x.action ||
              x.type ||
              '-'
            )}
          </td>

          <td>
            ${formatTime(x.createdAt)}
          </td>

        </tr>
      `;

    })
    .join('');


  $('activityBody').innerHTML =
    tableRows ||
    `
      <tr>
        <td colspan="4">
          No activity yet.
        </td>
      </tr>
    `;

}


/* ==============================
   FORMAT FIREBASE TIME
============================== */

function formatTime(t) {

  if (!t) {
    return '-';
  }

  try {

    if (
      typeof t.toDate === 'function'
    ) {

      return t
        .toDate()
        .toLocaleString(
          'en-IN',
          {
            dateStyle: 'short',
            timeStyle: 'short'
          }
        );

    }


    if (t instanceof Date) {

      return t.toLocaleString(
        'en-IN',
        {
          dateStyle: 'short',
          timeStyle: 'short'
        }
      );

    }

  } catch (e) {

    console.warn(
      'Time format error:',
      e
    );

  }

  return '-';

}


/* ==============================
   LOAD EVERYTHING
============================== */

async function loadAll() {

  await Promise.all([
    loadSettings(),
    loadEmotions(),
    loadActivity()
  ]);

}


/* ==============================
   AUTH STATE
============================== */

onAuthStateChanged(
  auth,
  async user => {

    if (
      user &&
      user.email?.toLowerCase() === ADMIN_EMAIL
    ) {

      $('loginView')
        .classList
        .add('hidden');

      $('appView')
        .classList
        .remove('hidden');

      $('adminEmail').textContent =
        user.email;

      try {

        await loadAll();

      } catch (e) {

        console.error(
          'Dashboard loading error:',
          e
        );

      }

    } else {

      $('appView')
        .classList
        .add('hidden');

      $('loginView')
        .classList
        .remove('hidden');

    }

  }
);
