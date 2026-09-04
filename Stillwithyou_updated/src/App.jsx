import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { animateGrow } from './treeEngine';
import { useAuth } from './context/AuthContext.jsx';
import { loadModels } from './utils/faceApi';
import LoginModal from './components/LoginModal.jsx';
import AboutIdea from './components/AboutIdea.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import UserDashboardExtras from './components/UserDashboardExtras.jsx';
import handImage from './images/hand.png';
import ShopDashboard from './components/ShopDashboard.jsx';

const GRASS_DARK = [
  "M0,92 Q5,52 10,92Z", "M16,92 Q22,44 28,92Z", "M34,92 Q39,56 44,92Z",
  "M50,92 Q56,46 62,92Z", "M68,92 Q73,54 78,92Z", "M84,92 Q90,44 96,92Z",
  "M102,92 Q107,54 112,92Z", "M118,92 Q124,46 130,92Z", "M136,92 Q142,52 147,92Z",
  "M153,92 Q158,44 164,92Z", "M170,92 Q176,54 181,92Z", "M187,92 Q193,46 199,92Z",
  "M205,92 Q210,54 215,92Z", "M221,92 Q227,44 233,92Z", "M239,92 Q244,54 249,92Z",
  "M255,92 Q261,46 267,92Z", "M273,92 Q278,54 283,92Z", "M289,92 Q295,44 301,92Z",
  "M307,92 Q312,54 317,92Z", "M323,92 Q329,46 335,92Z", "M341,92 Q346,52 351,92Z",
  "M357,92 Q363,44 369,92Z", "M375,92 Q380,54 385,92Z", "M391,92 Q397,46 403,92Z",
  "M409,92 Q414,54 419,92Z", "M425,92 Q431,44 437,92Z", "M443,92 Q448,54 453,92Z",
  "M459,92 Q465,46 471,92Z", "M477,92 Q482,52 487,92Z", "M493,92 Q499,44 505,92Z",
  "M511,92 Q516,54 521,92Z", "M527,92 Q533,46 539,92Z", "M545,92 Q550,54 555,92Z",
  "M561,92 Q567,44 573,92Z", "M579,92 Q584,54 589,92Z", "M595,92 Q601,46 607,92Z",
  "M613,92 Q618,52 623,92Z", "M629,92 Q635,44 641,92Z", "M647,92 Q652,54 657,92Z",
  "M663,92 Q669,46 675,92Z", "M681,92 Q686,54 691,92Z", "M697,92 Q703,44 709,92Z",
  "M715,92 Q720,54 725,92Z", "M731,92 Q737,46 743,92Z", "M749,92 Q754,52 759,92Z",
  "M765,92 Q771,44 777,92Z", "M783,92 Q788,54 793,92Z", "M799,92 Q805,46 811,92Z",
  "M817,92 Q822,54 827,92Z", "M833,92 Q839,44 845,92Z", "M851,92 Q856,54 861,92Z",
  "M867,92 Q873,46 879,92Z", "M885,92 Q890,52 895,92Z", "M901,92 Q907,44 913,92Z",
  "M919,92 Q924,54 929,92Z", "M935,92 Q941,46 947,92Z", "M953,92 Q958,54 963,92Z",
  "M969,92 Q975,44 981,92Z", "M987,92 Q992,54 997,92Z", "M1003,92 Q1009,46 1015,92Z",
  "M1021,92 Q1026,52 1031,92Z", "M1037,92 Q1043,44 1049,92Z", "M1055,92 Q1060,54 1065,92Z",
  "M1071,92 Q1077,46 1083,92Z", "M1089,92 Q1094,54 1099,92Z", "M1105,92 Q1111,44 1117,92Z",
  "M1123,92 Q1128,54 1133,92Z", "M1139,92 Q1145,46 1151,92Z", "M1157,92 Q1162,52 1167,92Z",
  "M1173,92 Q1179,44 1185,92Z", "M1191,92 Q1196,54 1201,92Z", "M1207,92 Q1213,46 1219,92Z",
  "M1225,92 Q1230,54 1235,92Z", "M1241,92 Q1247,44 1253,92Z", "M1259,92 Q1264,52 1269,92Z",
  "M1275,92 Q1281,44 1287,92Z", "M1293,92 Q1298,54 1303,92Z", "M1309,92 Q1315,46 1321,92Z",
  "M1327,92 Q1332,54 1337,92Z", "M1343,92 Q1349,44 1355,92Z", "M1361,92 Q1366,52 1371,92Z",
  "M1377,92 Q1383,44 1389,92Z", "M1395,92 Q1400,54 1405,92Z", "M1411,92 Q1417,46 1423,92Z",
  "M1429,92 Q1434,52 1440,92Z"
];
const GRASS_LIGHT = [
  "M8,92 Q15,38 22,92Z", "M58,92 Q65,36 72,92Z", "M108,92 Q115,40 122,92Z",
  "M158,92 Q165,36 172,92Z", "M208,92 Q215,40 222,92Z", "M258,92 Q265,36 272,92Z",
  "M308,92 Q315,40 322,92Z", "M358,92 Q365,36 372,92Z", "M408,92 Q415,40 422,92Z",
  "M458,92 Q465,36 472,92Z", "M508,92 Q515,40 522,92Z", "M558,92 Q565,36 572,92Z",
  "M608,92 Q615,40 622,92Z", "M658,92 Q665,36 672,92Z", "M708,92 Q715,40 722,92Z",
  "M758,92 Q765,36 772,92Z", "M808,92 Q815,40 822,92Z", "M858,92 Q865,36 872,92Z",
  "M908,92 Q915,40 922,92Z", "M958,92 Q965,36 972,92Z", "M1008,92 Q1015,40 1022,92Z",
  "M1058,92 Q1065,36 1072,92Z", "M1108,92 Q1115,40 1122,92Z", "M1158,92 Q1165,36 1172,92Z",
  "M1208,92 Q1215,40 1222,92Z", "M1258,92 Q1265,36 1272,92Z", "M1308,92 Q1315,40 1322,92Z",
  "M1358,92 Q1365,36 1372,92Z", "M1408,92 Q1415,36 1422,92Z"
];

const LEAF_PARTICLES = Array.from({ length: 40 }, (_, index) => {
  const size = 10 + Math.random() * 12;
  const duration = 9 + Math.random() * 8;
  const delay = Math.random() * 12;
  const drift = 26 + Math.random() * 120;
  const tilt = -120 + Math.random() * 240;

  return {
    id: `leaf-${index}`,
    left: Math.random() * 100,
    size,
    duration,
    delay,
    drift,
    tilt,
    hue: 70 + Math.random() * 35,
  };
});

const PACKAGES = [
  {
    id: '3year',
    name: '3 Year Legacy',
    duration: '3 Years',
    price: 149,
    priceLabel: '$149',
    color: '#5aaa38',
    accent: '#2a5220',
    bg: 'linear-gradient(135deg,#e8f8e0,#c0eaa0)',
    icon: '🌳',
    features: ['Written Messages', 'Audio & Video Memories', 'Virtual Flower Tributes', 'Memory Vault', 'Priority Delivery'],
    description: 'A lasting tribute for three years of remembrance',
    popular: true,
  },
  {
    id: '1year',
    name: '1 Year Memory',
    duration: '1 Year',
    price: 59,
    priceLabel: '$59',
    color: '#1890c0',
    accent: '#0a5080',
    bg: 'linear-gradient(135deg,#e0f4ff,#a8daf8)',
    icon: '🌸',
    features: ['Written Messages', 'Audio & Video Memories', 'Virtual Flower Tributes', 'Basic Memory Vault'],
    description: 'A year of heartfelt connection and care',
  },
  {
    id: 'custom',
    name: 'Custom Plan',
    duration: 'Your Choice',
    price: 0,
    priceLabel: 'From $19',
    color: '#c07820',
    accent: '#7a4e10',
    bg: 'linear-gradient(135deg,#fef4e0,#fad890)',
    icon: '✨',
    features: ['Choose what you need', 'Flexible duration', 'Mix & match features'],
    description: 'Build exactly the plan that feels right for you',
  },
];

