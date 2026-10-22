import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
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
      A1: {
        vi: `Tôi cần biết về "${m}" trong công việc hôm nay.`,
        en: `I need to know about ${w.word} in my work today.`,
        hint: `Câu đơn A1 ngắn gọn • Dùng từ khóa: "${w.word}" (${posLabel})`
      },
      A2: {
        vi: `Chúng tôi đang thảo luận về "${m}" vì nó rất quan trọng với nhóm.`,
        en: `We are discussing ${w.word} because it is very important to our team.`,
        hint: `Câu ghép A2 với "because" • Dùng từ khóa: "${w.word}" (${posLabel})`
      },
      B1: {
        vi: `Để đạt kết quả tốt, cả nhóm cần áp dụng "${m}" vào kế hoạch tuần này.`,
        en: w.example || `To achieve good results, the whole team needs to apply ${w.word} in this week's plan.`,
        hint: `Cấu trúc mục đích B1 (To + V) • Dùng từ khóa: "${w.word}" (${posLabel})`
      },
      B2: {
        vi: `Nếu không chú trọng đến "${m}", dự án của chúng ta sẽ khó hoàn thành đúng tiến độ.`,
        en: `If we do not focus on ${w.word}, our project will hardly be completed on schedule.`,
        hint: `Câu điều kiện & ngữ cảnh công sở B2 • Dùng từ khóa: "${w.word}" (${posLabel})`
      },
      C1: {
        vi: `Việc ưu tiên "${m}" một cách hiệu quả chính là yếu tố then chốt giúp tổ chức phát triển bền vững.`,
        en: `Prioritizing ${w.word} effectively is the key factor that helps the organization achieve sustainable growth.`,
        hint: `Danh động từ làm chủ ngữ & mệnh đề quan hệ C1 • Dùng từ khóa: "${w.word}" (${posLabel})`
      },
      C2: {
        vi: `Bất chấp những thách thức phức tạp của thị trường, sự nhạy bén trong "${m}" đã giúp ban lãnh đạo tạo ra bước ngoặt lớn.`,
        en: `Despite the complex challenges of the market, acumen in ${w.word} enabled the leadership to create a major turning point.`,
        hint: `Cấu trúc tương phản học thuật C2 (Despite + N) • Dùng từ khóa: "${w.word}" (${posLabel})`
      }
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
    description: 'Bộ 15 từ vựng cốt lõi giúp bạn làm chủ các cuộc họp, đàm phán và email công việc chuyên nghiệp.',
    createdAt: Date.now() - 86400000 * 2,
    words: [
      { id: 'w1', word: 'negotiate', ipa: '/nɪˈɡəʊ.ʃi.eɪt/', pos: 'v', meaning: 'đàm phán, thương lượng', example: 'We need to negotiate a better contract with our suppliers.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w2', word: 'collaborate', ipa: '/kəˈlæb.ə.reɪt/', pos: 'v', meaning: 'hợp tác, cộng tác', example: 'Our marketing and sales teams collaborate closely on every campaign.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w3', word: 'deadline', ipa: '/ˈded.laɪn/', pos: 'n', meaning: 'hạn chót, thời hạn cuối', example: 'Can we meet the project deadline without sacrificing quality?', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w4', word: 'implement', ipa: '/ˈɪm.plɪ.ment/', pos: 'v', meaning: 'triển khai, thực thi', example: 'The company decided to implement the new software next Monday.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w5', word: 'strategy', ipa: '/ˈstræt.ə.dʒi/', pos: 'n', meaning: 'chiến lược', example: 'A clear long-term strategy is essential for sustainable growth.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w6', word: 'objective', ipa: '/əbˈdʒek.tɪv/', pos: 'n', meaning: 'mục tiêu cụ thể', example: 'Our main objective this quarter is to expand into Asian markets.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w7', word: 'productive', ipa: '/prəˈdʌk.tɪv/', pos: 'adj', meaning: 'năng suất, hiệu quả cao', example: 'We had a very productive meeting this morning.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w8', word: 'supervise', ipa: '/ˈsuː.pə.vaɪz/', pos: 'v', meaning: 'giám sát, quản lý', example: 'She was hired to supervise the entire production department.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w9', word: 'revenue', ipa: '/ˈrev.ən.juː/', pos: 'n', meaning: 'doanh thu', example: 'Advertising revenue rose by 20% over the past year.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w10', word: 'innovative', ipa: '/ˈɪn.ə.və.tɪv/', pos: 'adj', meaning: 'đổi mới, sáng tạo', example: 'They won an award for their innovative approach to packaging.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w11', word: 'delegate', ipa: '/ˈdel.ɪ.ɡeɪt/', pos: 'v', meaning: 'ủy quyền, giao phó việc', example: 'A good manager knows how to delegate tasks effectively.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w12', word: 'milestone', ipa: '/ˈmaɪl.stəʊn/', pos: 'n', meaning: 'cột mốc quan trọng', example: 'Launching the beta version was a major milestone for our team.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w13', word: 'agenda', ipa: '/əˈdʒen.də/', pos: 'n', meaning: 'chương trình nghị sự, lịch trình họp', example: 'What is the first item on the agenda for today?', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w14', word: 'compromise', ipa: '/ˈkɒm.prə.maɪz/', pos: 'n/v', meaning: 'thỏa hiệp, nhượng bộ', example: 'After hours of discussion, both sides reached a compromise.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
      { id: 'w15', word: 'feedback', ipa: '/ˈfiːd.bæk/', pos: 'n', meaning: 'ý kiến phản hồi, nhận xét', example: 'Customer feedback helped us improve the mobile interface.', learned: false, srsLevel: 0, nextReview: null, lastStudied: null },
    ]
  }
];

const SRS_INTERVALS_HOURS = [0, 24, 72, 168, 336, 720];

const CEFR_LEVELS = [
  { code: 'A1', name: 'A1 - Sơ cấp', desc: 'Câu ngắn gọn, ngữ pháp hiện tại đơn giản.' },
  { code: 'A2', name: 'A2 - Cơ bản', desc: 'Câu giao tiếp hàng ngày, liên từ cơ bản.' },
  { code: 'B1', name: 'B1 - Trung cấp', desc: 'Câu hoàn chỉnh trong môi trường công sở.' },
  { code: 'B2', name: 'B2 - Trung cao cấp', desc: 'Câu ghép tự nhiên, mệnh đề quan hệ.' },
  { code: 'C1', name: 'C1 - Cao cấp', desc: 'Cấu trúc học thuật sắc bén.' },
  { code: 'C2', name: 'C2 - Thành thạo', desc: 'Câu phức tinh tế như người bản xứ.' },
];

