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
    // فیلتر: نام خواننده یا عنوان آهنگ یا متن
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
const kbHeader = document.getElementById('kb-header');
const kbPinBtn = document.getElementById('kb-pin');
const kbCloseBtn = document.getElementById('kb-close');

let pinned = false;
let dragging = false;
let dragOffset = {x:0,y:0};
let currentFocused = null; // the element keyboard is targeting

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
      btn.addEventListener('click', ()=> insertToTarget(ch));
      kbKeysContainer.appendChild(btn);
    });
    // خط جدید
    const br = document.createElement('div');
    br.style.flexBasis = '100%';
    kbKeysContainer.appendChild(br);
  });
}
createKB();

// Show/hide & position helpers
function showKeyboardFor(target){
  if(!target) return;
  currentFocused = target;
  kbSection.classList.remove('hidden');
  kbSection.setAttribute('aria-hidden', 'false');

  // if pinned, dock bottom-center
  if(pinned){
    kbSection.classList.add('pinned');
    kbSection.style.left = '';
    kbSection.style.top = '';
    kbSection.style.transform = 'translateX(-50%)';
    return;
  } else {
    kbSection.classList.remove('pinned');
  }

  // place keyboard relative to target (prefer above target)
  positionKeyboardNear(target);
}

function positionKeyboardNear(target){
  // temporarily make visible to measure
  kbSection.style.left = '-9999px';
  kbSection.style.top = '-9999px';
  kbSection.style.transform = '';
  // force layout
  const kbRect = kbSection.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const gap = 8;
  // prefer above
  const topAbove = rect.top - kbRect.height - gap;
  const topBelow = rect.bottom + gap;
  let top = topAbove > 8 ? topAbove : topBelow;
  // center relative to target
  let left = rect.left + (rect.width - kbRect.width) / 2;
  // keep inside viewport horizontally
  left = Math.max(8, Math.min(left, window.innerWidth - kbRect.width - 8));
  // ensure top inside viewport vertically
  top = Math.max(8, Math.min(top, window.innerHeight - kbRect.height - 8));
  kbSection.style.left = `${left}px`;
  kbSection.style.top = `${top}px`;
}

function hideKeyboard(){
  kbSection.classList.add('hidden');
  kbSection.setAttribute('aria-hidden', 'true');
  currentFocused = null;
}

// toggle button opens keyboard next to current active element (or lyrics textarea)
toggleKbBtn.addEventListener('click', ()=>{
  if(kbSection.classList.contains('hidden')){
    const active = document.activeElement;
    const target = (active && (isEditable(active))) ? active : newLyrics;
    showKeyboardFor(target);
    target && target.focus();
  } else {
    hideKeyboard();
  }
});

kbCloseBtn.addEventListener('click', ()=> hideKeyboard());

kbPinBtn.addEventListener('click', ()=>{
  pinned = !pinned;
  if(pinned){
    kbSection.classList.add('pinned');
    kbSection.style.left = '';
    kbSection.style.top = '';
    kbSection.style.transform = 'translateX(-50%)';
  } else {
    kbSection.classList.remove('pinned');
    if(currentFocused) positionKeyboardNear(currentFocused);
  }
});

// Dragging support (mouse / pointer)
kbHeader.addEventListener('pointerdown', (e)=>{
  // only left button
  if(e.button && e.button !== 0) return;
  kbHeader.setPointerCapture(e.pointerId);
  dragging = true;
  if(pinned){
    pinned = false;
    kbSection.classList.remove('pinned');
  }
  const rect = kbSection.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;
  document.addEventListener('pointermove', onDrag);
  document.addEventListener('pointerup', endDrag, {once:true});
  e.preventDefault();
});

function onDrag(e){
  if(!dragging) return;
  let left = e.clientX - dragOffset.x;
  let top = e.clientY - dragOffset.y;
  const kbRect = kbSection.getBoundingClientRect();
  left = Math.max(8, Math.min(left, window.innerWidth - kbRect.width - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - kbRect.height - 8));
  kbSection.style.left = left + 'px';
  kbSection.style.top = top + 'px';
  kbSection.style.transform = '';
}

function endDrag(e){
  dragging = false;
  document.removeEventListener('pointermove', onDrag);
}

// Keyboard actions
kbSpace.addEventListener('click', ()=> insertToTarget(' '));
kbBack.addEventListener('click', ()=>{
  const el = currentFocused && isEditable(currentFocused) ? currentFocused : document.activeElement;
  if(el && isEditable(el)){
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if(start === end && start>0){
      el.value = el.value.slice(0, start-1) + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start-1;
    }else{
      el.value = el.value.slice(0, start) + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start;
    }
    el.focus();
  }
});
kbClear.addEventListener('click', ()=>{
  const el = currentFocused && isEditable(currentFocused) ? currentFocused : document.activeElement;
  if(el && isEditable(el)){
    el.value = '';
    el.focus();
  }
});

// Insert the character into the target (currentFocused has priority)
function insertToTarget(text){
  const el = (currentFocused && isEditable(currentFocused)) ? currentFocused : (document.activeElement && isEditable(document.activeElement) ? document.activeElement : null);
  if(!el){
    // fallback to lyrics textarea
    newLyrics.focus();
    insertToTarget(text);
    return;
  }
  const start = el.selectionStart || 0;
  const end = el.selectionEnd || 0;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = before + text + after;
  const pos = start + text.length;
  el.selectionStart = el.selectionEnd = pos;
  el.focus();
}

// utility: which elements are considered editable for our keyboard
function isEditable(el){
  return el && ((el.tagName === 'TEXTAREA') || (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')));
}

// When user focuses inputs/textareas, show keyboard near that input (including search)
document.addEventListener('focusin', (e)=>{
  const t = e.target;
  if(isEditable(t)){
    // Show keyboard near this field
    // small delay allows layout to settle (useful on mobile/virtual keyboard)
    setTimeout(()=>{
      showKeyboardFor(t);
    }, 0);
  }
});

// If user clicks/taps outside inputs and outside keyboard, hide keyboard (unless pinned)
document.addEventListener('pointerdown', (e)=>{
  if(pinned) return;
  const target = e.target;
  if(kbSection.contains(target)) return;
  if(isEditable(target)) return;
  hideKeyboard();
});

// keep keyboard positioned with scroll/resize while it's open and not pinned
let repositionScheduled = false;
function scheduleReposition(){
  if(!currentFocused || pinned) return;
  if(repositionScheduled) return;
  repositionScheduled = true;
  requestAnimationFrame(()=>{
    try { positionKeyboardNear(currentFocused); } catch(e){}
    repositionScheduled = false;
  });
}
window.addEventListener('scroll', scheduleReposition, true);
window.addEventListener('resize', scheduleReposition);

// Paste support (unchanged) — allow paste into textarea
[newLyrics, searchEl, newSinger, newTitle].forEach(ta=>{
  ta && ta.addEventListener('paste', (e)=>{
    // default paste is OK; place caret after paste if needed
    setTimeout(()=>{/* after paste hook (if required) */}, 0);
  });
});

// --- Init ---
renderList();
