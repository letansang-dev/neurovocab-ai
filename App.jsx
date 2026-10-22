import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  BookOpen, Brain, Sparkles, Upload, Volume2, CheckCircle2, 
  Lock, Unlock, Play, RotateCcw, Plus, Trash2, Check, X, 
  ChevronRight, ChevronLeft, Award, Zap, Clock, Layers, 
  LogOut, User, FileText, Settings, HelpCircle, ArrowRight,
  RefreshCw, Star, ShieldCheck, AlertCircle, BarChart3, 
  Smartphone, Monitor, Headphones, Eye, CheckSquare, Square,
  Flame, Compass, GraduationCap, Wand2, Loader2, Keyboard, BookMarked
} from 'lucide-react';

let mammothLoadPromise = null;
function loadMammothFromCDN() {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  if (mammothLoadPromise) return mammothLoadPromise;
  mammothLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
    script.onload = () => resolve(window.mammoth);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  return mammothLoadPromise;
}

let pdfjsLoadPromise = null;
function loadPdfJsFromCDN() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfjsLoadPromise) return pdfjsLoadPromise;
  pdfjsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      resolve(window.pdfjsLib);
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  return pdfjsLoadPromise;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function buildInstantCefrChallenges(words, levelCode = 'B1') {
  if (!words || words.length === 0) return [];
  return words.map((w, idx) => {
    const m = w.meaning.split(',')[0].trim();
    const posLabel = w.pos || 'từ';
    const templates = {
      A1: { vi: `Tôi cần biết về "${m}" trong công việc hôm nay.`, en: `I need to know about ${w.word} in my work today.`, hint: `A1 • Dùng từ: "${w.word}"` },
      A2: { vi: `Chúng tôi đang thảo luận về "${m}" vì nó rất quan trọng.`, en: `We are discussing ${w.word} because it is very important.`, hint: `A2 • Dùng từ: "${w.word}"` },
      B1: { vi: `Cả nhóm cần áp dụng "${m}" vào kế hoạch tuần này.`, en: `The team needs to apply ${w.word} in this week's plan.`, hint: `B1 • Dùng từ: "${w.word}"` },
      B2: { vi: `Nếu không chú trọng đến "${m}", dự án sẽ chậm tiến độ.`, en: `If we do not focus on ${w.word}, our project will be delayed.`, hint: `B2 • Dùng từ: "${w.word}"` },
      C1: { vi: `Việc ưu tiên "${m}" là yếu tố then chốt giúp phát triển bền vững.`, en: `Prioritizing ${w.word} effectively is key to sustainable growth.`, hint: `C1 • Dùng từ: "${w.word}"` },
      C2: { vi: `Sự nhạy bén trong "${m}" đã tạo ra bước ngoặt lớn cho công ty.`, en: `Acumen in ${w.word} enabled the leadership to create a turning point.`, hint: `C2 • Dùng từ: "${w.word}"` }
    };
    const chosen = templates[levelCode] || templates.B1;
    return {
      id: `instant_l3_${levelCode}_${w.id}_${idx}`,
      vietnameseSentence: chosen.vi,
      targetWordsUsed: [w.word],
      hintStructure: chosen.hint,
      sampleEnglishSentence: chosen.en
    };
  });
}

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'neurovocab-ai-app';

const INITIAL_LESSONS = [
  {
    id: 'lesson-sample-1',
    title: 'Bài 1: Giao Tiếp Công Sở & Kinh Doanh Quốc Tế',
    description: 'Bộ 5 từ vựng cốt lõi giúp bạn làm chủ các cuộc họp và công việc chuyên nghiệp.',
    createdAt: Date.now() - 86400000 * 2,
    words: [
      { id: 'w1', word: 'negotiate', ipa: '/nɪˈɡəʊ.ʃi.eɪt/', pos: 'v', meaning: 'đàm phán, thương lượng', example: 'We need to negotiate a better contract.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w2', word: 'collaborate', ipa: '/kəˈlæb.ə.reɪt/', pos: 'v', meaning: 'hợp tác, cộng tác', example: 'Our teams collaborate closely.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w3', word: 'deadline', ipa: '/ˈded.laɪn/', pos: 'n', meaning: 'hạn chót, thời hạn', example: 'Can we meet the project deadline?', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w4', word: 'implement', ipa: '/ˈɪm.plɪ.ment/', pos: 'v', meaning: 'triển khai, thực thi', example: 'Implement the new software.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w5', word: 'strategy', ipa: '/ˈstræt.ə.dʒi/', pos: 'n', meaning: 'chiến lược', example: 'A clear long-term strategy.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null }
    ]
  }
];