// Legacy gift categories removed - Now handled by simplified UI selection

const SAVED_STORAGE_KEY = 'still-with-you-saved-data';
const OCCASION_OPTIONS = [
  'Birthday',
  'Anniversary',
  'Remembrance Day',
  'Festival',
  'Specific Date',
];

const HERO_TYPEWRITER_LINES = [
  'Store your memories.',
  'Say it now, keep it forever.',
  'Every memory helps your tree grow.',
  'Write, record, and gift with love.',
];

const STAGE_ENCOURAGEMENT_LINES = [
  [
    'Add your first memory to begin this tree.',
    'Start now. Share one memory and plant the first root.',
  ],
  [
    'Your seed is planted. Add another memory to help it sprout.',
    'Keep it growing. Add one more memory now.',
  ],
  [
    'Your tree is sprouting. Add a new memory to strengthen it.',
    'Share another memory and let the roots grow deeper.',
  ],
  [
    'Your branches are growing. Add more memories today.',
    'Help this tree expand. Add another meaningful memory.',
  ],
  [
    'Your tree is blooming. Add memories to keep it alive.',
    'Keep the bloom alive. Add another memory now.',
  ],
  [
    'Your tree stands tall. Continue adding memories for loved ones.',
    'Do not stop here. Add another memory to keep it growing.',
  ],
  [
    'Your tree is full of life. Keep adding memories that never fade.',
    'Your legacy is growing. Add a fresh memory today.',
  ],
];

const createEmptySavedData = () => ({
  messages: [],
  media: [],
  gifts: [],
});

const readSavedData = () => {
  if (typeof window === 'undefined') return createEmptySavedData();

  try {
    const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!raw) return createEmptySavedData();

    const parsed = JSON.parse(raw);
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      media: Array.isArray(parsed.media) ? parsed.media : [],
      gifts: Array.isArray(parsed.gifts) ? parsed.gifts : [],
    };
  } catch {
    return createEmptySavedData();
  }
};