async function callGeminiAPI(prompt, systemInstruction = '', jsonSchema = null, inlineData = null) {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const parts = [{ text: prompt }];
  if (inlineData && inlineData.data && inlineData.mimeType) {
    parts.push({ inlineData });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.25 }
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (jsonSchema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = jsonSchema;
  }

  const delays = [600, 1200];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty Gemini response");
      return jsonSchema ? JSON.parse(text) : text;
    } catch (err) {
      if (attempt === delays.length) throw err;
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting');

  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [stats, setStats] = useState({
    totalSessionsCompleted: 0,
    streakDays: 3,
    lastStudyDate: new Date().toISOString().split('T')[0],
    xp: 450
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLessonId, setSelectedLessonId] = useState(INITIAL_LESSONS[0].id);

  const [playingAudioId, setPlayingAudioId] = useState(null);
  const currentAudioObjRef = useRef(null);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message: String(message || ''), type });
    setTimeout(() => setToast(null), 3500);
  };

  const selectedLesson = useMemo(() => {
    return lessons.find(l => l.id === selectedLessonId) || lessons[0] || null;
  }, [lessons, selectedLessonId]);

  const allWordsSummary = useMemo(() => {
    let total = 0;
    let learned = 0;
    const dueForReview = [];
    const now = Date.now();

    lessons.forEach(lesson => {
      (lesson.words || []).forEach(w => {
        total++;
        if (w.learned) {
          learned++;
          if (!w.nextReview || w.nextReview <= now) {
            dueForReview.push(w);
          }
        }
      });
    });

    return { total, learned, dueForReview };
  }, [lessons]);

  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem('neurovocab_admin_backup_v3');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed.lessons) && parsed.lessons.length > 0) {
          setLessons(parsed.lessons);
        }
        if (parsed.stats) {
          setStats(parsed.stats);
        }
      }
    } catch (e) {}

    if (!auth || !db) {
      setSyncStatus('synced');
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setSyncStatus('synced');
      }
    };

    initAuth();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'userProgress', 'admin_profile');
    const unsubSnap = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.lessonsJson) {
            try {
              const cloudLessons = JSON.parse(data.lessonsJson);
              if (Array.isArray(cloudLessons) && cloudLessons.length > 0) {
                setLessons(cloudLessons);
              }
            } catch (e) {}
          }
          if (data.statsJson) {
            try {
              setStats(JSON.parse(data.statsJson));
            } catch (e) {}
          }
        }
        setSyncStatus('synced');
      },
      (err) => {
        setSyncStatus('synced');
      }
    );
    return () => unsubSnap();
  }, [firebaseUser]);

  const saveToCloud = async (updatedLessons, updatedStats = stats) => {
    setLessons(updatedLessons);
    setStats(updatedStats);
    setSyncStatus('saving');

    try {
      localStorage.setItem(
        'neurovocab_admin_backup_v3',
        JSON.stringify({ lessons: updatedLessons, stats: updatedStats })
      );
    } catch (e) {}

    if (firebaseUser && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'userProgress', 'admin_profile');
        await setDoc(
          docRef,
          {
            lessonsJson: JSON.stringify(updatedLessons),
            statsJson: JSON.stringify(updatedStats),
            updatedAt: Date.now()
          },
          { merge: true }
        );
      } catch (e) {}
    }
    setSyncStatus('synced');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUsername.trim().toLowerCase() === 'admin' && loginPassword.trim() === '123') {
      setLoginError('');
      setIsLoggedIn(true);
      showToast('Đăng nhập thành công! Đã đồng bộ dữ liệu tài khoản admin.', 'success');
    } else {
      setLoginError('Sai thông tin! Vui lòng nhập Tài khoản: admin | Mật khẩu: 123');
    }
  };

  const speakEnglish = async (textToSpeak, audioKey = 'default') => {
    const cleanText = String(textToSpeak || '').trim();
    if (!cleanText) return;

    setPlayingAudioId(audioKey);

    try {
      if (currentAudioObjRef.current) {
        currentAudioObjRef.current.pause();
        currentAudioObjRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.94;
      utterance.pitch = 1.02;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google US English') || v.name.includes('Samantha'))) ||
        voices.find(v => v.lang.includes('en-US')) ||
        voices.find(v => v.lang.includes('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingAudioId(null), 1000);
    }
  };

  const [importTargetLessonId, setImportTargetLessonId] = useState('new');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [rawInputText, setRawInputText] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [uploadedFileBadge, setUploadedFileBadge] = useState(null);
  const [pendingPdfInlineData, setPendingPdfInlineData] = useState(null);
  const [parsedPreviewWords, setParsedPreviewWords] = useState([]);

  const sanitizeExtractedText = (str) => {
    if (!str) return '';
    return str
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/ +/g, ' ')
      .trim();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    setIsExtractingFile(true);
    setPendingPdfInlineData(null);

    try {
      if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const mammoth = await loadMammothFromCDN();
          const result = await mammoth.extractRawText({ arrayBuffer });
          const cleanText = sanitizeExtractedText(result.value);
          if (cleanText) {
            setRawInputText(cleanText);
            setUploadedFileBadge(`Đã trích xuất văn bản sạch từ file Word "${fileName}"`);
            showToast(`Đã trích xuất file DOCX "${fileName}" thành công!`);
          } else {
            throw new Error('Empty DOCX text');
          }
        } catch (docxErr) {
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const rawXml = decoder.decode(arrayBuffer);
          const xmlMatches = [...rawXml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map(m => m[1]);
          const fallbackText = sanitizeExtractedText(xmlMatches.join(' '));
          setRawInputText(fallbackText || 'Không tìm thấy văn bản trong file DOCX.');
          setUploadedFileBadge(`Đã trích xuất nội dung từ "${fileName}"`);
        }
      } else if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const base64Pdf = arrayBufferToBase64(arrayBuffer);
        setPendingPdfInlineData({
          mimeType: 'application/pdf',
          data: base64Pdf
        });

        try {
          const pdfjsLib = await loadPdfJsFromCDN();
          const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let extractedPages = [];
          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            if (pageText.trim()) extractedPages.push(pageText.trim());
          }
          const cleanPdfText = sanitizeExtractedText(extractedPages.join('\n'));
          if (cleanPdfText) {
            setRawInputText(cleanPdfText);
            setUploadedFileBadge(`Đã đọc sạch ${pdfDoc.numPages} trang từ PDF "${fileName}"`);
            showToast(`Đã đọc sạch file PDF "${fileName}"!`);
          } else {
            setRawInputText(`[File PDF "${fileName}" đã sẵn sàng! Hãy bấm nút "AI Tự Động Nhận Diện" bên dưới để đọc]`);
            setUploadedFileBadge(`Đã nạp trực tiếp PDF "${fileName}"`);
            showToast(`Đã nạp file PDF "${fileName}". Bấm nút AI phân loại ngay!`);
          }
        } catch (pdfErr) {
          setRawInputText(`[Đã nạp file PDF "${fileName}". Hãy bấm AI phân loại!]`);
          setUploadedFileBadge(`Đã nạp PDF "${fileName}"`);
          showToast(`Đã tải file PDF "${fileName}"!`);
        }
      } else {
        const textContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result || '');
          reader.onerror = (err) => reject(err);
          reader.readAsText(file, 'UTF-8');
        });
        const cleanTxt = sanitizeExtractedText(String(textContent));
        setRawInputText(cleanTxt);
        setUploadedFileBadge(`Đã tải file "${fileName}"`);
        showToast(`Đã tải nội dung sạch từ file "${fileName}"!`);
      }
    } catch (err) {
      showToast('Không thể đọc file này. Vui lòng kiểm tra định dạng!', 'error');
    } finally {
      setIsExtractingFile(false);
      e.target.value = '';
    }
  };

  const handleAiSmartParse = async () => {
    if (!rawInputText.trim() && !pendingPdfInlineData) {
      showToast('Vui lòng dán danh sách từ vựng hoặc tải file lên trước!', 'error');
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

      const systemPrompt = `Bạn là AI bóc tách từ vựng siêu tốc. Hãy trích xuất từ vựng Tiếng Anh từ dữ liệu thành bảng JSON.
Quy tắc:
1. Nhận diện chính xác: word, ipa, pos, meaning (nghĩa tiếng Việt ngắn gọn), example (câu ví dụ tiếng Anh chứa từ đó).
2. Tự động bổ sung nếu thiếu.`;

      const result = await callGeminiAPI(
        `Trích xuất toàn bộ từ vựng từ nội dung sau:\n${rawInputText}`,
        systemPrompt,
        schema,
        pendingPdfInlineData
      );

      if (Array.isArray(result) && result.length > 0) {
        const formatted = result.map((item, idx) => ({
          id: `w_${Date.now()}_${idx}`,
          word: (item.word || '').trim(),
          ipa: (item.ipa || '').trim(),
          pos: (item.pos || 'n').trim(),
          meaning: (item.meaning || '').trim(),
          example: (item.example || '').trim(),
          learned: false,
          srsLevel: 0,
          nextReview: null,
          lastStudied: null
        })).filter(w => w.word);

        setParsedPreviewWords(formatted);
        showToast(`AI đã phân loại ${formatted.length} từ vựng thành công!`, 'success');
      } else {
        showToast('AI không tìm thấy từ vựng hợp lệ.', 'error');
      }
    } catch (error) {
      showToast('Có lỗi kết nối AI. Vui lòng thử lại!', 'error');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSaveParsedWords = async () => {
    if (parsedPreviewWords.length === 0) {
      showToast('Chưa có từ vựng nào để lưu!', 'error');
      return;
    }

    let updatedLessons = [...lessons];
    let targetId = importTargetLessonId;

    if (importTargetLessonId === 'new') {
      if (!newLessonTitle.trim()) {
        showToast('Vui lòng đặt Tên Bài Học mới!', 'error');
        return;
      }
      const newLesson = {
        id: `lesson_${Date.now()}`,
        title: newLessonTitle.trim(),
        description: newLessonDesc.trim() || `Bài học gồm ${parsedPreviewWords.length} từ vựng từ AI.`,
        createdAt: Date.now(),
        words: parsedPreviewWords
      };
      updatedLessons = [newLesson, ...updatedLessons];
      targetId = newLesson.id;
    } else {
      updatedLessons = updatedLessons.map(l => {
        if (l.id === importTargetLessonId) {
          return { ...l, words: [...l.words, ...parsedPreviewWords] };
        }
        return l;
      });
    }

    await saveToCloud(updatedLessons);
    setParsedPreviewWords([]);
    setRawInputText('');
    setUploadedFileBadge(null);
    setPendingPdfInlineData(null);
    setNewLessonTitle('');
    setNewLessonDesc('');
    setSelectedLessonId(targetId);
    setCurrentView('lesson-detail');
    showToast('Đã lưu từ vựng vào hệ thống đám mây!', 'success');
  };

  const [batchSize, setBatchSize] = useState(5);
  const [selectedWordIdsForSession, setSelectedWordIdsForSession] = useState([]);
  const [sessionWords, setSessionWords] = useState([]);
  const [sessionStage, setSessionStage] = useState('level1-flashcards'); 
  // 'level1-flashcards' | 'level1-quiz' | 'level2-spelling' | 'level3-translation' | 'session-complete'

  useEffect(() => {
    if (selectedLesson) {
      const unlearned = selectedLesson.words.filter(w => !w.learned);
      const initialPick = unlearned.slice(0, batchSize).map(w => w.id);
      setSelectedWordIdsForSession(initialPick);
    }
  }, [selectedLessonId, batchSize, lessons]);

  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  // LEVEL 2: SPELLING TYPING STATES (VI -> EN & EN -> VI)
  const [spellingQuestions, setSpellingQuestions] = useState([]);
  const [currentSpellingIndex, setCurrentSpellingIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState(null);
  const [spellingScore, setSpellingScore] = useState(0);

  // LEVEL 3: CEFR TRANSLATION STATES
  const [cefrLevel, setCefrLevel] = useState('B1');
  const [level3Challenges, setLevel3Challenges] = useState([]);
  const [currentL3Index, setCurrentL3Index] = useState(0);
  const [isRefiningL3Batch, setIsRefiningL3Batch] = useState(false);
  const [userTranslationInput, setUserTranslationInput] = useState('');
  const [isGradingL3, setIsGradingL3] = useState(false);
  const [l3GradingResult, setL3GradingResult] = useState(null);
  const l3SessionCacheRef = useRef({});

  const normalizeTextForComparison = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const generateBidirectionalSpelling = (wordsForSession) => {
    const generated = [];
    wordsForSession.forEach((targetWord) => {
      generated.push({
        id: `sp_vi2en_${targetWord.id}_${Math.random().toString(36).slice(2, 6)}`,
        wordObj: targetWord,
        direction: 'VI_TO_EN',
        promptLabel: 'Cho Nghĩa Tiếng Việt ➔ Gõ Từ Tiếng Anh chính xác:',
        promptMain: targetWord.meaning,
        promptSub: `Từ loại: (${targetWord.pos}) • Gợi ý chữ đầu: "${targetWord.word[0]}..." (${targetWord.word.length} chữ cái)`,
        correctAnswer: targetWord.word,
        placeholder: 'Gõ từ tiếng Anh...'
      });

      generated.push({
        id: `sp_en2vi_${targetWord.id}_${Math.random().toString(36).slice(2, 6)}`,
        wordObj: targetWord,
        direction: 'EN_TO_VI',
        promptLabel: 'Cho Từ Tiếng Anh ➔ Gõ Nghĩa Tiếng Việt tương ứng:',
        promptMain: targetWord.word,
        promptSub: `${targetWord.ipa} (${targetWord.pos})`,
        correctAnswer: targetWord.meaning,
        placeholder: 'Gõ nghĩa tiếng Việt...'
      });
    });

    for (let i = generated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }
    return generated;
  };

  const generateBidirectionalQuiz = (wordsForSession, allLessonWords) => {
    const pool = allLessonWords.length >= 4 ? allLessonWords : [...allLessonWords, ...INITIAL_LESSONS[0].words];
    const generated = [];

    wordsForSession.forEach((targetWord) => {
      const wrongEngWords = pool
        .filter(w => w.word.toLowerCase() !== targetWord.word.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.word);
      const engOptions = [...wrongEngWords, targetWord.word].sort(() => Math.random() - 0.5);

      generated.push({
        id: `q_vi2en_${targetWord.id}`,
        wordObj: targetWord,
        direction: 'VI_TO_EN',
        promptLabel: 'Chọn TỪ TIẾNG ANH đúng với nghĩa:',
        promptMain: targetWord.meaning,
        promptSub: `Từ loại: (${targetWord.pos})`,
        correctAnswer: targetWord.word,
        options: engOptions
      });

      const wrongViMeanings = pool
        .filter(w => w.meaning.toLowerCase() !== targetWord.meaning.toLowerCase())
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);
      const viOptions = [...wrongViMeanings, targetWord.meaning].sort(() => Math.random() - 0.5);

      generated.push({
        id: `q_en2vi_${targetWord.id}`,
        wordObj: targetWord,
        direction: 'EN_TO_VI',
        promptLabel: 'Chọn NGHĨA TIẾNG VIỆT đúng của từ:',
        promptMain: targetWord.word,
        promptSub: `${targetWord.ipa} (${targetWord.pos})`,
        correctAnswer: targetWord.meaning,
        options: viOptions
      });
    });

    for (let i = generated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    return generated;
  };

  const startLearningSession = (wordsToStudy) => {
    if (!wordsToStudy || wordsToStudy.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 từ vựng!', 'error');
      return;
    }
    setSessionWords(wordsToStudy);
    setFlashcardIndex(0);
    setSessionStage('level1-flashcards');
    setCurrentView('study-session');
    prefetchAllSessionLevel3(cefrLevel, wordsToStudy);
    setTimeout(() => {
      speakEnglish(wordsToStudy[0].word, `fc_${wordsToStudy[0].id}`);
    }, 300);
  };

  const startLevel1Quiz = () => {
    const questions = generateBidirectionalQuiz(sessionWords, selectedLesson?.words || sessionWords);
    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setQuizFeedback(null);
    setQuizScore(0);
    setSessionStage('level1-quiz');
  };

  const handleSelectQuizOption = (option) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);
    const currentQ = quizQuestions[currentQuizIndex];
    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      setQuizFeedback('correct');
      setQuizScore(prev => prev + 1);
      speakEnglish(currentQ.wordObj.word, `quiz_audio_${currentQ.id}`);
    } else {
      setQuizFeedback('wrong');
      setQuizQuestions(prev => [
        ...prev,
        {
          ...currentQ,
          id: `${currentQ.id}_retry_${prev.length}`,
          isRetry: true,
          options: [...currentQ.options].sort(() => Math.random() - 0.5)
        }
      ]);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex + 1 < quizQuestions.length) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setQuizFeedback(null);
    } else {
      const spQuestions = generateBidirectionalSpelling(sessionWords);
      setSpellingQuestions(spQuestions);
      setCurrentSpellingIndex(0);
      setSpellingInput('');
      setSpellingFeedback(null);
      setSpellingScore(0);
      setSessionStage('level2-spelling');
    }
  };

  const handleCheckSpelling = (e) => {
    if (e) e.preventDefault();
    if (spellingFeedback !== null) {
      handleNextSpellingQuestion();
      return;
    }
    const currentSp = spellingQuestions[currentSpellingIndex];
    if (!currentSp) return;

    const cleanUser = normalizeTextForComparison(spellingInput);
    if (!cleanUser) {
      showToast('Hãy gõ câu trả lời trước!', 'error');
      return;
    }

    let isMatch = false;
    if (currentSp.direction === 'VI_TO_EN') {
      isMatch = cleanUser === normalizeTextForComparison(currentSp.wordObj.word);
    } else {
      const fullMeaningNorm = normalizeTextForComparison(currentSp.wordObj.meaning);
      const meaningParts = currentSp.wordObj.meaning
        .split(/[,;/()]/)
        .map(s => normalizeTextForComparison(s))
        .filter(Boolean);

      isMatch =
        cleanUser === fullMeaningNorm ||
        meaningParts.some(part => part === cleanUser || (cleanUser.length >= 2 && part.includes(cleanUser)));
    }

    if (isMatch) {
      setSpellingFeedback('correct');
      setSpellingScore(prev => prev + 1);
      speakEnglish(currentSp.wordObj.word, `sp_audio_${currentSp.id}`);
    } else {
      setSpellingFeedback('wrong');
      speakEnglish(currentSp.wordObj.word, `sp_audio_${currentSp.id}`);
      setSpellingQuestions(prev => [
        ...prev,
        {
          ...currentSp,
          id: `${currentSp.id}_retry_${prev.length}`,
          isRetry: true
        }
      ]);
    }
  };

  const handleNextSpellingQuestion = () => {
    if (currentSpellingIndex + 1 < spellingQuestions.length) {
      setCurrentSpellingIndex(prev => prev + 1);
      setSpellingInput('');
      setSpellingFeedback(null);
    } else {
      const cached = l3SessionCacheRef.current[cefrLevel];
      if (cached && cached.length > 0) {
        setLevel3Challenges(cached);
      } else {
        initLevel3TranslationForEntireSession(cefrLevel, sessionWords);
      }
      setCurrentL3Index(0);
      setUserTranslationInput('');
      setL3GradingResult(null);
      setSessionStage('level3-translation');
    }
  };

  const prefetchAllSessionLevel3 = async (targetCefr = 'B1', customWords = sessionWords) => {
    if (!customWords || customWords.length === 0) return;
    const instantBatch = buildInstantCefrChallenges(customWords, targetCefr);
    l3SessionCacheRef.current[targetCefr] = instantBatch;
    setLevel3Challenges(instantBatch);

    setIsRefiningL3Batch(true);
    try {
      const wordListDesc = customWords.map(w => `${w.word} (${w.pos}: ${w.meaning})`).join('; ');
      const schema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            vietnameseSentence: { type: "STRING" },
            targetWordsUsed: { type: "ARRAY", items: { type: "STRING" } },
            hintStructure: { type: "STRING" },
            sampleEnglishSentence: { type: "STRING" }
          },
          propertyOrdering: ["vietnameseSentence", "targetWordsUsed", "hintStructure", "sampleEnglishSentence"]
        }
      };

      const numSentences = Math.min(customWords.length, 5);
      const systemPrompt = `Tạo ${numSentences} câu Tiếng Việt để dịch sang Tiếng Anh cho TOÀN BỘ PHIÊN HỌC ở trình độ CEFR ${targetCefr}. Bao phủ các từ: ${wordListDesc}.`;

      const res = await callGeminiAPI(
        `Tạo bộ ${numSentences} câu dịch Việt -> Anh trình độ ${targetCefr} cho các từ: ${wordListDesc}`,
        systemPrompt,
        schema
      );

      if (Array.isArray(res) && res.length > 0) {
        l3SessionCacheRef.current[targetCefr] = res;
        setLevel3Challenges(res);
      }
    } catch (e) {
    } finally {
      setIsRefiningL3Batch(false);
    }
  };

  const initLevel3TranslationForEntireSession = (newSessionCefr, customWords = sessionWords) => {
    setCefrLevel(newSessionCefr);
    setL3GradingResult(null);
    setUserTranslationInput('');
    setCurrentL3Index(0);

    if (l3SessionCacheRef.current[newSessionCefr] && l3SessionCacheRef.current[newSessionCefr].length > 0) {
      setLevel3Challenges(l3SessionCacheRef.current[newSessionCefr]);
      showToast(`Đã áp dụng trình độ ${newSessionCefr} cho toàn phiên!`, 'success');
      return;
    }

    prefetchAllSessionLevel3(newSessionCefr, customWords);
    showToast(`Đã chuyển phiên học sang trình độ ${newSessionCefr}!`, 'success');
  };

  const handleGradeTranslation = async (currentChallenge, userAnswer, currentLevel) => {
    const cleanInput = userAnswer.trim();
    if (!cleanInput) {
      showToast('Hãy nhập câu dịch của bạn!', 'error');
      return;
    }

    const requiredList = currentChallenge.targetWordsUsed || [];
    const lowerUser = cleanInput.toLowerCase();
    const matchedKeywords = requiredList.filter(kw => lowerUser.includes(kw.toLowerCase().slice(0, Math.max(4, kw.length - 2))));
    const hasAllKeywords = matchedKeywords.length === requiredList.length;

    setL3GradingResult({
      isInstantPreCheck: true,
      isCorrect: hasAllKeywords && cleanInput.split(' ').length >= 4,
      score: hasAllKeywords ? 85 : 60,
      verdictTitle: hasAllKeywords ? '⚡ Đã nhận diện đúng từ vựng mục tiêu!' : '⚡ Lưu ý: Chưa dùng đủ từ khóa.',
      errorAnalysisVi: 'Đang đối chiếu cấu trúc ngữ pháp CEFR ' + currentLevel + '...',
      grammarAndVocabFixes: [],
      standardEnglishSentence: currentChallenge.sampleEnglishSentence || ''
    });

    setIsGradingL3(true);
    try {
      const schema = {
        type: "OBJECT",
        properties: {
          isCorrect: { type: "BOOLEAN" },
          score: { type: "INTEGER" },
          verdictTitle: { type: "STRING" },
          errorAnalysisVi: { type: "STRING" },
          grammarAndVocabFixes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                wrongPart: { type: "STRING" },
                correction: { type: "STRING" },
                reasonVi: { type: "STRING" }
              },
              propertyOrdering: ["wrongPart", "correction", "reasonVi"]
            }
          },
          standardEnglishSentence: { type: "STRING" }
        },
        propertyOrdering: ["isCorrect", "score", "verdictTitle", "errorAnalysisVi", "grammarAndVocabFixes", "standardEnglishSentence"]
      };

      const systemPrompt = `Chấm câu dịch Việt -> Anh ở trình độ ${currentLevel}. Chỉ rõ đúng/sai bằng Tiếng Việt, sửa lỗi cụ thể và đưa ra câu chuẩn.`;
      const prompt = `Câu gốc: "${currentChallenge.vietnameseSentence}" | Từ bắt buộc: ${requiredList.join(', ')} | Học viên dịch: "${cleanInput}"`;

      const grade = await callGeminiAPI(prompt, systemPrompt, schema);
      setL3GradingResult({ ...grade, isInstantPreCheck: false });

      if (grade?.standardEnglishSentence) {
        speakEnglish(grade.standardEnglishSentence, 'l3_standard_audio');
      }
    } catch (e) {
      setL3GradingResult(prev => ({
        ...prev,
        isInstantPreCheck: false,
        verdictTitle: hasAllKeywords ? 'Bản dịch hợp lệ!' : 'Hãy bổ sung từ vựng mục tiêu!',
        errorAnalysisVi: 'Bạn đã vận dụng từ vựng trong phiên. Hãy đối chiếu câu mẫu chuẩn bên dưới.'
      }));
    } finally {
      setIsGradingL3(false);
    }
  };

  const handleCompleteSessionAndSave = async () => {
    const sessionWordIdSet = new Set(sessionWords.map(w => w.id));
    const now = Date.now();

    const updatedLessons = lessons.map(lesson => {
      if (lesson.id !== selectedLesson.id) return lesson;
      const updatedWords = lesson.words.map(w => {
        if (sessionWordIdSet.has(w.id)) {
          const nextSrs = (w.srsLevel || 0) + 1;
          const hoursToAdd = SRS_INTERVALS_HOURS[Math.min(nextSrs, SRS_INTERVALS_HOURS.length - 1)] || 24;
          return {
            ...w,
            learned: true,
            srsLevel: nextSrs,
            lastStudied: now,
            nextReview: now + hoursToAdd * 3600 * 1000
          };
        }
        return w;
      });
      return { ...lesson, words: updatedWords };
    });

    const updatedStats = {
      ...stats,
      totalSessionsCompleted: (stats.totalSessionsCompleted || 0) + 1,
      xp: (stats.xp || 0) + sessionWords.length * 25,
      lastStudyDate: new Date().toISOString().split('T')[0]
    };

    await saveToCloud(updatedLessons, updatedStats);
    setSessionStage('session-complete');
    showToast('Đã lưu tiến trình phiên học vào đám mây tài khoản admin!', 'success');
  };

  const [forceUnlockMastery, setForceUnlockMastery] = useState(false);
  const [masteryCefr, setMasteryCefr] = useState('B1');
  const [masteryStoryChallenges, setMasteryStoryChallenges] = useState([]);
  const [currentMasteryIdx, setCurrentMasteryIdx] = useState(0);
  const [isGeneratingMastery, setIsGeneratingMastery] = useState(false);
  const [masteryUserAnswer, setMasteryUserAnswer] = useState('');
  const [masteryGradeResult, setMasteryGradeResult] = useState(null);
  const [isGradingMastery, setIsGradingMastery] = useState(false);

  const generateMasterySynthesis = async (lessonObj, levelCode = masteryCefr) => {
    if (!lessonObj) return;
    setMasteryCefr(levelCode);
    setIsGeneratingMastery(true);
    setMasteryGradeResult(null);
    setMasteryUserAnswer('');
    setCurrentMasteryIdx(0);

    try {
      const allWordsList = lessonObj.words.map(w => `${w.word} (${w.meaning})`).join(', ');
      const schema = {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            chapterTitle: { type: "STRING" },
            brainContextNote: { type: "STRING" },
            vietnameseChallenge: { type: "STRING" },
            requiredWords: { type: "ARRAY", items: { type: "STRING" } },
            sampleMasterEnglish: { type: "STRING" }
          },
          propertyOrdering: ["chapterTitle", "brainContextNote", "vietnameseChallenge", "requiredWords", "sampleMasterEnglish"]
        }
      };

      const systemPrompt = `Bạn là Kiến Trúc Sư Ngôn Ngữ Não Bộ. Hãy tạo ra 3 thử thách tình huống liên hoàn bằng Tiếng Việt ở trình độ CEFR ${levelCode} tổng hợp các từ: ${allWordsList}.`;

      const res = await callGeminiAPI(
        `Tạo 3 thử thách dịch thuật trình độ ${levelCode} tổng hợp các từ: ${allWordsList}`,
        systemPrompt,
        schema
      );

      if (Array.isArray(res) && res.length > 0) {
        setMasteryStoryChallenges(res);
      }
    } catch (e) {
      showToast('Lỗi tạo thử thách tổng hợp!', 'error');
    } finally {
      setIsGeneratingMastery(false);
    }
  };

  const handleGradeMasteryChallenge = async () => {
    const currentItem = masteryStoryChallenges[currentMasteryIdx];
    if (!currentItem || !masteryUserAnswer.trim()) {
      showToast('Hãy nhập câu dịch tổng hợp!', 'error');
      return;
    }
    setIsGradingMastery(true);
    try {
      const schema = {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          isPassed: { type: "BOOLEAN" },
          detailedFeedbackVi: { type: "STRING" },
          usedKeywordsCheck: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                word: { type: "STRING" },
                usedCorrectly: { type: "BOOLEAN" },
                comment: { type: "STRING" }
              },
              propertyOrdering: ["word", "usedCorrectly", "comment"]
            }
          },
          errorCorrections: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                errorPart: { type: "STRING" },
                fixedPart: { type: "STRING" },
                explanationVi: { type: "STRING" }
              },
              propertyOrdering: ["errorPart", "fixedPart", "explanationVi"]
            }
          },
          perfectEnglishSentence: { type: "STRING" }
        },
        propertyOrdering: ["score", "isPassed", "detailedFeedbackVi", "usedKeywordsCheck", "errorCorrections", "perfectEnglishSentence"]
      };

      const prompt = `Tình huống: "${currentItem.vietnameseChallenge}" | Từ khóa: ${(currentItem.requiredWords || []).join(', ')} | Trình độ: ${masteryCefr} | Câu học viên: "${masteryUserAnswer}"`;

      const result = await callGeminiAPI(
        prompt,
        `Chấm câu dịch tổng hợp nhiều từ vựng, giải thích bằng Tiếng Việt và đưa ra câu chuẩn.`,
        schema
      );

      setMasteryGradeResult(result);
      if (result?.perfectEnglishSentence) {
        speakEnglish(result.perfectEnglishSentence, 'mastery_perfect_audio');
      }
    } catch (e) {
      showToast('Có lỗi khi chấm câu tổng hợp!', 'error');
    } finally {
      setIsGradingMastery(false);
    }
  };

  const handleResetLessonProgress = async (lessonId) => {
    const updated = lessons.map(l => {
      if (l.id !== lessonId) return l;
      return {
        ...l,
        words: l.words.map(w => ({ ...w, learned: false, srsLevel: 0, nextReview: null }))
      };
    });
    await saveToCloud(updated);
    showToast('Đã đặt lại trạng thái từ vựng!', 'success');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
              <Brain className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">NeuroVocab AI</h1>
            <p className="text-sm text-slate-400 mt-1">Hệ thống học từ vựng nội bộ & Đồng bộ tiến trình</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tài khoản</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng Nhập & Đồng Bộ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 md:pb-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header bar */}
      <header className="sticky top-0 z-30 bg-slate-900/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div onClick={() => setCurrentView('dashboard')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">NeuroVocab</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO AI</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Hệ thống học từ vựng khoa học • Đồng bộ thiết bị</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                currentView === 'dashboard' || currentView === 'lesson-detail' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Kho Bài Học ({lessons.length})</span>
            </button>

            <button
              onClick={() => setCurrentView('import')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                currentView === 'import' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>AI Nhập Từ Vựng</span>
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 hidden sm:inline">Đã lưu • admin</span>
            </div>

            <button
              onClick={() => {
                setLoginPassword('');
                setIsLoggedIn(false);
              }}
              title="Đăng xuất"
              className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-rose-300 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tài khoản: admin • Đồng bộ thời gian thực</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Chinh phục từ vựng khoa học với AI</h2>
                  <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
                    Upload file `.docx`, `.pdf`, `.txt` để AI phân loại từ. Học theo phiên với Level 1 Flashcard & Trắc nghiệm, Level 2 Gõ chính tả 2 chiều, Level 3 Dịch câu CEFR và Mục Tổng Hợp Tinh Túy.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedLessonId(lessons[0]?.id);
                      setCurrentView('lesson-detail');
                    }}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Vào Học Ngay</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('import')}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload File / AI Phân Loại</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiến Trình Admin</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> {stats.xp} XP
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                      <div className="text-2xl font-bold text-white">
                        {allWordsSummary.learned} <span className="text-sm font-normal text-slate-500">/ {allWordsSummary.total}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Từ đã thuộc</div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5">
                      <div className="text-2xl font-bold text-indigo-400">{stats.totalSessionsCompleted || 0}</div>
                      <div className="text-xs text-slate-400 mt-1">Phiên hoàn tất</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Danh Sách Bài Học</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {lessons.map((lesson) => {
                  const totalW = lesson.words.length;
                  const learnedW = lesson.words.filter(w => w.learned).length;
                  const progressPct = totalW > 0 ? Math.round((learnedW / totalW) * 100) : 0;
                  const isAllLearned = totalW > 0 && learnedW === totalW;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        setSelectedLessonId(lesson.id);
                        setCurrentView('lesson-detail');
                      }}
                      className="group bg-slate-900 hover:bg-slate-900/95 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                            isAllLearned ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                          }`}>
                            {isAllLearned ? '★ Hoàn thành 100%' : `Còn ${totalW - learnedW} từ`}
                          </span>
                          {isAllLearned ? (
                            <span className="text-xs text-amber-300 flex items-center gap-1"><Unlock className="w-3.5 h-3.5" /> Mở Tinh Túy</span>
                          ) : (
                            <span className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Khóa Tinh Túy</span>
                          )}
                        </div>

                        <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition line-clamp-2">{lesson.title}</h4>
                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{lesson.description}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-slate-400">Tiến độ: <strong className="text-white">{learnedW}/{totalW}</strong></span>
                          <span className="font-bold text-indigo-400">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentView === 'import' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => setCurrentView('dashboard')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  <span>AI Upload & Phân Loại Từ Vựng (.TXT, .DOCX, .PDF)</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">1. Chọn Bài Học</label>
                  <select
                    value={importTargetLessonId}
                    onChange={(e) => setImportTargetLessonId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  >
                    <option value="new">+ Tạo Bài Học Mới</option>
                    {lessons.map(l => (
                      <option key={l.id} value={l.id}>Thêm vào: {l.title}</option>
                    ))}
                  </select>
                </div>

                {importTargetLessonId === 'new' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Tên bài học *</label>
                      <input
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="VD: Bài 3: Từ vựng chuyên ngành..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">2. Upload File (.TXT, .DOCX, .PDF)</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-500/5 rounded-2xl p-5 cursor-pointer text-center">
                    {isExtractingFile ? (
                      <>
                        <Loader2 className="w-7 h-7 text-indigo-400 mb-2 animate-spin" />
                        <span className="text-xs font-bold text-indigo-300">Đang đọc sạch file...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-indigo-400 mb-2" />
                        <span className="text-xs font-semibold text-indigo-200">Chọn File Word, PDF hoặc Text</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".txt,.docx,.pdf,.csv,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadedFileBadge && (
                    <div className="mt-2.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
                      <span>{uploadedFileBadge}</span>
                      <button type="button" onClick={() => { setUploadedFileBadge(null); setRawInputText(''); }}><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>

                <div>
                  <textarea
                    rows={6}
                    value={rawInputText}
                    onChange={(e) => setRawInputText(e.target.value)}
                    placeholder="Hoặc dán danh sách từ vựng vào đây..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleAiSmartParse}
                  disabled={isAiParsing || isExtractingFile}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAiParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  <span>AI Tự Động Nhận Diện Từ Vựng</span>
                </button>
              </div>

              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-3">Bảng Xem Trước Từ Vựng ({parsedPreviewWords.length} từ)</h3>
                  <div className="overflow-x-auto max-h-[460px] overflow-y-auto space-y-2.5">
                    {parsedPreviewWords.map((item, idx) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={item.word}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedPreviewWords(prev => prev.map((w, i) => i === idx ? { ...w, word: val } : w));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-300"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            value={`${item.ipa} (${item.pos})`}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedPreviewWords(prev => prev.map((w, i) => i === idx ? { ...w, ipa: val } : w));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={item.meaning}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedPreviewWords(prev => prev.map((w, i) => i === idx ? { ...w, meaning: val } : w));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-300"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={item.example}
                            onChange={(e) => {
                              const val = e.target.value;
                              setParsedPreviewWords(prev => prev.map((w, i) => i === idx ? { ...w, example: val } : w));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveParsedWords}
                    disabled={parsedPreviewWords.length === 0}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm shadow-lg cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lưu Vào Bài Học</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'lesson-detail' && selectedLesson && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div>
                <button onClick={() => setCurrentView('dashboard')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2 font-semibold cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Danh sách bài học
                </button>
                <h2 className="text-2xl font-bold text-white">{selectedLesson.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedLesson.description}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button onClick={() => handleResetLessonProgress(selectedLesson.id)} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer">
                  Học lại từ đầu
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Chọn số lượng từ trong 1 phiên:</h3>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[5, 10, 15].map((count) => {
                      const unlearnedPool = selectedLesson.words.filter(w => !w.learned);
                      const isActive = batchSize === count;
                      return (
                        <button
                          key={count}
                          onClick={() => {
                            setBatchSize(count);
                            setSelectedWordIdsForSession(unlearnedPool.slice(0, count).map(w => w.id));
                          }}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                            isActive ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="text-xl font-extrabold text-white">{count} Từ</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-300">Đã chọn: <strong className="text-indigo-400">{selectedWordIdsForSession.length} từ</strong></span>
                  <button
                    onClick={() => {
                      const chosenWords = selectedLesson.words.filter(w => selectedWordIdsForSession.includes(w.id));
                      startLearningSession(chosenWords);
                    }}
                    disabled={selectedWordIdsForSession.length === 0}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-40 text-white font-bold text-sm shadow-xl cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Bắt Đầu Phiên Học</span>
                  </button>
                </div>
              </div>

              {(() => {
                const totalW = selectedLesson.words.length;
                const learnedW = selectedLesson.words.filter(w => w.learned).length;
                const isNaturallyUnlocked = totalW > 0 && learnedW === totalW;
                const isUnlocked = isNaturallyUnlocked || forceUnlockMastery;

                return (
                  <div className={`lg:col-span-4 rounded-3xl p-6 border flex flex-col justify-between ${
                    isUnlocked ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/40' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${isUnlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                          {isUnlocked ? 'Đã mở khóa' : 'Khóa'} Tinh Túy
                        </span>
                        {!isNaturallyUnlocked && (
                          <button onClick={() => setForceUnlockMastery(!forceUnlockMastery)} className="text-[11px] text-indigo-400 underline cursor-pointer">
                            {forceUnlockMastery ? 'Khóa' : 'Mở thử'}
                          </button>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">Mục Tổng Hợp Tinh Túy</h3>
                      <p className="text-xs text-slate-300 mt-2">Ôn tập toàn bộ từ vựng trong bài với các câu hỏi dịch thuật tổng hợp thông minh.</p>
                    </div>

                    <div className="mt-6">
                      {isUnlocked ? (
                        <button
                          onClick={() => {
                            generateMasterySynthesis(selectedLesson, 'B1');
                            setCurrentView('mastery-hub');
                          }}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Vào Tinh Túy Bài Học</span>
                        </button>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                          Hoàn thành 100% từ vựng để mở khóa!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {currentView === 'study-session' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex justify-between items-center">
              <button onClick={() => setCurrentView('lesson-detail')} className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer">
                <ChevronLeft className="w-4 h-4" /> Thoát phiên
              </button>
              <div className="text-xs font-bold text-indigo-400">
                {sessionStage === 'level1-flashcards' && 'Level 1A: Flashcard'}
                {sessionStage === 'level1-quiz' && 'Level 1B: Trắc Nghiệm'}
                {sessionStage === 'level2-spelling' && 'Level 2: Gõ Chính Tả'}
                {sessionStage === 'level3-translation' && 'Level 3: Dịch Câu AI'}
              </div>
            </div>

            {/* LEVEL 1A: FLASHCARD */}
            {sessionStage === 'level1-flashcards' && sessionWords[flashcardIndex] && (() => {
              const currentWord = sessionWords[flashcardIndex];
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="font-bold text-indigo-400">Level 1A • Thẻ Từ Vựng Hiện Thẳng Nghĩa</span>
                    <span>Từ {flashcardIndex + 1} / {sessionWords.length}</span>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-950 border border-indigo-500/30 space-y-4 text-center">
                    <h3 className="text-3xl font-extrabold text-white">{currentWord.word}</h3>
                    <p className="text-slate-400 font-mono">{currentWord.ipa} ({currentWord.pos})</p>
                    <div className="text-2xl font-extrabold text-emerald-300">{currentWord.meaning}</div>
                    {currentWord.example && <p className="text-slate-300 italic">"{currentWord.example}"</p>}
                    <button
                      onClick={() => speakEnglish(currentWord.word, `fc_${currentWord.id}`)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer mx-auto"
                    >
                      <Volume2 className="w-4 h-4" /> Nghe phát âm
                    </button>
                  </div>

                  <div className="flex justify-end">
                    {flashcardIndex + 1 < sessionWords.length ? (
                      <button
                        onClick={() => {
                          setFlashcardIndex(prev => prev + 1);
                          speakEnglish(sessionWords[flashcardIndex + 1].word, `fc_${sessionWords[flashcardIndex + 1].id}`);
                        }}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm cursor-pointer"
                      >
                        Tiếp theo
                      </button>
                    ) : (
                      <button
                        onClick={startLevel1Quiz}
                        className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm cursor-pointer"
                      >
                        Sang Trắc Nghiệm Level 1B
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* LEVEL 1B: TRẮC NGHIỆM */}
            {sessionStage === 'level1-quiz' && quizQuestions[currentQuizIndex] && (() => {
              const currentQ = quizQuestions[currentQuizIndex];
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="font-bold text-indigo-400">Level 1B • Trắc Nghiệm 2 Chiều</span>
                    <span>Câu {currentQuizIndex + 1} / {quizQuestions.length}</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950 text-center space-y-2">
                    <span className="text-xs text-slate-400">{currentQ.promptLabel}</span>
                    <div className="text-2xl font-extrabold text-white">{currentQ.promptMain}</div>
                    <div className="text-xs text-slate-400">{currentQ.promptSub}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQ.options.map((opt, idx) => {
                      const isPicked = selectedOption === opt;
                      const isRightOption = opt === currentQ.correctAnswer;
                      let btnStyle = 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-200';
                      if (selectedOption !== null) {
                        if (isRightOption) btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold';
                        else if (isPicked) btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                      }
                      return (
                        <button
                          key={idx}
                          disabled={selectedOption !== null}
                          onClick={() => handleSelectQuizOption(opt)}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="pt-2 flex justify-between items-center border-t border-slate-800">
                      <span className={quizFeedback === 'correct' ? 'text-emerald-400 font-bold text-sm' : 'text-rose-400 font-bold text-sm'}>
                        {quizFeedback === 'correct' ? 'Chính xác!' : 'Sai! Câu này đã được đẩy xuống cuối hàng đợi để làm lại.'}
                      </span>
                      <button onClick={handleNextQuizQuestion} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm cursor-pointer">
                        Tiếp theo
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* LEVEL 2: GÕ CHÍNH TẢ 2 CHIỀU */}
            {sessionStage === 'level2-spelling' && spellingQuestions[currentSpellingIndex] && (() => {
              const currentSp = spellingQuestions[currentSpellingIndex];
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="font-bold text-indigo-400">Level 2 • Gõ Chính Tả 2 Chiều</span>
                    <span>Câu {currentSpellingIndex + 1} / {spellingQuestions.length}</span>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-950 text-center space-y-2">
                    <span className="text-xs text-slate-400">{currentSp.promptLabel}</span>
                    <div className="text-2xl font-extrabold text-white">{currentSp.promptMain}</div>
                    <div className="text-xs text-slate-400">{currentSp.promptSub}</div>
                  </div>

                  <form onSubmit={handleCheckSpelling} className="space-y-4">
                    <input
                      type="text"
                      autoFocus
                      disabled={spellingFeedback !== null}
                      value={spellingInput}
                      onChange={(e) => setSpellingInput(e.target.value)}
                      placeholder={currentSp.placeholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-white text-lg font-bold focus:outline-none"
                    />

                    {spellingFeedback === null ? (
                      <div className="flex justify-end">
                        <button type="submit" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm cursor-pointer">
                          Kiểm Tra Chính Tả
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                        <span className={spellingFeedback === 'correct' ? 'text-emerald-400 font-bold text-sm' : 'text-rose-400 font-bold text-sm'}>
                          {spellingFeedback === 'correct' ? 'Chính xác!' : `Sai! Đáp án đúng: ${currentSp.correctAnswer}`}
                        </span>
                        <button type="button" onClick={handleNextSpellingQuestion} className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm cursor-pointer">
                          Tiếp theo
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              );
            })()}

            {/* LEVEL 3: DỊCH CÂU AI CEFR */}
            {sessionStage === 'level3-translation' && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-xs font-bold text-indigo-300">Level 3 • Chọn Trình Độ CEFR Cho Cả Phiên:</span>
                  <div className="flex gap-1">
                    {CEFR_LEVELS.map(lvl => (
                      <button
                        key={lvl.code}
                        onClick={() => initLevel3TranslationForEntireSession(lvl.code, sessionWords)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          cefrLevel === lvl.code ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {lvl.code}
                      </button>
                    ))}
                  </div>
                </div>

                {level3Challenges[currentL3Index] ? (() => {
                  const currentChallenge = level3Challenges[currentL3Index];
                  return (
                    <div className="space-y-4">
                      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs text-emerald-400 font-bold">Dịch sang Tiếng Anh (Cấp độ {cefrLevel}):</span>
                        <p className="text-lg font-bold text-white">"{currentChallenge.vietnameseSentence}"</p>
                      </div>

                      <textarea
                        rows={3}
                        value={userTranslationInput}
                        onChange={(e) => setUserTranslationInput(e.target.value)}
                        placeholder="Nhập câu dịch Tiếng Anh..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none"
                      />

                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleGradeTranslation(currentChallenge, userTranslationInput, cefrLevel)}
                          disabled={isGradingL3}
                          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm cursor-pointer flex items-center gap-2"
                        >
                          {isGradingL3 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          <span>AI Chấm Điểm & Sửa Lỗi</span>
                        </button>

                        {currentL3Index + 1 < level3Challenges.length ? (
                          <button
                            onClick={() => {
                              setCurrentL3Index(prev => prev + 1);
                              setUserTranslationInput('');
                              setL3GradingResult(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 cursor-pointer"
                          >
                            Câu tiếp theo
                          </button>
                        ) : (
                          <button
                            onClick={handleCompleteSessionAndSave}
                            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm cursor-pointer flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Hoàn Thành Phiên Học</span>
                          </button>
                        )}
                      </div>

                      {l3GradingResult && (
                        <div className="p-6 rounded-3xl bg-slate-950 border border-indigo-500/40 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center">
                              {l3GradingResult.score}đ
                            </div>
                            <h4 className="font-bold text-white text-base">{l3GradingResult.verdictTitle}</h4>
                          </div>
                          <p className="text-sm text-slate-200">{l3GradingResult.errorAnalysisVi}</p>
                          {l3GradingResult.standardEnglishSentence && (
                            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex justify-between items-center">
                              <span className="text-sm text-white font-semibold">"{l3GradingResult.standardEnglishSentence}"</span>
                              <button
                                onClick={() => speakEnglish(l3GradingResult.standardEnglishSentence, 'l3_audio')}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                              >
                                Nghe máy đọc
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })() : null}
              </div>
            )}

            {sessionStage === 'session-complete' && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-12 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <Award className="w-11 h-11" />
                </div>
                <h2 className="text-3xl font-extrabold text-white">Hoàn Thành Xuất Sắc Phiên Học!</h2>
                <button onClick={() => setCurrentView('lesson-detail')} className="px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm cursor-pointer">
                  Quay Lại Bài Học
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'mastery-hub' && selectedLesson && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center">
                <button onClick={() => setCurrentView('lesson-detail')} className="text-xs text-amber-300 flex items-center gap-1 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Quay lại
                </button>
                <h2 className="text-xl font-bold text-white">Mục Tổng Hợp Tinh Túy</h2>
              </div>

              {isGeneratingMastery ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-sm text-white">AI đang tạo thử thách tổng hợp...</p>
                </div>
              ) : masteryStoryChallenges[currentMasteryIdx] ? (() => {
                const currentChallenge = masteryStoryChallenges[currentMasteryIdx];
                return (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs text-amber-400 font-bold">Thử thách dịch tổng hợp:</span>
                      <p className="text-lg font-bold text-white">"{currentChallenge.vietnameseChallenge}"</p>
                    </div>

                    <textarea
                      rows={3}
                      value={masteryUserAnswer}
                      onChange={(e) => setMasteryUserAnswer(e.target.value)}
                      placeholder="Dịch câu tổng hợp sang Tiếng Anh..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:outline-none"
                    />

                    <button
                      onClick={handleGradeMasteryChallenge}
                      disabled={isGradingMastery}
                      className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm cursor-pointer flex items-center gap-2"
                    >
                      {isGradingMastery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>AI Chấm Điểm Tổng Hợp</span>
                    </button>

                    {masteryGradeResult && (
                      <div className="p-6 rounded-3xl bg-slate-950 border border-amber-500/40 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center">
                            {masteryGradeResult.score}đ
                          </div>
                          <h4 className="font-bold text-white text-base">Đánh giá từ AI</h4>
                        </div>
                        <p className="text-sm text-slate-200">{masteryGradeResult.detailedFeedbackVi}</p>
                        {masteryGradeResult.perfectEnglishSentence && (
                          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex justify-between items-center">
                            <span className="text-sm text-white font-semibold">"{masteryGradeResult.perfectEnglishSentence}"</span>
                            <button
                              onClick={() => speakEnglish(masteryGradeResult.perfectEnglishSentence, 'mastery_audio')}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Nghe máy đọc
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })() : null}
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-around">
        <button onClick={() => setCurrentView('dashboard')} className="flex flex-col items-center gap-1 text-[11px] text-indigo-400">
          <BookOpen className="w-5 h-5" />
          <span>Bài Học</span>
        </button>
        <button onClick={() => setCurrentView('import')} className="flex flex-col items-center gap-1 text-[11px] text-slate-400">
          <Wand2 className="w-5 h-5" />
          <span>Upload</span>
        </button>
      </div>
    </div>
  );
}
window.App = App;