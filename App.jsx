const { useState, useEffect, useMemo, useRef } = React;
const { 
  BookOpen, Brain, Sparkles, Upload, Volume2, CheckCircle2, 
  Lock, Unlock, Play, RotateCcw, Plus, Trash2, Check, X, 
  ChevronRight, ChevronLeft, Award, Zap, Clock, Layers, 
  LogOut, User, FileText, Settings, HelpCircle, ArrowRight,
  RefreshCw, Star, ShieldCheck, AlertCircle, BarChart3, 
  Smartphone, Monitor, Headphones, Eye, CheckSquare, Square,
  Flame, Compass, GraduationCap, Wand2, Loader2, Keyboard, BookMarked
} = LucideReact;

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

function App() {
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
    setSyncStatus('synced');
  }, []);

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
            setRawInputText(`[File PDF "${fileName}" đã sẵn sàng!]`);
            setUploadedFileBadge(`Đã nạp trực tiếp PDF "${fileName}"`);
            showToast(`Đã nạp file PDF "${fileName}"!`);
          }
        } catch (pdfErr) {
          setRawInputText(`[Đã nạp file PDF "${fileName}"]`);
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

      const systemPrompt = `Bạn là AI bóc tách từ vựng siêu tốc. Hãy trích xuất từ vựng Tiếng Anh từ dữ liệu thành bảng JSON.`;

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

  const [spellingQuestions, setSpellingQuestions] = useState([]);
  const [currentSpellingIndex, setCurrentSpellingIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState(null);
  const [spellingScore, setSpellingScore] = useState(0);

  const [cefrLevel, setCefrLevel] = useState('B1');
  const [level3Challenges, setLevel3Challenges] = useState([]);
  const [currentL3Index, setCurrentL3Index] = useState(0);
  const [userTranslationInput, setUserTranslationInput] = useState('');
  const [isGradingL3, setIsGradingL3] = useState(false);
  const [l3GradingResult, setL3GradingResult] = useState(null);
  const l3SessionCacheRef = useRef({});

  const normalizeTextForComparison = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const generateBidirectionalSpelling = (wordsForSession) => {
    const generated = [];
    wordsForSession.forEach((targetWord) => {
      generated.push({
        id: `sp_vi2en_${targetWord.id}`,
        wordObj: targetWord,
        direction: 'VI_TO_EN',
        promptLabel: 'Cho Nghĩa Tiếng Việt ➔ Gõ Từ Tiếng Anh chính xác:',
        promptMain: targetWord.meaning,
        promptSub: `Từ loại: (${targetWord.pos})`,
        correctAnswer: targetWord.word,
        placeholder: 'Gõ từ tiếng Anh...'
      });
      generated.push({
        id: `sp_en2vi_${targetWord.id}`,
        wordObj: targetWord,
        direction: 'EN_TO_VI',
        promptLabel: 'Cho Từ Tiếng Anh ➔ Gõ Nghĩa Tiếng Việt tương ứng:',
        promptMain: targetWord.word,
        promptSub: `${targetWord.ipa} (${targetWord.pos})`,
        correctAnswer: targetWord.meaning,
        placeholder: 'Gõ nghĩa tiếng Việt...'
      });
    });
    return generated.sort(() => Math.random() - 0.5);
  };

  const generateBidirectionalQuiz = (wordsForSession, allLessonWords) => {
    const pool = allLessonWords.length >= 4 ? allLessonWords : [...allLessonWords, ...INITIAL_LESSONS[0].words];
    const generated = [];

    wordsForSession.forEach((targetWord) => {
      const wrongEngWords = pool.filter(w => w.word.toLowerCase() !== targetWord.word.toLowerCase()).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
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

      const wrongViMeanings = pool.filter(w => w.meaning.toLowerCase() !== targetWord.meaning.toLowerCase()).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
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

    return generated.sort(() => Math.random() - 0.5);
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
    setTimeout(() => { speakEnglish(wordsToStudy[0].word); }, 300);
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
      speakEnglish(currentQ.wordObj.word);
    } else {
      setQuizFeedback('wrong');
      setQuizQuestions(prev => [...prev, { ...currentQ, id: `${currentQ.id}_retry`, isRetry: true }]);
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
      isMatch = cleanUser === fullMeaningNorm || fullMeaningNorm.includes(cleanUser);
    }

    if (isMatch) {
      setSpellingFeedback('correct');
      setSpellingScore(prev => prev + 1);
      speakEnglish(currentSp.wordObj.word);
    } else {
      setSpellingFeedback('wrong');
      speakEnglish(currentSp.wordObj.word);
      setSpellingQuestions(