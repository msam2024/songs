// پایگاه دادهٔ نمونه و منطق اپ
const STORAGE_KEY = 'fa_lyrics_db_v1';

const sampleData = [
  {
    name: "علی رضایی",
    songs: [
      { title: "غروب", lyrics: "در غروبِ نمناکِ شهر\nچشم‌های تو گم شد" },
      { title: "بی‌تاب", lyrics: "بی‌تابِ نگاهت‌ام\nمثل کویری تشنه" }
    ]
  },
  {
    name: "مریم حسینی",
    songs: [
      { title: "سکوت", lyrics: "سکوتِ شب، حرف‌های ما را برد\nخانه پر از یادِ توست" }
    ]
  }
];

let db = loadDB();

// --- Helpers ---
function saveDB(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
function loadDB(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  // کپی اولیه
  return JSON.parse(JSON.stringify(sampleData));
}

// --- Rendering ---
const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');

function renderList(filter=''){
  listEl.innerHTML = '';
  const q = (filter || '').trim();
  const normalized = s => (s||'').toLowerCase();

  db.forEach(singer => {
    // فیلتر: نام خواننده یا عنوان آهنگ
    const singerMatch = normalized(singer.name).includes(normalized(q));
    const songsFiltered = singer.songs.filter(song =>
      normalized(song.title).includes(normalized(q)) || normalized(song.lyrics).includes(normalized(q))
    );
    if(!singerMatch && songsFiltered.length===0) return;

    const singerDiv = document.createElement('div');
    singerDiv.className = 'singer';

    const h = document.createElement('h3');
    h.textContent = singer.name;
    singerDiv.appendChild(h);

    (singerMatch ? singer.songs : songsFiltered).forEach(song=>{
      const songDiv = document.createElement('div');
      songDiv.className = 'song';
      const t = document.createElement('div');
      t.className = 'title';
      t.textContent = song.title;
      const p = document.createElement('pre');
      p.textContent = song.lyrics;
      songDiv.appendChild(t);
      songDiv.appendChild(p);
      singerDiv.appendChild(songDiv);
    });

    listEl.appendChild(singerDiv);
  });

  if(!listEl.hasChildNodes()){
    const empty = document.createElement('div');
    empty.className = 'card';
    empty.textContent = 'نتیجه‌ای یافت نشد.';
    listEl.appendChild(empty);
  }
}

// --- Search binding ---
searchEl.addEventListener('input', e=>{
  renderList(e.target.value);
});

// --- Add form binding ---
const addForm = document.getElementById('add-form');
const toggleAddBtn = document.getElementById('toggle-add');
const cancelAdd = document.getElementById('cancel-add');
const saveLyric = document.getElementById('save-lyric');
const newSinger = document.getElementById('new-singer');
const newTitle = document.getElementById('new-title');
const newLyrics = document.getElementById('new-lyrics');

toggleAddBtn.addEventListener('click', ()=>{
  showAddForm(true);
  newSinger.focus();
});
cancelAdd.addEventListener('click', ()=>{
  showAddForm(false);
});
function showAddForm(show){
  addForm.classList.toggle('hidden', !show);
  addForm.setAttribute('aria-hidden', (!show).toString());
}

saveLyric.addEventListener('click', ()=>{
  const singer = newSinger.value.trim();
  const title = newTitle.value.trim();
  const lyrics = newLyrics.value.trim();
  if(!singer || !title){
    alert('لطفاً نام خواننده و عنوان آهنگ را وارد کنید.');
    return;
  }
  let s = db.find(x=>x.name === singer);
  if(!s){
    s = { name: singer, songs: [] };
    db.push(s);
  }
  s.songs.push({ title, lyrics });
  saveDB();
  renderList(searchEl.value);
  // پاک‌کردن فرم
  newSinger.value = '';
  newTitle.value = '';
  newLyrics.value = '';
  showAddForm(false);
});

// --- Keyboard (virtual) ---
const kbSection = document.getElementById('keyboard');
const toggleKbBtn = document.getElementById('toggle-kb');
const kbKeysContainer = document.getElementById('kb-keys');
const kbSpace = document.getElementById('kb-space');
const kbBack = document.getElementById('kb-back');
const kbClear = document.getElementById('kb-clear');

toggleKbBtn.addEventListener('click', ()=>{
  const hidden = kbSection.classList.toggle('hidden');
  kbSection.setAttribute('aria-hidden', hidden.toString());
});

// حروف فارسی (ردیف‌بندی ساده)
const kbRows = [
  'ض ص ث ق ف غ ع ه خ ح ج چ',
  'ش س ی ب ل ا ت ن م ک گ',
  'ظ ط ز ر ذ د پ و ء ئ'
].map(r => r.split(' '));

function createKB(){
  kbRows.forEach(row=>{
    row.forEach(ch => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = ch;
      btn.addEventListener('click', ()=> insertToActiveTextarea(ch));
      kbKeysContainer.appendChild(btn);
    });
    // خط جدید
    const br = document.createElement('div');
    br.style.flexBasis = '100%';
    kbKeysContainer.appendChild(br);
  });
}
createKB();

kbSpace.addEventListener('click', ()=> insertToActiveTextarea(' '));
kbBack.addEventListener('click', ()=>{
  const ta = document.activeElement;
  if(ta && ta.tagName === 'TEXTAREA'){
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if(start === end && start>0){
      ta.value = ta.value.slice(0, start-1) + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start-1;
    }else{
      ta.value = ta.value.slice(0, start) + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start;
    }
    ta.focus();
  }
});
kbClear.addEventListener('click', ()=>{
  const ta = document.activeElement;
  if(ta && ta.tagName === 'TEXTAREA'){
    ta.value = '';
    ta.focus();
  }
});

// درج متن در textarea فعال (یا فیلد متنی)
function insertToActiveTextarea(text){
  const el = document.activeElement;
  if(!el) return;
  if(el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')){
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + text + after;
    const pos = start + text.length;
    el.selectionStart = el.selectionEnd = pos;
    el.focus();
    // اگر textarea مربوط به اضافه کردن شعر است، نگران نبودن در نگهداری داده نیستیم (هنگام ذخیره، مقدار خوانده می‌شود).
  } else {
    // اگر هیچ textarea ای فعال نیست، تمرکز روی textarea متن جدید می‌گذاریم
    newLyrics.focus();
    insertToActiveTextarea(text);
  }
}

// پشتیبانی از Paste: فقط اجازه می‌دهیم متن وارد شود (پیش‌فرض مرورگر کافی است)
// اما برای اطمینان، یک هندلر برای textarea اضافه می‌کنیم تا کاراکترها را نگه دارد
[newLyrics].forEach(ta=>{
  ta.addEventListener('paste', (e)=>{
    // اجازهٔ پیش‌فرض (paste) داده می‌شود؛ می‌توان در اینجا نرمال‌سازی هم انجام داد.
    setTimeout(()=>{/* بعد از paste می‌توان کاری انجام داد اگر لازم بود */}, 0);
  });
});

// --- Init ---
renderList();