export default function App({ initialPage = 'home' }) {
  const { currentUser, updateProfile, addMemory, addSurprise, memories, surprises, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loggedIn = Boolean(currentUser);
  const [plantStage, setPlantStage] = useState(0);

  // Derive counts from real backend data
  const messageCount = memories.filter(m => m.type === 'message').length;
  const mediaCount = memories.filter(m => m.type === 'media').length;
  const giftCount = surprises.length;

  useEffect(() => {
    if (loggedIn) {
      // Tree grows with both memories and surprises
      const totalItems = memories.length + surprises.length;
      const stage = Math.min(totalItems + 1, 6);
      setPlantStage(stage);
    } else {
      setPlantStage(0);
    }
  }, [loggedIn, memories.length, surprises.length]);

  useEffect(() => {
    // Pre-load face models in background for speed
    loadModels().catch(err => console.error('Background model load failed:', err));
  }, []);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [userName, setUserName] = useState('You');
  const [heroHidden, setHeroHidden] = useState(false);
  const [handShow, setHandShow] = useState(false);
  const [seedShow, setSeedShow] = useState(false);
  const [rippleSplash, setRippleSplash] = useState(false);
  const [waterShake, setWaterShake] = useState(false);
  const [droplets, setDroplets] = useState([]);
  const [currentPage, setCurrentPage] = useState(() => {
    if (location.pathname === '/user-dashboard') return 'my-dashboard';
    return initialPage;
  });

  useEffect(() => {
    if (location.pathname === '/user-dashboard') {
      setCurrentPage('my-dashboard');
    } else if (location.pathname === '/' && currentPage === 'my-dashboard') {
      setCurrentPage('home');
    }
  }, [location.pathname]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [heartboxPrompt, setHeartboxPrompt] = useState('');
  const [heroLineIndex, setHeroLineIndex] = useState(0);
  const [heroTypedText, setHeroTypedText] = useState('');
  const [heroDeleting, setHeroDeleting] = useState(false);
  const [stageMessageIndex, setStageMessageIndex] = useState(0);
  const [messageOccasion, setMessageOccasion] = useState('Specific Date');
  const [messageDate, setMessageDate] = useState('');
  const [writeMessage, setWriteMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaOccasion, setMediaOccasion] = useState('Specific Date');
  const [mediaDate, setMediaDate] = useState('');
  const [giftItems, setGiftItems] = useState([]);
  const [legacyCategory, setLegacyCategory] = useState(null);
  const [selectedGiftCategory, setSelectedGiftCategory] = useState(null);
  const [giftOccasion, setGiftOccasion] = useState('Specific Date');
  const [giftDate, setGiftDate] = useState('');
  const [giftNote, setGiftNote] = useState('');
  const [savedData, setSavedData] = useState(() => readSavedData());
  const [receiptName, setReceiptName] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [receiptPhone, setReceiptPhone] = useState('');
  const [closePersonNumber, setClosePersonNumber] = useState('');
  const [giftAddress, setGiftAddress] = useState('');
  // ── Package & Payment flow ──
  const [pendingPackage, setPendingPackage] = useState(null);
  const [paymentCardNumber, setPaymentCardNumber] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [paymentName, setPaymentName] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  // ── Custom plan configurator ──
  const [customFeatures, setCustomFeatures] = useState({ messages: true, media: false, gifts: false });
  const [customDuration, setCustomDuration] = useState(6);
  // ── Responsive navigation state ──
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const canvasRef = useRef(null);
  const nameRef = useRef(null);
  const passRef = useRef(null);
  const stageRef = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => { stageRef.current = plantStage; }, [plantStage]);
  useEffect(() => {
    // Draw/redraw tree when on home page with a stage, or when stage changes
    if (plantStage > 0 && currentPage === 'home' && canvasRef.current) {
      requestAnimationFrame(() => {
        animateGrow(canvasRef.current, plantStage);
      });
    }
  }, [plantStage, currentPage]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedData));
  }, [savedData]);
  useEffect(() => {
    const currentLine = HERO_TYPEWRITER_LINES[heroLineIndex];
    let delay = heroDeleting ? 42 : 75;

    if (!heroDeleting && heroTypedText === currentLine) delay = 1400;
    if (heroDeleting && heroTypedText.length === 0) delay = 220;

    const timer = setTimeout(() => {
      if (!heroDeleting) {
        if (heroTypedText === currentLine) {
          setHeroDeleting(true);
        } else {
          setHeroTypedText(currentLine.slice(0, heroTypedText.length + 1));
        }
        return;
      }

      if (heroTypedText.length === 0) {
        setHeroDeleting(false);
        setHeroLineIndex(index => (index + 1) % HERO_TYPEWRITER_LINES.length);
      } else {
        setHeroTypedText(currentLine.slice(0, heroTypedText.length - 1));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [heroTypedText, heroDeleting, heroLineIndex]);
  useEffect(() => {
    setStageMessageIndex(0);
  }, [plantStage]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setStageMessageIndex(index => index + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [stageMessageIndex, plantStage]);

  const spawnDroplets = useCallback((many = false) => {
    const n = many ? 22 : 14;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.4;
    const newDrops = Array.from({ length: n }, (_, i) => {
      const angle = (Math.random() * 220) - 110;
      const dist = 55 + Math.random() * 150;
      return {
        id: Date.now() + i,
        left: cx + dist * Math.sin(angle * Math.PI / 180),
        top: cy + dist * Math.cos(angle * Math.PI / 180) * 0.22,
        delay: Math.random() * 0.38,
      };
    });
    setDroplets(prev => [...prev, ...newDrops]);
    setTimeout(() => {
      setDroplets(prev => prev.filter(d => !newDrops.find(n => n.id === d.id)));
    }, 1400);
  }, []);

  const openModal = () => { setOverlayOpen(true); setMobileNavOpen(false); };
  const closeModal = () => setOverlayOpen(false);
  const navTo = (page) => {
    setCurrentPage(page);
    setMobileNavOpen(false);
    if (page === 'home' && location.pathname !== '/') {
      navigate('/');
    } else if (page === 'my-dashboard' && location.pathname !== '/user-dashboard') {
      navigate('/user-dashboard');
    }
  };
  const hasSelectedPackage = Boolean(selectedPackage);

  const navigateWithPackageGate = (page) => {
    if (!hasSelectedPackage) return;
    if (page === 'content-gifts') {
      setSelectedGiftCategory(null);
      setGiftItems([]);
    }
    setHeartboxPrompt('');
    navTo(page);
  };

  const showSavedAndGoHome = (notice, resetFn = null) => {
    // Clear all form data first
    if (resetFn) resetFn();

    // Update UI states
    setSaveNotice(notice);
    setHeartboxPrompt('Add another memory');

    // Navigate to home immediately - tree animation will trigger via useEffect
    navTo('home');

    // Clear notice after 2.6 seconds
    setTimeout(() => setSaveNotice(''), 2600);
  };

  const validateReceiptAndOccasion = ({ occasion, date, needsAddress = false }) => {
    if (!receiptName.trim() || !receiptEmail.trim() || !receiptPhone.trim() || !closePersonNumber.trim()) {
      setSaveNotice('Please complete recipient details before saving.');
      setTimeout(() => setSaveNotice(''), 2600);
      return false;
    }

    if (!occasion || !date) {
      setSaveNotice('Please select an occasion and date before saving.');
      setTimeout(() => setSaveNotice(''), 2600);
      return false;
    }

    if (needsAddress && !giftAddress.trim()) {
      setSaveNotice('Please enter address for gift delivery.');
      setTimeout(() => setSaveNotice(''), 2600);
      return false;
    }

    return true;
  };

  const saveMessage = async () => {
    if (!validateReceiptAndOccasion({ occasion: messageOccasion, date: messageDate })) return;

    const entry = {
      type: 'message',
      title: `Message for ${receiptName}`,
      content: writeMessage.trim(),
      occasion: messageOccasion,
      date: messageDate,
      recipient: {
        name: receiptName,
        email: receiptEmail,
        phone: receiptPhone,
        closePersonNumber,
      }
    };

    const res = await addMemory(entry);
    if (!res.success) {
      setSaveNotice(res.message || 'Failed to save message to cloud.');
      setTimeout(() => setSaveNotice(''), 3000);
      return;
    }

    // Navigation and notice are handled here
    showSavedAndGoHome('Message saved to your legacy vault.', () => {
      setWriteMessage('');
      setMessageOccasion('Specific Date');
      setMessageDate('');
      setReceiptName('');
      setReceiptEmail('');
      setReceiptPhone('');
      setClosePersonNumber('');
    });
  };

  const saveMedia = async () => {
    if (!validateReceiptAndOccasion({ occasion: mediaOccasion, date: mediaDate })) return;

    const entry = {
      type: 'media',
      title: `Media Vault: ${mediaFiles.length} files`,
      content: `Uploaded files: ${mediaFiles.map(f => f.name).join(', ')}`,
      occasion: mediaOccasion,
      date: mediaDate,
      recipient: {
        name: receiptName,
        email: receiptEmail,
        phone: receiptPhone,
        closePersonNumber,
      }
    };

    const res = await addMemory(entry);
    if (!res.success) {
      setSaveNotice(res.message || 'Failed to save media entry to cloud.');
      setTimeout(() => setSaveNotice(''), 3000);
      return;
    }

    // Navigation and notice are handled here
    showSavedAndGoHome('Media cataloged in your legacy vault.', () => {
      setMediaFiles([]);
      setMediaOccasion('Specific Date');
      setMediaDate('');
      setReceiptName('');
      setReceiptEmail('');
      setReceiptPhone('');
      setClosePersonNumber('');
    });
  };

  const saveGiftBooking = async () => {
    if (!legacyCategory) {
      setSaveNotice('Please select a gift type.');
      setTimeout(() => setSaveNotice(''), 2600);
      return;
    }
    if (!validateReceiptAndOccasion({ occasion: giftOccasion, date: giftDate, needsAddress: true })) return;

    // Friendly names for the admin dashboard
    const categoryNames = { 'flowers': 'Premium Flower Bouquet', 'chocolate': 'Handcrafted Chocolates', 'cakes': 'Celebration Cake' };

    const selectedItem = giftItems[0];
    if (!selectedItem) {
      setSaveNotice(`Please select a specific ${legacyCategory} item.`);
      setTimeout(() => setSaveNotice(''), 2600);
      return;
    }

    const giftData = {
      giftType: `${selectedItem.emoji} ${selectedItem.name}`,
      category: legacyCategory,
      recipientName: receiptName,
      scheduledDate: giftDate,
      status: 'upcoming',
      deliveryAddress: giftAddress,
      deliveryLocation: {
        type: 'Point',
        coordinates: [76.9667 + (Math.random() - 0.5) * 0.05, 11.0168 + (Math.random() - 0.5) * 0.05]
      }
    };

    const result = await addSurprise(giftData);

    if (result.success) {
      showSavedAndGoHome(`Surprise scheduled at nearby shops!`, () => {
        setGiftItems([]); setGiftDate(''); setGiftAddress('');
        setReceiptName(''); setReceiptEmail(''); setReceiptPhone(''); setClosePersonNumber('');
        setSelectedGiftCategory(null);
        setLegacyCategory(null);
        setGiftNote('');
      });
    } else {
      setSaveNotice(result.message || 'Error scheduling surprise.');
    }
  };

  const finishLogin = (user) => {
    closeModal();
    const name = user?.name || user?.ownerName || pendingName || 'Friend';
    setUserName(name);
    setHeroHidden(false);

    // Use both the immediate user object and the loaded memories to decide
    const isNewUser = !user?.selectedPackage && memories.length === 0;

    if (isNewUser) {
      setHandShow(true);
      setSeedShow(true);
      setTimeout(() => {
        setHandShow(false);
        setSeedShow(false);
        navTo('heartbox');
      }, 2500);
    } else {
      navTo('home');
    }
  };

  const handleNewLoginSuccess = (user) => {
    if (user.role === 'admin' || user.role === 'shop') {
      // Dashboards are handled by ternary based on currentUser role
    } else {
      finishLogin(user);
    }
  };



  const waterPlant = () => {
    if (!loggedIn) { openModal(); return; }
    setHeartboxPrompt('Add another memory');
    navTo('heartbox');
  };

  const flowers = [
    { id: 'rose', emoji: '🌹', name: 'Red Rose Bouquet', meaning: 'Eternal love & deep respect' },
    { id: 'lily', emoji: '🌸', name: 'Peace Lilies', meaning: 'Purity, peace & sympathy' },
    { id: 'sunflower', emoji: '🌻', name: 'Bright Sunflowers', meaning: 'Warmth, light & longevity' },
    { id: 'tulip', emoji: '🌷', name: 'Spring Tulips', meaning: 'Perfect love & rebirth' },
    { id: 'lotus', emoji: '🪷', name: 'Sacred Lotus', meaning: 'Spiritual growth & strength' },
    { id: 'daisy', emoji: '🌼', name: 'Simple Daisies', meaning: 'Innocence & loyal love' },
  ];
  const chocolates = [
    { id: 'truffle', emoji: '🍬', name: 'Dark Truffles', meaning: 'Rich, intense & sophisticated' },
    { id: 'milk_box', emoji: '🍫', name: 'Milk Chocolate Box', meaning: 'Classic, sweet & comforting' },
    { id: 'caramel', emoji: '🍯', name: 'Salted Caramels', meaning: 'The perfect balance of life' },
    { id: 'assorted', emoji: '🎁', name: 'Luxury Assortment', meaning: 'A variety of sweet memories' },
  ];
  const cakes = [
    { id: 'velvet', emoji: '🍰', name: 'Red Velvet', meaning: 'Elegant, smooth & celebratory' },
    { id: 'choco_fudge', emoji: '🎂', name: 'Triple Choco Fudge', meaning: 'Decadent, rich & joyful' },
    { id: 'fruit_tart', emoji: '🥧', name: 'Fresh Fruit Tart', meaning: 'Light, vibrant & refreshing' },
    { id: 'vanilla', emoji: '🧁', name: 'Vanilla Bean', meaning: 'Pure, classic & timeless' },
  ];
  const toggleGiftItem = (item) => setGiftItems(prev =>
    prev.find(x => x.id === item.id) ? prev.filter(x => x.id !== item.id) : [...prev, item]
  );
  const activeGiftCategory = null;
  const stageMessages = STAGE_ENCOURAGEMENT_LINES[Math.min(plantStage, STAGE_ENCOURAGEMENT_LINES.length - 1)];
  const stageEncouragement = stageMessages[stageMessageIndex % stageMessages.length];
  const leafCount = loggedIn ? Math.min(8 + plantStage * 5, LEAF_PARTICLES.length) : 0;

  const renderReceiptSection = (showAddress = false) => (
    <div className="receipt-card">
      <h4 className="section-title">Recipient Details</h4>
      <p className="receipt-hint">Enter your contact details so we can track this saved item properly.</p>
      <div className="receipt-grid">
        <div>
          <label className="field-label">Name</label>
          <input className="field-input" type="text" value={receiptName} onChange={e => setReceiptName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-input" type="email" value={receiptEmail} onChange={e => setReceiptEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
          <label className="field-label">Phone number</label>
          <input className="field-input" type="tel" value={receiptPhone} onChange={e => setReceiptPhone(e.target.value)} placeholder="Phone number" />
        </div>
        <div>
          <label className="field-label">Close person number</label>
          <input className="field-input" type="tel" value={closePersonNumber} onChange={e => setClosePersonNumber(e.target.value)} placeholder="Close person number" />
        </div>
        {showAddress && (
          <div className="receipt-full">
            <label className="field-label">Address</label>
            <textarea className="field-textarea" rows={3} value={giftAddress} onChange={e => setGiftAddress(e.target.value)} placeholder="Full delivery address" />
          </div>
        )}
      </div>
    </div>
  );

  const renderOccasionSection = (occasion, setOccasion, date, setDate) => (
    <div className="receipt-card occasion-card">
      <h4 className="section-title">Occasion & Date</h4>
      <p className="receipt-hint">Choose the occasion and set the date. You can always pick Specific Date.</p>
      <div className="receipt-grid">
        <div>
          <label className="field-label">Occasion</label>
          <select className="field-input" value={occasion} onChange={e => setOccasion(e.target.value)}>
            {OCCASION_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Date</label>
          <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
    </div>
  );

  const handleLogout = () => {
    logout();

    // ─── Reset Core App State ───
    setPlantStage(0);
    setUserName('You');
    setSelectedPackage(null);
    setCurrentPage('home');
    setOverlayOpen(false);
    setModalMode('login');
    setHeartboxPrompt('');
    setSaveNotice('');

    // ─── Reset Content Creation States ───
    setWriteMessage('');
    setMessageOccasion('Specific Date');
    setMessageDate('');

    setMediaFiles([]);
    setMediaOccasion('Specific Date');
    setMediaDate('');

    setGiftItems([]);
    setSelectedGiftCategory(null);
    setGiftOccasion('Specific Date');
    setGiftDate('');
    setGiftNote('');

    setReceiptName('');
    setReceiptEmail('');
    setReceiptPhone('');
    setClosePersonNumber('');
    setGiftAddress('');

    // ─── Reset Payment & Package Pipeline ───
    setPendingPackage(null);
    setPaymentCardNumber('');
    setPaymentExpiry('');
    setPaymentCvv('');
    setPaymentName('');
    setPaymentProcessing(false);
    setPaymentSuccess(false);

    setCustomFeatures({ messages: true, media: false, gifts: false });
    setCustomDuration(6);

    // ─── Clear Persistent Local Data ───
    localStorage.removeItem(SAVED_STORAGE_KEY);
    setSavedData(createEmptySavedData());

    // ─── Clear Tree Canvas (Visual Reset) ───
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const getCustomPrice = () => {
    let base = 0;
    if (customFeatures.messages) base += 19;
    if (customFeatures.media) base += 29;
    if (customFeatures.gifts) base += 19;
    // Duration multiplier
    if (customDuration === 12) base = Math.round(base * 1.6);
    else if (customDuration === 24) base = Math.round(base * 2.8);
    else if (customDuration === 36) base = Math.round(base * 3.8);
    return Math.max(base, 0);
  };

  const handleSelectPackage = (pkg) => {
    if (pkg.id === 'custom') {
      navTo('custom-plan');
    } else {
      setPendingPackage(pkg);
      setPaymentCardNumber('');
      setPaymentExpiry('');
      setPaymentCvv('');
      setPaymentName('');
      setPaymentProcessing(false);
      setPaymentSuccess(false);
      navTo('payment');
    }
  };

  const handleCustomPlanCheckout = () => {
    const price = getCustomPrice();
    if (price === 0) {
      setSaveNotice('Please select at least one feature for your custom plan.');
      setTimeout(() => setSaveNotice(''), 2600);
      return;
    }
    const featureList = [];
    if (customFeatures.messages) featureList.push('Written Messages');
    if (customFeatures.media) featureList.push('Audio & Video Memories');
    if (customFeatures.gifts) featureList.push('Virtual Flower Tributes');
    const pkg = {
      id: 'custom',
      name: 'Custom Plan',
      duration: `${customDuration} Months`,
      price,
      priceLabel: `$${price}`,
      color: '#c07820',
      accent: '#7a4e10',
      bg: 'linear-gradient(135deg,#fef4e0,#fad890)',
      icon: '✨',
      features: featureList,
      description: 'Your personalized plan',
    };
    setPendingPackage(pkg);
    setPaymentCardNumber('');
    setPaymentExpiry('');
    setPaymentCvv('');
    setPaymentName('');
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    navTo('payment');
  };

  const processPayment = () => {
    if (!paymentCardNumber.trim() || !paymentExpiry.trim() || !paymentCvv.trim() || !paymentName.trim()) {
      setSaveNotice('Please fill in all payment fields.');
      setTimeout(() => setSaveNotice(''), 2600);
      return;
    }
    setPaymentProcessing(true);
    setTimeout(async () => {
      // Persist to backend if logged in
      if (loggedIn) {
        await updateProfile({ selectedPackage: pendingPackage.id });
      }

      setPaymentProcessing(false);
      setPaymentSuccess(true);
      setSelectedPackage(pendingPackage);
    }, 2200);
  };

  // Sync selectedPackage when user loads or updates
  useEffect(() => {
    if (currentUser && currentUser.selectedPackage) {
      const pkg = PACKAGES.find(p => p.id === currentUser.selectedPackage);
      if (pkg) setSelectedPackage(pkg);
    } else {
      setSelectedPackage(null);
    }
  }, [currentUser]);

  const renderNavigation = (extraClass = '') => (
    <>
      <nav className={`main-nav-bar ${extraClass}`}>
        <div className="nav-container">
          <div className="logo" onClick={() => navTo('home')}>
            <span className="logo-leaf">🍃</span>
            <span className="logo-text">Still <em>With You</em></span>
          </div>

          <ul className="nav-links">
            <li className={currentPage === 'home' ? 'active' : ''}>
              <a onClick={() => navTo('home')}>
                <span>Home</span>
              </a>
            </li>
            <li className={currentPage === 'heartbox' ? 'active' : ''}>
              <a onClick={() => loggedIn ? navTo('heartbox') : openModal('login')}>
                <span>HeartBox</span>
              </a>
            </li>
            {loggedIn && (
              <li className={currentPage === 'my-dashboard' ? 'active' : ''}>
                <a onClick={() => navTo('my-dashboard')}>
                  <span>My Dashboard</span>
                </a>
              </li>
            )}
            <li className={currentPage === 'about' ? 'active' : ''}>
              <a onClick={() => navTo('about')}>
                <span>About</span>
              </a>
            </li>
          </ul>

          <div className="nav-actions">
            {!loggedIn ? (
              <div className="nav-auth">
                <button className="btn-login" onClick={() => openModal('login')}>Log In</button>
                <button className="btn-signin" onClick={() => openModal('signup')}>Get Started</button>
              </div>
            ) : (
              <div className="nav-user-area">
                <div className="user-badge" onClick={() => navTo('my-dashboard')} title="View Dashboard" style={{ cursor: 'pointer' }}>
                  <div className="live-dot" />
                  <span className="user-badge-name">{userName}</span>
                </div>
                <button className="btn-logout" onClick={handleLogout} title="Log out">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="btn-logout-text">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className={`nav-hamburger ${mobileNavOpen ? 'is-active' : ''}`}
              onClick={() => setMobileNavOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
            >
              <span className="hamburger-line line-1" />
              <span className="hamburger-line line-2" />
              <span className="hamburger-line line-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-nav-backdrop ${mobileNavOpen ? 'show' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Mobile Drawer Menu */}
      <div className={`mobile-nav-drawer ${mobileNavOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <div className="logo" onClick={() => navTo('home')}>
            <span className="logo-leaf">🍃</span>
            <span className="logo-text">Still <em>With You</em></span>
          </div>
          <button
            className="mobile-drawer-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {loggedIn && (
          <div className="mobile-user-card" onClick={() => navTo('my-dashboard')}>
            <div className="live-dot" />
            <div className="mobile-user-info">
              <span className="mobile-user-greeting">Signed in as</span>
              <strong className="mobile-user-name">{userName}</strong>
            </div>
            <span className="mobile-user-chevron">›</span>
          </div>
        )}

        <ul className="mobile-nav-links">
          <li className={currentPage === 'home' ? 'active' : ''}>
            <a onClick={() => navTo('home')}>
              <span className="mobile-nav-icon">🏡</span>
              <span className="mobile-nav-text">Home</span>
              <span className="mobile-nav-arrow">→</span>
            </a>
          </li>
          <li className={currentPage === 'heartbox' ? 'active' : ''}>
            <a onClick={() => loggedIn ? navTo('heartbox') : openModal('login')}>
              <span className="mobile-nav-icon">💚</span>
              <span className="mobile-nav-text">HeartBox</span>
              <span className="mobile-nav-arrow">→</span>
            </a>
          </li>
          {loggedIn && (
            <li className={currentPage === 'my-dashboard' ? 'active' : ''}>
              <a onClick={() => navTo('my-dashboard')}>
                <span className="mobile-nav-icon">👤</span>
                <span className="mobile-nav-text">My Dashboard</span>
                <span className="mobile-nav-arrow">→</span>
              </a>
            </li>
          )}
          <li className={currentPage === 'about' ? 'active' : ''}>
            <a onClick={() => navTo('about')}>
              <span className="mobile-nav-icon">✨</span>
              <span className="mobile-nav-text">About & Vision</span>
              <span className="mobile-nav-arrow">→</span>
            </a>
          </li>
        </ul>

        <div className="mobile-drawer-footer">
          {!loggedIn ? (
            <div className="mobile-auth-buttons">
              <button className="btn-signin w-full" onClick={() => openModal('signup')}>
                Get Started Free
              </button>
              <button className="btn-login w-full" onClick={() => openModal('login')}>
                Log In
              </button>
            </div>
          ) : (
            <button className="btn-logout-mobile" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {currentUser?.role === 'admin' ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : currentUser?.role === 'shop' ? (
        <ShopDashboard onLogout={handleLogout} />
      ) : (
        <div className="app-main-wrapper">
          {loggedIn && (
            <div className="leaf-fall-layer" aria-hidden="true">
              {LEAF_PARTICLES.slice(0, leafCount).map(leaf => (
                <span
                  key={leaf.id}
                  className="leaf-fall"
                  style={{
                    '--leaf-left': `${leaf.left}%`,
                    '--leaf-size': `${leaf.size}px`,
                    '--leaf-duration': `${leaf.duration}s`,
                    '--leaf-delay': `-${leaf.delay}s`,
                    '--leaf-drift': `${leaf.drift}px`,
                    '--leaf-tilt': `${leaf.tilt}deg`,
                    '--leaf-hue': `${leaf.hue}`,
                  }}
                />
              ))}
            </div>
          )}

          {renderNavigation()}

          {currentPage === 'heartbox' && (
            <div className="page-overlay heartbox-overlay">
              {renderNavigation('heartbox-nav')}
              {/* Animated floating particles */}
              <div className="hb-floating-particles" aria-hidden="true">
                {Array.from({ length: 18 }, (_, i) => (
                  <span key={`particle-${i}`} className="hb-particle" style={{
                    '--p-left': `${5 + Math.random() * 90}%`,
                    '--p-size': `${4 + Math.random() * 8}px`,
                    '--p-dur': `${8 + Math.random() * 12}s`,
                    '--p-delay': `${-Math.random() * 10}s`,
                    '--p-hue': `${100 + Math.random() * 60}`,
                  }} />
                ))}
              </div>
              <div className="hb-side-hearts hb-side-hearts-left" aria-hidden="true">
                {['❤', '♡', '♥', '❥', '❣', '💕'].map((heart, i) => (
                  <span key={`left-${i}`} className="hb-heart" style={{ '--heart-index': i + 1 }}>{heart}</span>
                ))}
              </div>
              <div className="hb-side-hearts hb-side-hearts-right" aria-hidden="true">
                {['♥', '💕', '❥', '❣', '❤', '♡'].map((heart, i) => (
                  <span key={`right-${i}`} className="hb-heart" style={{ '--heart-index': i + 1 }}>{heart}</span>
                ))}
              </div>
              <div className="heartbox-shell">
                {/* Enhanced Hero Section */}
                <div className="hb-hero-section">
                  <div className="hb-hero-glow" />
                  <div className="hb-hero-content">
                    <div className="hb-hero-avatar">
                      <span>{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="hb-hero-text">
                      <h2 className="hb-hero-greeting">Welcome back, <em>{userName}</em> 💚</h2>
                      <p className="hb-hero-subtitle">Your HeartBox is where love lives on forever</p>
                    </div>
                  </div>
                  <div className="hb-hero-pkg-area">
                    {!selectedPackage ? (
                      <button className="package-cta-enhanced" onClick={() => navTo('packages')}>
                        <span className="pkg-cta-sparkle">✦</span>
                        <span>Choose Your Plan</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                      </button>
                    ) : (
                      <div className="active-package-badge-enhanced" onClick={() => navTo('packages')}>
                        <span className="apb-icon">{selectedPackage.icon}</span>
                        <div className="apb-info">
                          <span className="apb-name">{selectedPackage.name}</span>
                          <span className="apb-dur">{selectedPackage.duration}</span>
                        </div>
                        <span className="apb-change">Change →</span>
                      </div>
                    )}
                  </div>
                </div>

                {heartboxPrompt && (
                  <div className="page-prompt-banner hb-prompt-enhanced">
                    <span className="prompt-icon">🌱</span>
                    <div>
                      <strong>{heartboxPrompt}</strong>
                      <span>Add another memory when you are ready.</span>
                    </div>
                  </div>
                )}

                {/* Status strip */}
                <div className={`hb-status-strip${hasSelectedPackage ? ' ready' : ''}`}>
                  <span className="hb-status-icon">{hasSelectedPackage ? '🔓' : '🔒'}</span>
                  <div className="hb-status-text">
                    <span className="hb-status-title">{hasSelectedPackage ? 'All Features Unlocked' : 'Package Required'}</span>
                    <span className="hb-status-desc">{hasSelectedPackage ? 'Your HeartBox actions are ready to use.' : 'Select a plan to unlock writing, media uploads, and gifts.'}</span>
                  </div>
                  {!hasSelectedPackage && <button className="hb-status-action" onClick={() => navTo('packages')}>View Plans</button>}
                </div>

                {/* Action cards - NEW premium design */}
                <div className="hb-actions-grid">
                  {[
                    { label: 'Write Message', icon: '✉️', page: 'content-write', desc: 'Leave words that last forever', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                    { label: 'Audio, Video & Images', icon: '🎬', page: 'content-media', desc: 'Share your precious memories', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                    { label: 'Legacy Gifts', icon: '🌸', page: 'content-gifts', desc: 'Send flowers & virtual tributes', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
                  ].map(item => (
                    <button
                      key={item.page}
                      className={`hb-action-card${!hasSelectedPackage ? ' locked' : ''}`}
                      onClick={() => navigateWithPackageGate(item.page)}
                      disabled={!hasSelectedPackage}
                    >
                      <div className="hb-action-icon-wrap" style={{ background: hasSelectedPackage ? item.gradient : 'linear-gradient(135deg, #ccc, #aaa)' }}>
                        <span className="hb-action-icon">{item.icon}</span>
                      </div>
                      <div className="hb-action-info">
                        <div className="hb-action-label">{item.label}</div>
                        <div className="hb-action-desc">
                          {item.desc}
                          {!hasSelectedPackage ? ' 🔒' : ''}
                        </div>
                      </div>
                      <span className="hb-action-arrow">{hasSelectedPackage ? '→' : '🔒'}</span>
                    </button>
                  ))}
                </div>

                {/* Quick stats */}
                {hasSelectedPackage && (
                  <div className="hb-quick-stats">
                    <div className="hb-stat">
                      <span className="hb-stat-num">{messageCount}</span>
                      <span className="hb-stat-label">Messages</span>
                    </div>
                    <div className="hb-stat">
                      <span className="hb-stat-num">{mediaCount}</span>
                      <span className="hb-stat-label">Media</span>
                    </div>
                    <div className="hb-stat">
                      <span className="hb-stat-num">{giftCount}</span>
                      <span className="hb-stat-label">Gifts</span>
                    </div>
                    <div className="hb-stat">
                      <span className="hb-stat-num">{plantStage}</span>
                      <span className="hb-stat-label">Tree Stage</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'packages' && (
            <div className="page-overlay packages-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('heartbox')}>← Back</button>
                <h2 className="page-title">Choose Plan</h2>
                <div />
              </div>
              <div className="pkg-hero-banner">
                <h3>Find the perfect plan for your memories</h3>
                <p>Every plan includes secure storage and beautiful delivery of your heartfelt content.</p>
              </div>
              <div className="packages-grid">
                {PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`pkg-card-v2${selectedPackage?.id === pkg.id ? ' selected' : ''}${pkg.popular ? ' popular' : ''}`}
                    style={{ '--pkg-color': pkg.color, '--pkg-accent': pkg.accent }}
                  >
                    {pkg.popular && <div className="pkg-popular-tag">⭐ Most Popular</div>}
                    <div className="pkg-card-top" style={{ background: pkg.bg }}>
                      <div className="pkg-icon-v2">{pkg.icon}</div>
                      <div className="pkg-duration-v2" style={{ color: pkg.color }}>{pkg.duration}</div>
                      <h3 className="pkg-name-v2" style={{ color: pkg.accent }}>{pkg.name}</h3>
                    </div>
                    <div className="pkg-card-body">
                      <p className="pkg-desc-v2">{pkg.description}</p>
                      <ul className="pkg-features-v2">
                        {pkg.features.map(f => (
                          <li key={f}><span className="pkg-check-v2" style={{ color: pkg.color }}>✓</span>{f}</li>
                        ))}
                      </ul>
                      <div className="pkg-price-v2" style={{ color: pkg.color }}>{pkg.priceLabel}</div>
                      <button className="pkg-select-btn-v2" style={{ background: `linear-gradient(135deg, ${pkg.color}, ${pkg.accent})` }} onClick={() => handleSelectPackage(pkg)}>
                        {selectedPackage?.id === pkg.id ? '✓ Active Plan' : pkg.id === 'custom' ? 'Customize →' : 'Select & Pay →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentPage === 'custom-plan' && (
            <div className="page-overlay packages-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('packages')}>← Back</button>
                <h2 className="page-title">✨ Build Your Custom Plan</h2>
                <div />
              </div>
              <div className="content-page custom-plan-page">
                <div className="custom-plan-hero">
                  <h3>Choose exactly what you need</h3>
                  <p>Pick the features and duration that feel right for your remembrance journey.</p>
                </div>

                <div className="custom-features-grid">
                  {[
                    { key: 'messages', icon: '✉️', title: 'Written Messages', desc: 'Send heartfelt letters and notes', price: 19, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
                    { key: 'media', icon: '🎬', title: 'Audio, Video & Images', desc: 'Upload photos, videos, and voice notes', price: 29, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
                    { key: 'gifts', icon: '🌸', title: 'Virtual Flower Tributes', desc: 'Book and send flowers through trusted shops', price: 19, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
                  ].map(feat => (
                    <div
                      key={feat.key}
                      className={`custom-feature-card${customFeatures[feat.key] ? ' selected' : ''}`}
                      onClick={() => setCustomFeatures(prev => ({ ...prev, [feat.key]: !prev[feat.key] }))}
                    >
                      <div className="cf-icon-wrap" style={{ background: customFeatures[feat.key] ? feat.gradient : '#e0e5dd' }}>
                        <span>{feat.icon}</span>
                      </div>
                      <div className="cf-info">
                        <h4>{feat.title}</h4>
                        <p>{feat.desc}</p>
                        <span className="cf-price">+${feat.price}/period</span>
                      </div>
                      <div className={`cf-toggle${customFeatures[feat.key] ? ' on' : ''}`}>
                        <div className="cf-toggle-knob" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="custom-duration-section">
                  <h4>Plan Duration</h4>
                  <div className="custom-duration-pills">
                    {[
                      { months: 6, label: '6 Months' },
                      { months: 12, label: '1 Year' },
                      { months: 24, label: '2 Years' },
                      { months: 36, label: '3 Years' },
                    ].map(d => (
                      <button
                        key={d.months}
                        className={`dur-pill${customDuration === d.months ? ' active' : ''}`}
                        onClick={() => setCustomDuration(d.months)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="custom-summary-card">
                  <div className="cs-top">
                    <h4>Your Plan Summary</h4>
                    <div className="cs-price">${getCustomPrice()}</div>
                  </div>
                  <div className="cs-features">
                    {customFeatures.messages && <span className="cs-chip">✉️ Messages</span>}
                    {customFeatures.media && <span className="cs-chip">🎬 Media</span>}
                    {customFeatures.gifts && <span className="cs-chip">🌸 Gifts</span>}
                    {!customFeatures.messages && !customFeatures.media && !customFeatures.gifts && <span className="cs-empty">Select at least one feature</span>}
                  </div>
                  <span className="cs-duration">Duration: {customDuration} months</span>
                  <button className="pkg-select-btn-v2" style={{ background: 'linear-gradient(135deg, #c07820, #7a4e10)', marginTop: '1rem' }} onClick={handleCustomPlanCheckout}>
                    Proceed to Payment →
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'payment' && (
            <div className="page-overlay packages-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo(pendingPackage?.id === 'custom' ? 'custom-plan' : 'packages')}>← Back</button>
                <h2 className="page-title">💳 Secure Payment</h2>
                <div />
              </div>
              <div className="content-page payment-page">
                {paymentSuccess ? (
                  <div className="payment-success-card">
                    <div className="psc-check-anim">
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle className="psc-circle" cx="40" cy="40" r="36" fill="none" stroke="#5aaa38" strokeWidth="4" />
                        <polyline className="psc-check" points="23,40 35,52 57,30" fill="none" stroke="#5aaa38" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3>Payment Successful!</h3>
                    <p>Your {pendingPackage?.name} is now active. You have unlocked all features of Still With You.</p>
                    <button className="pkg-select-btn-v2" style={{ background: 'linear-gradient(135deg, #1890c0, #0a5080)', marginTop: '2rem', width: 'auto', padding: '1rem 2rem' }} onClick={() => navTo('heartbox')}>
                      Go to HeartBox →
                    </button>
                  </div>
                ) : (
                  <div className="payment-page-inner" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
                    <div className="payment-order-summary">
                      <div className="pos-icon" style={{ background: pendingPackage?.bg }}>{pendingPackage?.icon}</div>
                      <div className="pos-info">
                        <h3>{pendingPackage?.name}</h3>
                        <p>{pendingPackage?.duration || 'Lifetime Access'}</p>
                      </div>
                      <div className="pos-price">{pendingPackage?.priceLabel}</div>
                    </div>

                    <div className="payment-card-form">
                      <h4>Card Details</h4>
                      <div className="payment-disclaimer">🔒 Secure 256-bit SSL Encrypted Payment</div>

                      <div className="pcf-field">
                        <label>Cardholder Name</label>
                        <input type="text" placeholder="John Doe" value={paymentName} onChange={e => setPaymentName(e.target.value)} />
                      </div>

                      <div className="pcf-field">
                        <label>Card Number</label>
                        <input type="text" placeholder="•••• •••• •••• ••••" value={paymentCardNumber} onChange={e => setPaymentCardNumber(e.target.value)} />
                      </div>

                      <div className="pcf-row">
                        <div className="pcf-field">
                          <label>Expiry (MM/YY)</label>
                          <input type="text" placeholder="MM/YY" value={paymentExpiry} onChange={e => setPaymentExpiry(e.target.value)} />
                        </div>
                        <div className="pcf-field">
                          <label>CVV</label>
                          <input type="password" placeholder="•••" value={paymentCvv} onChange={e => setPaymentCvv(e.target.value)} />
                        </div>
                      </div>

                      <button
                        className={`payment-submit-btn${paymentProcessing ? ' processing' : ''}`}
                        onClick={processPayment}
                        disabled={paymentProcessing}
                      >
                        {paymentProcessing ? (
                          <>
                            <span className="spinner"></span>
                            Processing...
                          </>
                        ) : (
                          `Pay ${pendingPackage?.priceLabel} Now`
                        )}
                      </button>
                    </div>

                    <div className="payment-secure-badges">
                      <span>✓ Secure Payment</span>
                      <span>✓ Money Back Guarantee</span>
                      <span>✓ 24/7 Support</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === 'content-write' && (
            <div className="page-overlay content-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('heartbox')}>← Back</button>
                <h2 className="page-title">✉️ Write a Message</h2>
                <div />
              </div>
              <div className="content-page">
                <div className="content-hero content-hero-write">
                  <h3>Capture your thoughts beautifully</h3>
                  <p>Your words will be delivered at the right moment with warmth and intention.</p>
                </div>
                <div className="message-card">
                  {renderReceiptSection(false)}
                  {renderOccasionSection(messageOccasion, setMessageOccasion, messageDate, setMessageDate)}
                  <label className="field-label" style={{ marginTop: '1.2rem' }}>Your message</label>
                  <textarea
                    className="field-textarea"
                    placeholder="Write your heartfelt message here… There are no wrong words."
                    value={writeMessage}
                    onChange={e => setWriteMessage(e.target.value)}
                    rows={8}
                  />
                  <div className="char-count">{writeMessage.length} characters</div>
                  <button className="save-btn" onClick={saveMessage}>💾 Save Message</button>
                </div>
              </div>
            </div>
          )}

          {currentPage === 'content-media' && (
            <div className="page-overlay content-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('heartbox')}>← Back</button>
                <h2 className="page-title">🎬 Audio, Video & Images</h2>
                <div />
              </div>
              <div className="content-page">
                <div className="content-hero content-hero-media">
                  <h3>Build a memory vault</h3>
                  <p>Store voice notes, pictures, and videos so memories feel vivid for your loved ones.</p>
                </div>
                {renderReceiptSection(false)}
                {renderOccasionSection(mediaOccasion, setMediaOccasion, mediaDate, setMediaDate)}
                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <div className="upload-icon">📁</div>
                  <div className="upload-label">Tap to upload photos, videos or audio</div>
                  <div className="upload-hint">Supports JPG, PNG, MP4, MOV, MP3</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setMediaFiles(prev => [
                        ...prev,
                        ...files.map(f => ({ name: f.name, type: f.type, id: Date.now() + Math.random() }))
                      ]);
                    }}
                  />
                </div>
                {mediaFiles.length > 0 && (
                  <div className="media-list">
                    <h4 className="media-list-title">Uploaded ({mediaFiles.length})</h4>
                    {mediaFiles.map(f => (
                      <div key={f.id} className="media-item">
                        <span className="media-item-icon">
                          {f.type.startsWith('image') ? '🖼️' : f.type.startsWith('video') ? '🎥' : '🎵'}
                        </span>
                        <span className="media-item-name">{f.name}</span>
                        <button className="media-remove" onClick={() => setMediaFiles(prev => prev.filter(x => x.id !== f.id))}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="save-btn" style={{ marginTop: '1.5rem' }} onClick={saveMedia}>
                  💾 Save Media
                </button>
              </div>
            </div>
          )}

          {currentPage === 'content-gifts' && (
            <div className="page-overlay content-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('heartbox')}>← Back</button>
                <h2 className="page-title">💝 Legacy Gifts</h2>
                <div />
              </div>
              <div className="content-page">
                <div className="content-hero content-hero-gifts">
                  <h3>Real gifts, delivered automatically</h3>
                  <p>Simple and elegant. Choose a gift type, and we will coordinate the local delivery for you when the time comes.</p>
                </div>
                {renderReceiptSection(true)}
                {renderOccasionSection(giftOccasion, setGiftOccasion, giftDate, setGiftDate)}

                <h4 className="section-title">Step 1: Select Gift Category</h4>
                <div className="shop-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                  {[
                    { id: 'flowers', name: 'Flowers', icon: '🌸', desc: 'Fresh & Beautiful' },
                    { id: 'chocolate', name: 'Chocolates', icon: '🍫', desc: 'Sweet & Luscious' },
                    { id: 'cakes', name: 'Cakes', icon: '🎂', desc: 'Tasty & Festive' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setLegacyCategory(cat.id); setGiftItems([]); }}
                      style={{
                        background: legacyCategory === cat.id ? '#f0f7ed' : '#fff',
                        border: legacyCategory === cat.id ? '2.5px solid #5aaa38' : '1px solid #eee',
                        borderRadius: '24px',
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: legacyCategory === cat.id ? '0 8px 30px rgba(90, 170, 56, 0.15)' : 'none',
                        transform: legacyCategory === cat.id ? 'translateY(-5px)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ fontSize: '3rem' }}>{cat.icon}</div>
                      <strong style={{ display: 'block', fontSize: '1.1rem', color: '#1f3b18' }}>{cat.name}</strong>
                    </button>
                  ))}
                </div>

                {legacyCategory && (
                  <>
                    <h4 className="section-title" style={{ marginTop: '2rem' }}>Step 2: Choose Your {legacyCategory.charAt(0).toUpperCase() + legacyCategory.slice(1)}</h4>
                    <div className="gift-item-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                      {(legacyCategory === 'flowers' ? flowers : legacyCategory === 'chocolate' ? chocolates : cakes).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setGiftItems([item])}
                          style={{
                            background: giftItems.find(x => x.id === item.id) ? '#f0f7ed' : '#fff',
                            border: giftItems.find(x => x.id === item.id) ? '2px solid #5aaa38' : '1px solid #eee',
                            borderRadius: '16px',
                            padding: '1.2rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontSize: '2.5rem' }}>{item.emoji}</div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '1rem', color: '#1f3b18' }}>{item.name}</strong>
                            <small style={{ color: '#666', fontSize: '0.8rem' }}>{item.meaning}</small>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <h4 className="section-title">Special Delivery Note</h4>
                <textarea
                  className="field-textarea"
                  placeholder="Tell us what message should accompany this gift..."
                  rows={4}
                  value={giftNote}
                  onChange={e => setGiftNote(e.target.value)}
                />
                <button className="save-btn" style={{ marginTop: '1.2rem' }} onClick={saveGiftBooking}>
                  🤝 Confirm Delivery Request
                </button>
              </div>
            </div>
          )}

          {currentPage === 'my-dashboard' && (
            <div className="page-overlay content-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('home')}>← Back</button>
                <h2 className="page-title">👤 My Dashboard</h2>
                <div />
              </div>
              <div className="content-page">
                <UserDashboardExtras onNavigate={navTo} />
              </div>
            </div>
          )}

          {currentPage === 'about' && (
            <div className="page-overlay content-overlay">
              <div className="page-header">
                <button className="back-btn" onClick={() => navTo('home')}>← Back</button>
                <h2 className="page-title">✨ About Still With You</h2>
                <div />
              </div>
              <div className="content-page">
                <AboutIdea />
              </div>
            </div>
          )}

          {currentPage === 'home' && (
            <>
              {saveNotice && <div className="save-toast">{saveNotice}</div>}
              <div className="scene">
                <div className="cloud c1" /><div className="cloud c2" /><div className="cloud c3" />
                <div className={`hero-text${heroHidden ? ' hidden' : ''}`}>
                  {!loggedIn && (
                    <>
                      <h1>Create <em>memories</em><br />that never fade.</h1>
                      <p>
                        <span className="typewriter-text">{heroTypedText}</span>
                        <span className="typewriter-cursor">|</span>
                      </p>
                    </>
                  )}
                  {loggedIn && <p className="hero-stage-line">{stageEncouragement}</p>}
                </div>
                <div className="ground-container">
                  <canvas id="treeCanvas" ref={canvasRef} width={480} height={400} />
                  <img className={`hand-anim${handShow ? ' show' : ''}`} src={handImage} alt="Hand planting seed" />
                  <div className={`seed-drop${seedShow ? ' show' : ''}`} />
                  <div className={`water-ripple${rippleSplash ? ' splash' : ''}`} key={rippleSplash ? 'splash' : 'idle'} />
                  <div className="grass-bg" />
                  <svg className="grass-svg" viewBox="0 0 1440 92" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <g fill="#5db838" opacity=".88">{GRASS_DARK.map((d, i) => <path key={i} d={d} />)}</g>
                    <g fill="#90de54" opacity=".60">{GRASS_LIGHT.map((d, i) => <path key={i} d={d} />)}</g>
                  </svg>
                </div>
              </div>

              <button className={`water-btn${waterShake ? ' shake' : ''}`} onClick={waterPlant} title="Open HeartBox">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 3C16 3 5 14 5 20.5C5 26.5 10 31 16 31C22 31 27 26.5 27 20.5C27 14 16 3 16 3Z"
                    fill="rgba(255,255,255,.92)" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
                  <ellipse cx="21" cy="23" rx="3.5" ry="4.5" fill="rgba(255,255,255,.38)" transform="rotate(-35 21 23)" />
                </svg>
                HeartBox
              </button>

              <div className="stage-dots">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`dot${i < plantStage ? ' filled' : ''}`} />
                ))}
              </div>

              <div className="droplets-container">
                {droplets.map(d => (
                  <div key={d.id} className="droplet"
                    style={{ left: d.left, top: d.top, animationDelay: `${d.delay}s` }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <LoginModal
        isOpen={overlayOpen}
        onClose={closeModal}
        onLoginSuccess={handleNewLoginSuccess}
      />
    </>
  );
}