const CEFR_LEVELS = [
  { code: 'A1', name: 'A1 - Sơ cấp' },
  { code: 'A2', name: 'A2 - Cơ bản' },
  { code: 'B1', name: 'B1 - Trung cấp' },
  { code: 'B2', name: 'B2 - Trung cao cấp' },
  { code: 'C1', name: 'C1 - Cao cấp' },
  { code: 'C2', name: 'C2 - Thành thạo' }
];

async function callGeminiAPI(prompt, systemInstruction = '', jsonSchema = null, inlineData = null) {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const parts = [{ text: prompt }];
  if (inlineData && inlineData.data && inlineData.mimeType) parts.push({ inlineData });
  const payload = { contents: [{ parts }], generationConfig: { temperature: 0.25 } };
  if (systemInstruction) payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  if (jsonSchema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = jsonSchema;
  }
  const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response");
  return jsonSchema ? JSON.parse(text) : text;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);

  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [stats, setStats] = useState({ totalSessionsCompleted: 0, xp: 450 });
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState(INITIAL_LESSONS[0].id);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message: String(message || ''), type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectedLesson = useMemo(() => {
    return lessons.find(l => l.id === selectedLessonId) || lessons[0] || null;
  }, [lessons, selectedLessonId]);

  const allWordsSummary = useMemo(() => {
    let total = 0, learned = 0;
    lessons.forEach(l => (l.words || []).forEach(w => { total++; if (w.learned) learned++; }));
    return { total, learned };
  }, [lessons]);

  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem('neurovocab_admin_backup_v4');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (parsed.lessons) setLessons(parsed.lessons);
        if (parsed.stats) setStats(parsed.stats);
      }
    } catch (e) {}
  }, []);

  const saveToCloud = async (updatedLessons, updatedStats = stats) => {
    setLessons(updatedLessons);
    setStats(updatedStats);
    try {
      localStorage.setItem('neurovocab_admin_backup_v4', JSON.stringify({ lessons: updatedLessons, stats: updatedStats }));
    } catch (e) {}
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername.trim().toLowerCase() === 'admin' && loginPassword.trim() === '123') {
      setIsLoggedIn(true);
      showToast('Đăng nhập thành công tài khoản admin!');
    } else {
      setLoginError('Sai tài khoản hoặc mật khẩu! (admin / 123)');
    }
  };

  const speakEnglish = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // State quản lý upload & học
  const [rawInputText, setRawInputText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [parsedPreviewWords, setParsedPreviewWords] = useState([]);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [batchSize, setBatchSize] = useState(5);
  const [sessionWords, setSessionWords] = useState([]);
  const [sessionStage, setSessionStage] = useState('level1-flashcards');
  const [flashcardIndex, setFlashcardIndex] = useState(0);

  const handleAiSmartParse = async () => {
    if (!rawInputText.trim()) {
      showToast('Hãy nhập hoặc dán danh sách từ vựng!', 'error');
      return;
    }
    setIsAiParsing(true);
    try {
      const schema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            word: { type: "STRING" },
            ipa: { type: "STRING" },
            pos: { type: "STRING" },
            meaning: { type: "STRING" },
            example: { type: "STRING" }
          },
          propertyOrdering: ["word", "ipa", "pos", "meaning", "example"]
        }
      };
      const res = await callGeminiAPI(`Trích xuất từ vựng từ văn bản sau thành JSON:\n${rawInputText}`, `Trích xuất từ vựng Tiếng Anh chuyên nghiệp.`, schema);
      if (Array.isArray(res)) {
        setParsedPreviewWords(res.map((item, idx) => ({ ...item, id: `w_${idx}`, learned: false })));
        showToast(`AI đã nhận diện thành công ${res.length} từ vựng!`);
      }
    } catch (e) {
      showToast('Lỗi AI phân loại từ vựng!', 'error');
    } finally {
      setIsAiParsing(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-center mb-6">NeuroVocab AI</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tài khoản</label>
              <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mật khẩu</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="123" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            {loginError && <p className="text-xs text-rose-400">{loginError}</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold">Đăng Nhập admin</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-900/90 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-xl">
          {toast.message}
        </div>
      )}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">NeuroVocab AI</h1>
            <p className="text-xs text-slate-400">Đăng nhập tài khoản: admin</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white">Kho Bài Học</button>
          <button onClick={() => setCurrentView('import')} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">AI Nhập Từ Vựng</button>
          <button onClick={() => setIsLoggedIn(false)} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-rose-400"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto space-y-6 flex-1">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Xin chào, Admin!</h2>
                <p className="text-sm text-slate-400 mt-1">Đã thuộc {allWordsSummary.learned}/{allWordsSummary.total} từ vựng • Điểm XP: {stats.xp}</p>
              </div>
              <button onClick={() => setCurrentView('import')} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> Thêm Bài Học Bằng AI
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map(lesson => (
                <div key={lesson.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{lesson.title}</h3>
                    <p className="text-xs text-slate-400 mb-4">{lesson.description}</p>
                  </div>
                  <button onClick={() => { setSelectedLessonId(lesson.id); setCurrentView('lesson-detail'); }} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Vào Học Bài Này</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'import' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Wand2 className="text-indigo-400" /> AI Phân Loại Từ Vựng Nhanh</h2>
            <textarea rows={5} value={rawInputText} onChange={e => setRawInputText(e.target.value)} placeholder="Dán danh sách từ vựng lộn xộn vào đây..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-sm" />
            <button onClick={handleAiSmartParse} disabled={isAiParsing} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center gap-2">
              {isAiParsing ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} AI Nhận Diện Ngay
            </button>

            {parsedPreviewWords.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white">Xem trước ({parsedPreviewWords.length} từ):</h3>
                <input type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="Nhập tên bài học mới..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white" />
                <button onClick={async () => {
                  if (!newLessonTitle) { showToast('Hãy đặt tên bài học!', 'error'); return; }
                  const newL = { id: `lesson_${Date.now()}`, title: newLessonTitle, description: 'Bài học từ AI', words: parsedPreviewWords };
                  await saveToCloud([newL, ...lessons]);
                  setParsedPreviewWords([]);
                  setRawInputText('');
                  setCurrentView('dashboard');
                  showToast('Đã lưu bài học mới thành công!');
                }} className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm">Lưu Vào Kho Bài Học</button>
              </div>
            )}
          </div>
        )}

        {currentView === 'lesson-detail' && selectedLesson && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <button onClick={() => setCurrentView('dashboard')} className="text-xs text-indigo-400 font-bold flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Quay lại kho bài học</button>
            <h2 className="text-2xl font-bold text-white">{selectedLesson.title}</h2>
            <p className="text-sm text-slate-400">{selectedLesson.description}</p>
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-300">Tổng số từ: <strong>{selectedLesson.words.length} từ</strong></span>
              <button onClick={() => {
                setSessionWords(selectedLesson.words);
                setFlashcardIndex(0);
                setSessionStage('level1-flashcards');
                setCurrentView('study-session');
              }} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Bắt Đầu Học Ngay</button>
            </div>
          </div>
        )}

        {currentView === 'study-session' && sessionWords[flashcardIndex] && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto space-y-6 text-center">
            <span className="text-xs text-indigo-400 font-bold">Level 1 • Thẻ Flashcard Từ Vựng</span>
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-3xl font-extrabold text-white">{sessionWords[flashcardIndex].word}</h3>
              <p className="text-slate-400 font-mono">{sessionWords[flashcardIndex].ipa} ({sessionWords[flashcardIndex].pos})</p>
              <div className="text-xl font-bold text-emerald-300">{sessionWords[flashcardIndex].meaning}</div>
              {sessionWords[flashcardIndex].example && <p className="text-sm text-slate-300 italic">"{sessionWords[flashcardIndex].example}"</p>}
              <button onClick={() => speakEnglish(sessionWords[flashcardIndex].word)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Nghe phát âm
              </button>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setCurrentView('lesson-detail')} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300">Thoát</button>
              {flashcardIndex + 1 < sessionWords.length ? (
                <button onClick={() => setFlashcardIndex(prev => prev + 1)} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm">Từ tiếp theo</button>
              ) : (
                <button onClick={() => { setCurrentView('lesson-detail'); showToast('Đã hoàn thành phiên học!'); }} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm">Hoàn thành phiên</button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}