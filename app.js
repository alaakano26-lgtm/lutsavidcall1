const BACKEND_URL = String(window.LUTSA_BACKEND_URL || '').trim().replace(/\/+$/, '');
const backendUrl = path => {
  const value = String(path || '');
  if (/^https?:\/\//i.test(value)) return value;
  if (!BACKEND_URL) return value;
  return `${BACKEND_URL}${value.startsWith('/') ? value : '/' + value}`;
};
const _nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === 'string') return _nativeFetch(backendUrl(input), init);
  return _nativeFetch(input, init);
};
const socket = io(BACKEND_URL || undefined, { transports: ['websocket', 'polling'] });

const $ = id => document.getElementById(id);
const lobby = $('lobby');
const call = $('call');
const statusEl = $('status');
const displayNameEl = $('displayName');
const roomInput = $('roomInput');
const remoteVideo = $('remoteVideo');
const localVideo = $('localVideo');
const remotePlaceholder = $('remotePlaceholder');
const remoteAudioButton = $('remoteAudioButton');
const roomLabel = $('roomLabel');
const localLabel = $('localLabel');
const remoteLabel = $('remoteLabel');
const networkState = $('networkState');
const networkDot = $('networkDot');
const iceStateEl = $('iceState');
const candidateTypeEl = $('candidateType');
const turnStateEl = $('turnState');
const qualityState = $('qualityState');
const bitrateState = $('bitrateState');
const messagesEl = $('messages');
const chatInput = $('chatInput');
const typingIndicator = $('typingIndicator');
const fileInput = $('fileInput');
const uploadBtn = $('uploadBtn');
const recordAudioBtn = $('recordAudioBtn');
const languageSelect = $('languageSelect');
const unreadBadge = $('unreadBadge');
const notificationsBtn = $('notificationsBtn');
const downloadChatBtn = $('downloadChatBtn');
const toastContainer = $('toastContainer');
const friendSearchInput = $('friendSearchInput');
const friendSearchResults = $('friendSearchResults');
const friendRequestsEl = $('friendRequests');
const friendsListEl = $('friendsList');
const directMessagesCard = $('directMessagesCard');
const directMessagesEl = $('directMessages');
const directMessageForm = $('directMessageForm');
const directMessageInput = $('directMessageInput');
const directChatFriendLabel = $('directChatFriendLabel');
const myUserIdEl = $('myUserId');
const copyUserIdBtn = $('copyUserIdBtn');
const quickFriendInput = $('quickFriendInput');
const quickAddFriendBtn = $('quickAddFriendBtn');
const headerSearchBtn = $('searchUsersBtn');
const introScreen = $('introScreen');
const skipIntroBtn = $('skipIntroBtn');
const authScreen = $('authScreen');
const appShell = document.querySelector('.app-shell');
const loginModeBtn = $('loginModeBtn');
const registerModeBtn = $('registerModeBtn');
const loginForm = $('loginForm');
const registerForm = $('registerForm');
const loginUsername = $('loginUsername');
const loginPassword = $('loginPassword');
const registerDisplayName = $('registerDisplayName');
const registerUsername = $('registerUsername');
const registerPassword = $('registerPassword');
const authTitle = $('authTitle');
const authSubtitle = $('authSubtitle');
const authMessage = $('authMessage');
const logoutBtn = $('logoutBtn');
const postForm = $('postForm');
const postText = $('postText');
const postVisibility = $('postVisibility');
const feedList = $('feedList');
const refreshFeedBtn = $('refreshFeedBtn');
const notificationsCard = $('notificationsCard');
const notificationsList = $('notificationsList');
const notificationsSummary = $('notificationsSummary');
const notificationsNavBtn = $('notificationsNavBtn');
const markNotificationsBtn = $('markNotificationsBtn');
const profileCard = $('profileCard');
const profileEditBtn = $('profileEditBtn');
const profileNavBtn = $('profileNavBtn');
const profileForm = $('profileForm');
const profileDisplayName = $('profileDisplayName');
const profileBio = $('profileBio');
const profileAvatarInput = $('profileAvatarInput');
const profileAvatarPreview = $('profileAvatarPreview');
const profileAvatarStatus = $('profileAvatarStatus');
const profileFriendsCount = $('profileFriendsCount');
const profilePostsCount = $('profilePostsCount');
const closeProfileBtn = $('closeProfileBtn');
const storyAddBtn = $('storyAddBtn');
const storyInput = $('storyInput');
const storyPeople = $('storyPeople');
const storyAddRing = $('storyAddRing');
const storyViewer = $('storyViewer');
const storyViewerClose = $('storyViewerClose');
const storyViewerAvatar = $('storyViewerAvatar');
const storyViewerName = $('storyViewerName');
const storyViewerTime = $('storyViewerTime');
const storyViewerMedia = $('storyViewerMedia');
let directUnread = {};
let socialStories = [];
let authToken = localStorage.getItem('lutsa_auth_token') || '';
let authReady = false;

let currentRoom = '';
let localName = localStorage.getItem('crosscall_name') || 'Guest';
let pc = null;
let localStream = null;
let remoteStream = null;
let remoteSocketId = null;
let config = { iceServers: [] };
let turnReady = false;
let remoteCandidateQueue = [];
let pendingRestart = false;
let makingOffer = false;
let ignoreOffer = false;
let isPolite = false;
let screenStream = null;
let screenTrack = null;
let cameraTrack = null;
let audioTrack = null;
let callStartedAt = 0;
let timerHandle = null;
let statsHandle = null;
let lastBytes = 0;
let lastStatsAt = 0;
let typingTimer = null;
let reconnectAttempt = 0;
let mediaRecorder = null;
let audioChunks = [];
let recordingStartedAt = 0;
let recordingTimer = null;
let currentLang = localStorage.getItem('lutsavidcall_lang') || 'ar';
let unreadCount = 0;
let pushRegistration = null;
let pushSubscription = null;
let notificationReady = false;
let audioContext = null;
let lastNotifiedMessageId = '';
let localUserId = localStorage.getItem('lutsa_user_id') || '';
let friends = [];
let friendRequests = [];
let outgoingFriendRequests = [];
let activeDirectFriend = null;
let friendCounts = { friends: 0, incoming: 0, outgoing: 0 };
let audioUnlocked = false;
let remoteAudioNeedsGesture = false;

const I18N = {
  ar: {
    appName: 'Lutsa vidcall',
    title: 'مكالمات فيديو عبر شبكات مختلفة',
    subtitle: 'اتصال فيديو وصوت مع غرفة دردشة، صور وملفات وصوتيات. صُمم للعمل بين Wi‑Fi و4G/5G باستخدام WebRTC مع STUN/TURN.',
    yourName: 'اسمك',
    namePlaceholder: 'مثال: Ahmed',
    createRoom: 'إنشاء غرفة جديدة',
    joinRoom: 'دخول إلى غرفة',
    roomCode: 'رمز الغرفة',
    roomPlaceholder: 'مثال: A1B2C3D4',
    enter: 'دخول',
    ready: 'جاهز',
    security: '🔒 لا ترسل رمز الغرفة علناً. في الإنتاج استخدم HTTPS وبيانات TURN مؤقتة.',
    room: 'الغرفة',
    waitingPeer: 'بانتظار الطرف الآخر…',
    otherParty: 'الطرف الآخر',
    you: 'أنت',
    voice: '🎙️ صوت',
    noAudio: '🔇 بدون صوت',
    mic: '🎙️ الميكروفون',
    micOff: '🔇 الميكروفون مكتوم',
    camera: '📷 الكاميرا',
    cameraOff: '🚫 الكاميرا متوقفة',
    shareScreen: '🖥️ مشاركة الشاشة',
    stopShare: '🛑 إيقاف مشاركة الشاشة',
    devices: '⚙️ الأجهزة',
    reconnect: '🔄 إعادة الاتصال',
    copyLink: '🔗 نسخ الرابط',
    hangup: '📞 إنهاء',
    devicePanel: 'اختيار الأجهزة',
    camera: 'الكاميرا',
    microphone: 'الميكروفون',
    speaker: 'السماعة',
    deviceNote: 'اختيار السماعة يحتاج دعماً من المتصفح والجهاز. تغيير الكاميرا/الميكروفون يتم أثناء المكالمة.',
    connectionStatus: 'حالة الاتصال',
    ice: 'ICE',
    path: 'المسار',
    turnSession: 'TURN للجلسة',
    turnPreparing: 'جاري تجهيز TURN…',
    turnReady: 'TURN جاهز',
    turnUnavailable: 'TURN غير متاح — سيستمر الاتصال المباشر',
    videoQuality: 'جودة الفيديو',
    bitrate: 'الجودة',
    turnHint: 'وجود TURN مضبوط بشكل صحيح مهم عندما تمنع الشبكة الاتصال المباشر.',
    chatRoom: '💬 غرفة الدردشة',
    typeMessage: 'اكتب رسالة…',
    send: 'إرسال',
    attach: '📎 ملف / صورة',
    audioMessage: '🎙️ إرسال صوتية',
    stopRecording: '⏹️ إيقاف التسجيل',
    recording: 'جارٍ التسجيل',
    uploadPreparing: 'جاري تجهيز الملف…',
    uploading: 'جاري رفع الملف…',
    uploaded: 'تم إرسال الملف.',
    maxFile: 'الحد الأقصى للملف هو {size} MB.',
    fileType: 'نوع الملف غير مسموح.',
    uploadFailed: 'تعذر رفع الملف.',
    fileRequired: 'اختر ملفاً أولاً.',
    audioFailed: 'تعذر تسجيل الصوت. اسمح للمتصفح باستخدام الميكروفون.',
    audioSent: 'تم إرسال الصوتية.',
    audioRecording: 'تسجيل صوتية جديدة',
    noBrowserRecord: 'تسجيل الصوت غير مدعوم في هذا المتصفح.',
    callConnected: 'المكالمة متصلة.',
    preparing: 'جاري إنشاء الاتصال…',
    joined: 'تم الدخول. بانتظار الاتصال…',
    foundPeer: 'تم العثور على الطرف الآخر. بدء المكالمة…',
    roomCreated: 'تم إنشاء الغرفة {room}.',
    shareRoom: 'تم إنشاء الغرفة. أرسل الرابط للطرف الآخر.',
    mediaPreparing: 'جاري تجهيز الكاميرا والميكروفون…',
    permission: 'تعذر الوصول إلى الكاميرا/الميكروفون. اسمح بالصلاحيات ثم أعد المحاولة.',
    https: 'للاتصال من جهاز آخر يجب نشر الموقع عبر HTTPS. localhost فقط يعمل بدون HTTPS.',
    roomFull: 'الغرفة ممتلئة (شخصان فقط).',
    cannotJoin: 'تعذر دخول الغرفة.',
    rateLimited: 'عدد المحاولات كبير مؤقتًا. حاول بعد قليل.',
    invalidRoom: 'أدخل رمز الغرفة',
    remoteLeft: 'غادر الطرف الآخر الغرفة',
    leftHint: 'غادر الطرف الآخر. يمكنك مشاركة الرابط مرة أخرى.',
    remoteHangup: 'أنهى الطرف الآخر المكالمة.',
    signalingDown: 'انقطع signaling',
    serverRestored: 'تم استعادة اتصال الخادم.',
    remoteTyping: '{name} يكتب…',
    autoplay: 'اضغط على زر تشغيل الصوت إذا منع المتصفح التشغيل التلقائي.',
    enableRemoteAudio: '🔊 تشغيل صوت الطرف الآخر',
    screenUnsupported: 'مشاركة الشاشة غير مدعومة في هذا المتصفح.',
    screenOn: 'مشاركة الشاشة مفعّلة.',
    cameraBack: 'عادت الكاميرا للمكالمة.',
    cameraChanged: 'تم تغيير الكاميرا.',
    micChanged: 'تم تغيير الميكروفون.',
    micUnsupported: 'تعذر تغيير الميكروفون.',
    cameraUnsupported: 'تعذر تغيير الكاميرا.',
    speakerChanged: 'تم تغيير السماعة.',
    speakerUnsupported: 'تغيير السماعة غير مدعوم في هذا المتصفح.',
    copied: 'تم نسخ رابط الغرفة. أرسله للطرف الآخر.',
    copyPrompt: 'انسخ رابط الغرفة:',
    reconnecting: 'إعادة بناء المسار…',
    disconnected: 'انقطع اتصال الخادم مؤقتاً…',
    unexpected: 'حدث تعارض مؤقت في التفاوض، ستتم إعادة المحاولة.',
    productionHttps: 'تنبيه: في الإنتاج استخدم HTTPS حتى تعمل الكاميرا والميكروفون على الهواتف والشبكات الخارجية.',
    direct: 'STUN / Public',
    relay: 'TURN / Relay',
    waiting: 'غير متصل',
    checking: 'جاري فحص المسار',
    temporaryDisconnect: 'انقطع مؤقتاً',
    failedRetry: 'فشل — إعادة محاولة',
    endedByPeer: 'أنهى الطرف الآخر الاتصال',
    audio: 'صوت',
    yourMessages: 'أنت',
    download: 'تحميل',
    file: 'ملف',
    image: 'صورة',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    czech: 'Čeština',
    lobbyHelp: 'أنشئ غرفة أو أدخل رمز غرفة موجودة. يمكن استخدام الدردشة والملفات والصوتيات داخل الغرفة.',
    dragDrop: 'يمكنك أيضاً سحب الملفات وإفلاتها هنا.',
    notificationsEnable: 'تفعيل الإشعارات',
    notificationsOn: 'الإشعارات مفعلة',
    notificationsDenied: 'الإشعارات محظورة من المتصفح.',
    notificationsSecure: 'يجب استخدام HTTPS لتفعيل إشعارات الخلفية.',
    notificationTitle: 'رسالة جديدة',
    downloadChat: 'تحميل سجل الدردشة',
    chatDownloaded: 'تم تحميل سجل الدردشة.',
    chatDownloadEmpty: 'لا توجد رسائل محفوظة للتحميل.',
    incomingFile: 'ملف جديد',
    callTab: 'مكالمة', chatTab: 'دردشة', home: 'الرئيسية', discover: 'اكتشف', create: 'إنشاء', messagesNav: 'الرسائل', profile: 'الحساب', stories: 'القصص', storiesHint: 'لحظات سريعة من أصدقائك', yourStory: 'قصتك', viewAll: 'عرض الكل', editProfile: 'تعديل', quickCall: 'مكالمة فيديو', quickShare: 'مشاركة', quickLive: 'بث مباشر', premiumTag: 'LUTSA PREMIUM', socialTagline: 'تواصل • اتصل • شارك', liveNow: 'مباشر الآن · عام', feedText: 'تحدث مع أصدقائك أينما كانوا. شارك رابط الغرفة وابدأ فورًا.', like: 'إعجاب', comment: 'تعليق', share: 'مشاركة', friends: 'الأصدقاء', friendsHint: 'أضف أصدقاءك وتواصل معهم مباشرة.', refresh: 'تحديث', searchFriends: 'ابحث بالاسم', search: 'بحث', addFriend: 'إضافة',postComposerTitle: 'بماذا تفكر؟', postComposerHint: 'شارك تحديثًا مع أصدقائك ومتابعيك.', postPlaceholder: 'اكتب منشورًا…', publicPost: 'عام', friendsPost: 'الأصدقاء', publish: 'نشر', newsFeed: 'آخر المنشورات', newsFeedHint: 'منشوراتك ومنشورات أصدقائك.', postPublished: 'تم نشر المنشور.', postFailed: 'تعذر نشر المنشور.', postEmpty: 'اكتب شيئًا أولًا.', unlike: 'إلغاء الإعجاب', commentPlaceholder: 'اكتب تعليقًا…', addComment: 'إضافة', deletePost: 'حذف المنشور', confirmDeletePost: 'هل تريد حذف هذا المنشور؟', noPosts: 'لا توجد منشورات بعد.', loadingFeed: 'جاري تحميل المنشورات…', notificationLike: 'أعجب بمنشورك', notificationComment: 'علّق على منشورك', notifications: 'الإشعارات', markRead: 'قراءة الكل', noNotifications: 'لا توجد إشعارات.', profileSettings: 'الملف الشخصي', profileHint: 'حدّث اسمك ونبذة التعريف.', bio: 'نبذة', saveProfile: 'حفظ التغييرات', profileSaved: 'تم حفظ الملف الشخصي.', profilePhoto: 'صورة الملف الشخصي', profilePhotoHint: 'اختر صورة واضحة لعرضها بجانب اسمك.', chooseProfilePhoto: 'اختيار صورة', profilePhotoLimit: 'JPG، PNG، WEBP أو GIF — حتى 5 MB', profilePhotoUploading: 'جاري رفع الصورة…', profilePhotoUploaded: 'تم تحديث صورة الملف الشخصي.', profilePhotoFailed: 'تعذر رفع صورة الملف الشخصي.', profilePhotoTooLarge: 'حجم الصورة يجب ألا يتجاوز 5 MB.', profilePhotoType: 'اختر صورة JPG أو PNG أو WEBP أو GIF.', publicLabel: 'عام', friendsLabel: 'الأصدقاء', posts: 'المنشورات', pending: 'معلّق', friendsWith: 'صديق', accept: 'قبول', decline: 'رفض', noFriends: 'لا يوجد أصدقاء بعد.', noRequests: 'لا توجد طلبات صداقة.', online: 'متصل', offline: 'غير متصل', incomingRequests: 'طلبات واردة', sentRequests: 'طلبات أرسلتها', waitingResponse: 'بانتظار الرد', cancelRequest: 'إلغاء الطلب', requestCancelled: 'تم إلغاء طلب الصداقة.', friendRemoved: 'تمت إزالة الصديق.', newFriendRequest: 'أرسل لك طلب صداقة', incomingRequest: 'طلب صداقة وارد', directMessages: 'الرسائل الخاصة', chooseFriend: 'اختر صديقًا لبدء المحادثة.', friendAdded: 'تمت إضافة الصديق.', requestSent: 'تم إرسال طلب الصداقة.', requestAccepted: 'تم قبول طلب الصداقة.', requestDeclined: 'تم رفض الطلب.', alreadyFriends: 'أنتم أصدقاء بالفعل.', requestExists: 'طلب الصداقة موجود بالفعل.', userNotFound: 'المستخدم غير موجود.', directMessageFailed: 'تعذر إرسال الرسالة.', messageSent: 'تم إرسال الرسالة.', friendCallSent: 'تم إرسال رابط المكالمة إلى صديقك.', yourId: 'معرفك', copyId: 'نسخ', copiedId: 'تم نسخ المعرف.', quickAddFriend: 'إضافة صديق', quickAddFriendHint: 'أدخل معرف الصديق أو اسمه ثم أرسل الطلب مباشرة.', quickAddPlaceholder: 'مثال: u_12345 أو Ahmed', sendRequest: 'إرسال الطلب', introKicker: 'LUTSA PREMIUM', introTitle: 'تواصل. اتصل. شارك.', introSubtitle: 'تجربة اجتماعية جديدة للمكالمات والدردشة والأصدقاء.', skipIntro: 'تخطي', storyUploadHint: 'أضف صورة أو فيديو إلى قصتك • تظهر لمدة 24 ساعة', storyUploading: 'جاري رفع القصة…', storyUploaded: 'تم نشر قصتك.', storyUploadFailed: 'تعذر رفع القصة.', storyFileType: 'اختر صورة أو فيديو MP4/WEBM.', storyFileTooLarge: 'حجم القصة يجب ألا يتجاوز 15 MB.', noStories: 'لا توجد قصص من أصدقائك بعد.' ,
  },
  en: {},
  cs: {}
};

I18N.en = {
  ...I18N.ar,
  appName: 'Lutsa vidcall', title: 'Video Calls Across Different Networks',
  subtitle: 'Video and audio calls with a chat room, images, files and voice messages. Designed for Wi‑Fi and 4G/5G with WebRTC and STUN/TURN.',
  yourName: 'Your name', namePlaceholder: 'Example: Ahmed', createRoom: 'Create New Room', joinRoom: 'Join a Room',
  roomCode: 'Room code', roomPlaceholder: 'Example: A1B2C3D4', enter: 'Join', ready: 'Ready',
  security: '🔒 Do not share the room code publicly. In production, use HTTPS and short-lived TURN credentials.', room: 'Room',
  waitingPeer: 'Waiting for the other participant…', otherParty: 'Other participant', you: 'You', voice: '🎙️ Audio', noAudio: '🔇 No audio',
  mic: '🎙️ Microphone', micOff: '🔇 Microphone muted', camera: '📷 Camera', cameraOff: '🚫 Camera off', shareScreen: '🖥️ Share screen',
  stopShare: '🛑 Stop sharing', devices: '⚙️ Devices', reconnect: '🔄 Reconnect', copyLink: '🔗 Copy link', hangup: '📞 End',
  devicePanel: 'Device selection', camera: 'Camera', microphone: 'Microphone', speaker: 'Speaker',
  deviceNote: 'Speaker selection depends on browser/device support. Camera and microphone can be changed during the call.',
  connectionStatus: 'Connection status', ice: 'ICE', path: 'Path', turnSession: 'Session TURN', turnPreparing: 'Preparing TURN…', turnReady: 'TURN ready', turnUnavailable: 'TURN unavailable — direct connection will still be used', videoQuality: 'Video quality', bitrate: 'Bitrate',
  turnHint: 'A correctly configured TURN server is important when the network blocks direct connectivity.', chatRoom: '💬 Chat Room',
  typeMessage: 'Type a message…', send: 'Send', attach: '📎 File / Image', audioMessage: '🎙️ Send voice message', stopRecording: '⏹️ Stop recording',
  recording: 'Recording', uploadPreparing: 'Preparing file…', uploading: 'Uploading file…', uploaded: 'File sent.', maxFile: 'Maximum file size is {size} MB.',
  fileType: 'This file type is not allowed.', uploadFailed: 'Failed to upload file.', fileRequired: 'Choose a file first.',
  audioFailed: 'Could not record audio. Allow microphone access.', audioSent: 'Voice message sent.', audioRecording: 'New voice message',
  noBrowserRecord: 'Audio recording is not supported by this browser.', callConnected: 'Call connected.', preparing: 'Creating connection…',
  joined: 'Joined. Waiting for connection…', foundPeer: 'Other participant found. Starting call…', roomCreated: 'Room {room} created.',
  shareRoom: 'Room created. Send the link to the other participant.', mediaPreparing: 'Preparing camera and microphone…',
  permission: 'Could not access camera/microphone. Allow permission and try again.', https: 'To connect from another device, publish the site over HTTPS. localhost works without HTTPS.',
  roomFull: 'Room is full (2 participants only).', cannotJoin: 'Could not join the room.', rateLimited: 'Too many attempts. Please try again shortly.', invalidRoom: 'Enter a room code', remoteLeft: 'The other participant left the room.',
  leftHint: 'The other participant left. You can share the link again.', remoteHangup: 'The other participant ended the call.', signalingDown: 'Signaling disconnected',
  serverRestored: 'Server connection restored.', remoteTyping: '{name} is typing…', autoplay: 'Click the sound button if autoplay is blocked.',
  enableRemoteAudio: '🔊 Enable remote audio',
  screenUnsupported: 'Screen sharing is not supported in this browser.', screenOn: 'Screen sharing is active.', cameraBack: 'Camera restored to the call.',
  cameraChanged: 'Camera changed.', micChanged: 'Microphone changed.', micUnsupported: 'Could not change microphone.', cameraUnsupported: 'Could not change camera.',
  speakerChanged: 'Speaker changed.', speakerUnsupported: 'Speaker selection is not supported in this browser.', copied: 'Room link copied. Send it to the other participant.',
  copyPrompt: 'Copy the room link:', reconnecting: 'Rebuilding connection path…', disconnected: 'Server connection temporarily lost…',
  unexpected: 'Temporary negotiation conflict. Retrying…', productionHttps: 'Notice: use HTTPS in production so camera/microphone work on phones and external networks.',
  direct: 'STUN / Public', relay: 'TURN / Relay', waiting: 'Disconnected', checking: 'Checking path', temporaryDisconnect: 'Temporarily disconnected',
  failedRetry: 'Failed — retrying', endedByPeer: 'The other participant ended the connection', audio: 'Audio', yourMessages: 'You', download: 'Download',
  file: 'File', image: 'Image', language: 'Language', arabic: 'العربية', english: 'English', czech: 'Čeština',
  lobbyHelp: 'Create a room or enter an existing code. Chat, files and voice messages are available inside the room.', dragDrop: 'You can also drag and drop files here.', notificationsEnable: 'Enable notifications', notificationsOn: 'Notifications enabled', notificationsDenied: 'Notifications are blocked by the browser.', notificationsSecure: 'HTTPS is required for background notifications.', notificationTitle: 'New message', downloadChat: 'Download chat history', chatDownloaded: 'Chat history downloaded.', chatDownloadEmpty: 'There are no saved messages to download.', incomingFile: 'New file', quickAddFriend: 'Add a friend', quickAddFriendHint: 'Enter a friend ID or name and send the request directly.', quickAddPlaceholder: 'Example: u_12345 or Ahmed', sendRequest: 'Send request', introKicker: 'LUTSA PREMIUM', introTitle: 'Connect. Call. Share.', introSubtitle: 'A new social experience for calls, chat and friends.', skipIntro: 'Skip'
};

I18N.en.storyUploadHint='Add a photo or video to your story • visible for 24 hours'; I18N.en.storyUploading='Uploading story…'; I18N.en.storyUploaded='Your story is live.'; I18N.en.storyUploadFailed='Could not upload story.'; I18N.en.storyFileType='Choose an image or MP4/WEBM video.'; I18N.en.storyFileTooLarge='Story file must be 15 MB or smaller.'; I18N.en.noStories='No stories from your friends yet.'; I18N.en.quickAddFriend='Add a friend'; I18N.en.quickAddFriendHint='Enter a friend ID or name and send the request directly.'; I18N.en.quickAddPlaceholder='Example: u_12345 or Ahmed'; I18N.en.sendRequest='Send request'; I18N.en.introKicker='LUTSA PREMIUM'; I18N.en.introTitle='Connect. Call. Share.'; I18N.en.introSubtitle='A new social experience for calls, chat and friends.'; I18N.en.skipIntro='Skip';
I18N.en.online='Online'; I18N.en.offline='Offline'; I18N.en.incomingRequests='Incoming requests'; I18N.en.sentRequests='Sent requests'; I18N.en.waitingResponse='Waiting for response'; I18N.en.cancelRequest='Cancel request'; I18N.en.requestCancelled='Friend request cancelled.'; I18N.en.friendRemoved='Friend removed.'; I18N.en.newFriendRequest='sent you a friend request'; I18N.en.incomingRequest='Incoming friend request';
I18N.en.home='Home'; I18N.en.discover='Discover'; I18N.en.create='Create'; I18N.en.messagesNav='Messages'; I18N.en.profile='Profile'; I18N.en.stories='Stories'; I18N.en.storiesHint='Quick moments from your people'; I18N.en.yourStory='Your story'; I18N.en.viewAll='View all'; I18N.en.editProfile='Edit'; I18N.en.quickCall='Video call'; I18N.en.quickShare='Share'; I18N.en.quickLive='Go live'; I18N.en.premiumTag='LUTSA PREMIUM'; I18N.en.socialTagline='Connect • Call • Share'; I18N.en.liveNow='Live now · Public'; I18N.en.feedText='Talk with friends wherever they are. Share a room link and start instantly.'; I18N.en.like='Like'; I18N.en.comment='Comment'; I18N.en.share='Share';

I18N.cs = {
  ...I18N.en,
  title: 'Videohovory přes různé sítě', subtitle: 'Videohovory a audiohovory s chatovací místností, obrázky, soubory a hlasovými zprávami. Určeno pro Wi‑Fi a 4G/5G pomocí WebRTC a STUN/TURN.',
  yourName: 'Vaše jméno', namePlaceholder: 'Například: Ahmed', createRoom: 'Vytvořit novou místnost', joinRoom: 'Připojit se k místnosti', roomCode: 'Kód místnosti',
  roomPlaceholder: 'Například: A1B2C3D4', enter: 'Připojit', ready: 'Připraveno', security: '🔒 Kód místnosti nesdílejte veřejně. V produkci používejte HTTPS a krátkodobé TURN údaje.',
  room: 'Místnost', waitingPeer: 'Čekání na druhého účastníka…', otherParty: 'Druhý účastník', you: 'Vy', voice: '🎙️ Zvuk', noAudio: '🔇 Bez zvuku',
  mic: '🎙️ Mikrofon', micOff: '🔇 Mikrofon ztlumen', camera: '📷 Kamera', cameraOff: '🚫 Kamera vypnuta', shareScreen: '🖥️ Sdílet obrazovku', stopShare: '🛑 Ukončit sdílení',
  devices: '⚙️ Zařízení', reconnect: '🔄 Znovu připojit', copyLink: '🔗 Kopírovat odkaz', hangup: '📞 Ukončit', devicePanel: 'Výběr zařízení', camera: 'Kamera', microphone: 'Mikrofon', speaker: 'Reproduktor',
  deviceNote: 'Výběr reproduktoru závisí na podpoře prohlížeče a zařízení. Kameru a mikrofon lze měnit během hovoru.', connectionStatus: 'Stav připojení', path: 'Trasa', videoQuality: 'Kvalita videa', bitrate: 'Datový tok',
  turnHint: 'Správně nastavený TURN server je důležitý, když síť blokuje přímé spojení.', turnSession: 'TURN relace', turnPreparing: 'Příprava TURN…', turnReady: 'TURN připraven', turnUnavailable: 'TURN není dostupný — přímé spojení bude stále použito', chatRoom: '💬 Chatovací místnost', typeMessage: 'Napište zprávu…', send: 'Odeslat', attach: '📎 Soubor / Obrázek', audioMessage: '🎙️ Odeslat hlasovou zprávu', stopRecording: '⏹️ Zastavit nahrávání', recording: 'Nahrávání',
  uploadPreparing: 'Příprava souboru…', uploading: 'Nahrávání souboru…', uploaded: 'Soubor odeslán.', maxFile: 'Maximální velikost souboru je {size} MB.', fileType: 'Tento typ souboru není povolen.', uploadFailed: 'Soubor se nepodařilo nahrát.', fileRequired: 'Nejprve vyberte soubor.',
  audioFailed: 'Zvuk se nepodařilo nahrát. Povolte přístup k mikrofonu.', audioSent: 'Hlasová zpráva odeslána.', audioRecording: 'Nová hlasová zpráva', noBrowserRecord: 'Nahrávání zvuku tento prohlížeč nepodporuje.', callConnected: 'Hovor je připojen.', preparing: 'Vytváření spojení…',
  joined: 'Připojeno. Čekání na spojení…', foundPeer: 'Druhý účastník nalezen. Spouštění hovoru…', roomCreated: 'Místnost {room} byla vytvořena.', shareRoom: 'Místnost vytvořena. Pošlete odkaz druhému účastníkovi.', mediaPreparing: 'Příprava kamery a mikrofonu…',
  permission: 'Nelze získat přístup ke kameře/mikrofonu. Povolte oprávnění a zkuste to znovu.', https: 'Pro připojení z jiného zařízení publikujte web přes HTTPS. localhost funguje bez HTTPS.', roomFull: 'Místnost je plná (pouze 2 účastníci).', cannotJoin: 'Do místnosti se nepodařilo připojit.', rateLimited: 'Příliš mnoho pokusů. Zkuste to za chvíli znovu.', invalidRoom: 'Zadejte kód místnosti',
  remoteLeft: 'Druhý účastník opustil místnost', leftHint: 'Druhý účastník odešel. Odkaz můžete sdílet znovu.', remoteHangup: 'Druhý účastník ukončil hovor.', signalingDown: 'Signalizace odpojena', serverRestored: 'Připojení k serveru obnoveno.', remoteTyping: '{name} píše…',
  autoplay: 'Klikněte na tlačítko zvuku, pokud je automatické přehrávání blokováno.',
  enableRemoteAudio: '🔊 Zapnout vzdálený zvuk', screenUnsupported: 'Sdílení obrazovky není v tomto prohlížeči podporováno.', screenOn: 'Sdílení obrazovky je aktivní.', cameraBack: 'Kamera byla vrácena do hovoru.', cameraChanged: 'Kamera změněna.', micChanged: 'Mikrofon změněn.', micUnsupported: 'Mikrofon se nepodařilo změnit.', cameraUnsupported: 'Kameru se nepodařilo změnit.', speakerChanged: 'Reproduktor změněn.', speakerUnsupported: 'Výběr reproduktoru není v tomto prohlížeči podporován.', copied: 'Odkaz na místnost byl zkopírován. Pošlete jej druhému účastníkovi.', copyPrompt: 'Zkopírujte odkaz na místnost:', reconnecting: 'Obnovování spojení…', disconnected: 'Připojení k serveru bylo dočasně ztraceno…', unexpected: 'Dočasný konflikt vyjednávání. Opakování…', productionHttps: 'Upozornění: v produkci používejte HTTPS, aby kamera/mikrofon fungovaly na telefonech a externích sítích.', direct: 'STUN / Public', relay: 'TURN / Relay', waiting: 'Odpojeno', checking: 'Kontrola trasy', temporaryDisconnect: 'Dočasně odpojeno', failedRetry: 'Selhalo — opakování', endedByPeer: 'Druhý účastník ukončil spojení', audio: 'Zvuk', yourMessages: 'Vy', download: 'Stáhnout', file: 'Soubor', image: 'Obrázek', language: 'Jazyk', arabic: 'العربية', english: 'English', czech: 'Čeština', lobbyHelp: 'Vytvořte místnost nebo zadejte existující kód. V místnosti jsou dostupné chat, soubory a hlasové zprávy.', dragDrop: 'Soubory můžete také přetáhnout sem.'
};

I18N.cs.home='Domů'; I18N.cs.discover='Objevovat'; I18N.cs.create='Vytvořit'; I18N.cs.messagesNav='Zprávy'; I18N.cs.profile='Profil'; I18N.cs.stories='Příběhy'; I18N.cs.storiesHint='Krátké okamžiky od vašich lidí'; I18N.cs.yourStory='Váš příběh'; I18N.cs.viewAll='Zobrazit vše'; I18N.cs.editProfile='Upravit'; I18N.cs.quickCall='Videohovor'; I18N.cs.quickShare='Sdílet'; I18N.cs.quickLive='Vysílat živě'; I18N.cs.premiumTag='LUTSA PREMIUM'; I18N.cs.socialTagline='Spojuj. Volej. Sdílej.'; I18N.cs.liveNow='Živě · Veřejné'; I18N.cs.feedText='Mluvte s přáteli, ať jsou kdekoli. Sdílejte odkaz na místnost a začněte hned.'; I18N.cs.like='To se mi líbí'; I18N.cs.comment='Komentář'; I18N.cs.share='Sdílet';

Object.assign(I18N.ar, { username: 'اسم المستخدم', password: 'كلمة المرور', displayName: 'الاسم الظاهر', login: 'تسجيل الدخول', createAccount: 'إنشاء الحساب', logout: 'تسجيل الخروج', authLoginTitle: 'تسجيل الدخول', authLoginSubtitle: 'ادخل إلى حسابك للوصول إلى أصدقائك ورسائلك ومكالماتك.', authRegisterTitle: 'إنشاء حساب جديد', authRegisterSubtitle: 'أنشئ حسابك واحتفظ بأصدقائك ورسائلك معك.', authInvalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة.', authUsernameExists: 'اسم المستخدم مستخدم بالفعل.', authInvalidUsername: 'اسم المستخدم يجب أن يكون 3–32 حرفًا إنجليزيًا أو رقمًا أو _ أو -.', authInvalidPassword: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.', authServerError: 'تعذر الاتصال بخدمة الحسابات.', authLoggedOut: 'تم تسجيل الخروج.', authAccountCreated: 'تم إنشاء الحساب بنجاح.', authLogging: 'جاري تسجيل الدخول…', authCreating: 'جاري إنشاء الحساب…' });
Object.assign(I18N.en, { username: 'Username', password: 'Password', displayName: 'Display name', login: 'Log in', createAccount: 'Create account', logout: 'Log out', authLoginTitle: 'Log in', authLoginSubtitle: 'Access your friends, messages and calls.', authRegisterTitle: 'Create a new account', authRegisterSubtitle: 'Create an account and keep your friends and messages with you.', authInvalidCredentials: 'Incorrect username or password.', authUsernameExists: 'That username is already in use.', authInvalidUsername: 'Username must be 3–32 English letters, numbers, _ or -.', authInvalidPassword: 'Password must be at least 8 characters.', authServerError: 'Account service is unavailable.', authLoggedOut: 'You have been logged out.', authAccountCreated: 'Account created successfully.', authLogging: 'Logging in…', authCreating: 'Creating account…' , postComposerTitle: 'What is on your mind?', postComposerHint: 'Share an update with your friends and followers.', postPlaceholder: 'Write a post…', publicPost: 'Public', friendsPost: 'Friends', publish: 'Publish', newsFeed: 'Latest posts', newsFeedHint: 'Posts from you and your friends.', postPublished: 'Post published.', postFailed: 'Could not publish the post.', postEmpty: 'Write something first.', unlike: 'Unlike', commentPlaceholder: 'Write a comment…', addComment: 'Add', deletePost: 'Delete post', confirmDeletePost: 'Delete this post?', noPosts: 'No posts yet.', loadingFeed: 'Loading posts…', notificationLike: 'liked your post', notificationComment: 'commented on your post', notifications: 'Notifications', markRead: 'Mark all read', noNotifications: 'No notifications.', profileSettings: 'Profile', profileHint: 'Update your name and bio.', bio: 'Bio', saveProfile: 'Save changes', profileSaved: 'Profile updated.', profilePhoto: 'Profile photo', profilePhotoHint: 'Choose a clear photo to show next to your name.', chooseProfilePhoto: 'Choose photo', profilePhotoLimit: 'JPG, PNG, WEBP or GIF — up to 5 MB', profilePhotoUploading: 'Uploading photo…', profilePhotoUploaded: 'Profile photo updated.', profilePhotoFailed: 'Could not upload profile photo.', profilePhotoTooLarge: 'The image must be 5 MB or smaller.', profilePhotoType: 'Choose a JPG, PNG, WEBP or GIF image.', publicLabel: 'Public', friendsLabel: 'Friends', posts: 'Posts',});
Object.assign(I18N.cs, { username: 'Uživatelské jméno', password: 'Heslo', displayName: 'Zobrazované jméno', login: 'Přihlásit se', createAccount: 'Vytvořit účet', logout: 'Odhlásit se', authLoginTitle: 'Přihlášení', authLoginSubtitle: 'Získejte přístup ke svým přátelům, zprávám a hovorům.', authRegisterTitle: 'Vytvořit nový účet', authRegisterSubtitle: 'Vytvořte účet a zachovejte své přátele a zprávy.', authInvalidCredentials: 'Nesprávné uživatelské jméno nebo heslo.', authUsernameExists: 'Toto uživatelské jméno je již použito.', authInvalidUsername: 'Uživatelské jméno musí mít 3–32 znaků: písmena, čísla, _ nebo -.', authInvalidPassword: 'Heslo musí mít alespoň 8 znaků.', authServerError: 'Služba účtů není dostupná.', authLoggedOut: 'Byli jste odhlášeni.', authAccountCreated: 'Účet byl úspěšně vytvořen.', authLogging: 'Přihlašování…', authCreating: 'Vytváření účtu…' , postComposerTitle: 'Na co myslíte?', postComposerHint: 'Sdílejte aktualizaci s přáteli a sledujícími.', postPlaceholder: 'Napište příspěvek…', publicPost: 'Veřejné', friendsPost: 'Přátelé', publish: 'Publikovat', newsFeed: 'Nejnovější příspěvky', newsFeedHint: 'Příspěvky od vás a vašich přátel.', postPublished: 'Příspěvek byl publikován.', postFailed: 'Příspěvek se nepodařilo publikovat.', postEmpty: 'Nejprve něco napište.', unlike: 'Odebrat To se mi líbí', commentPlaceholder: 'Napište komentář…', addComment: 'Přidat', deletePost: 'Smazat příspěvek', confirmDeletePost: 'Smazat tento příspěvek?', noPosts: 'Zatím žádné příspěvky.', loadingFeed: 'Načítání příspěvků…', notificationLike: 'dal/a To se mi líbí vašemu příspěvku', notificationComment: 'komentoval/a váš příspěvek', notifications: 'Oznámení', markRead: 'Označit vše jako přečtené', noNotifications: 'Žádná oznámení.', profileSettings: 'Profil', profileHint: 'Upravte jméno a bio.', bio: 'Bio', saveProfile: 'Uložit změny', profileSaved: 'Profil byl aktualizován.', profilePhoto: 'Profilová fotografie', profilePhotoHint: 'Vyberte jasnou fotografii, která se zobrazí u vašeho jména.', chooseProfilePhoto: 'Vybrat fotografii', profilePhotoLimit: 'JPG, PNG, WEBP nebo GIF — do 5 MB', profilePhotoUploading: 'Nahrávání fotografie…', profilePhotoUploaded: 'Profilová fotografie byla aktualizována.', profilePhotoFailed: 'Profilovou fotografii se nepodařilo nahrát.', profilePhotoTooLarge: 'Obrázek musí mít maximálně 5 MB.', profilePhotoType: 'Vyberte obrázek JPG, PNG, WEBP nebo GIF.', publicLabel: 'Veřejné', friendsLabel: 'Přátelé', posts: 'Příspěvky',});
I18N.cs.storyUploadHint='Přidejte fotku nebo video do svého příběhu • viditelné 24 hodin'; I18N.cs.storyUploading='Nahrávání příběhu…'; I18N.cs.storyUploaded='Příběh byl publikován.'; I18N.cs.storyUploadFailed='Příběh se nepodařilo nahrát.'; I18N.cs.storyFileType='Vyberte obrázek nebo video MP4/WEBM.'; I18N.cs.storyFileTooLarge='Příběh musí mít maximálně 15 MB.'; I18N.cs.noStories='Žádné příběhy od přátel.'; I18N.cs.online='Online'; I18N.cs.offline='Offline'; I18N.cs.incomingRequests='Příchozí žádosti'; I18N.cs.sentRequests='Odeslané žádosti'; I18N.cs.waitingResponse='Čeká se na odpověď'; I18N.cs.cancelRequest='Zrušit žádost'; I18N.cs.requestCancelled='Žádost o přátelství byla zrušena.'; I18N.cs.friendRemoved='Přítel byl odebrán.'; I18N.cs.newFriendRequest='vám poslal/a žádost o přátelství'; I18N.cs.incomingRequest='Příchozí žádost o přátelství';


function t(key, vars = {}) {
  let text = I18N[currentLang]?.[key] ?? I18N.en[key] ?? key;
  for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

function applyLanguage(lang) {
  currentLang = ['ar', 'en', 'cs'].includes(lang) ? lang : 'ar';
  localStorage.setItem('lutsavidcall_lang', currentLang);
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  if (languageSelect) languageSelect.value = currentLang;
  if (loginModeBtn) loginModeBtn.textContent = t('login');
  if (registerModeBtn) registerModeBtn.textContent = t('createAccount');
  if (loginModeBtn?.classList.contains('active')) setAuthMode('login'); else if (registerModeBtn?.classList.contains('active')) setAuthMode('register');
  if (recordAudioBtn && !mediaRecorder) recordAudioBtn.textContent = t('audioMessage');
  $('screenBtn').textContent = screenTrack ? t('stopShare') : t('shareScreen');
  $('micBtn').textContent = audioTrack?.enabled === false ? t('micOff') : t('mic');
  $('cameraBtn').textContent = cameraTrack?.enabled === false ? t('cameraOff') : t('camera');
  if (!remoteSocketId) remotePlaceholder.textContent = t('waitingPeer');
  if (notificationsBtn) { notificationsBtn.title = t('notificationsEnable'); notificationsBtn.setAttribute('aria-label', t('notificationsEnable')); }
  if (downloadChatBtn) { downloadChatBtn.title = t('downloadChat'); downloadChatBtn.setAttribute('aria-label', t('downloadChat')); }
  if (feedPosts.length) renderFeed();
  if (socialNotifications.length) renderNotifications();
}

function persistLocalIdentity() { if (localUserId) localStorage.setItem('lutsa_user_id', localUserId); }
function setAuthMessage(message = '') { if (authMessage) authMessage.textContent = message; }
function unlockNotificationAudio() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    audioUnlocked = true;
  } catch {}
}
function playNotificationSound(kind = 'message') {
  try {
    unlockNotificationAudio();
    if (!audioUnlocked || !audioContext) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const tones = kind === 'friend' ? [660, 880] : kind === 'success' ? [520, 760] : [480, 680];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(tones[0], now);
    osc.frequency.setValueAtTime(tones[1], now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(now); osc.stop(now + 0.25);
  } catch {}
}
function authHeaders(extra = {}) { return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : { ...extra }; }
function authFetch(url, options = {}) { return fetch(url, { ...options, headers: authHeaders(options.headers || {}) }); }
function setAvatarElement(el, avatarUrl, displayName = '') {
  if (!el) return;
  const img = el.querySelector?.('img.avatar-image') || el;
  if (avatarUrl) {
    img.src = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
    img.onerror = () => { img.classList.add('hidden'); el.querySelector?.('.avatar-fallback')?.classList.remove('hidden'); el.classList.remove('has-image'); };
    img.alt = displayName || 'Profile photo';
    img.classList.remove('hidden');
    el.querySelector?.('.avatar-fallback')?.classList.add('hidden');
    el.classList.add('has-image');
  } else {
    img.removeAttribute('src');
    img.alt = '';
    img.classList.add('hidden');
    el.querySelector?.('.avatar-fallback')?.classList.remove('hidden');
    el.classList.remove('has-image');
  }
}
function setProfileAvatarState(user) {
  const avatarUrl = user?.avatarUrl || '';
  document.querySelectorAll('[data-avatar-wrap="self"]').forEach(el => setAvatarElement(el, avatarUrl, user?.displayName || localName));
  const previewWrap = profileAvatarPreview?.parentElement;
  if (previewWrap) setAvatarElement(previewWrap, avatarUrl, user?.displayName || localName);
}
function showProfileAvatarStatus(key = '', success = false) {
  if (!profileAvatarStatus) return;
  profileAvatarStatus.textContent = key ? t(key) : '';
  profileAvatarStatus.classList.toggle('success', Boolean(success));
  profileAvatarStatus.classList.toggle('error', Boolean(key && !success));
}
async function uploadProfileAvatar(file) {
  if (!file || !authReady) return;
  if (file.size > 5 * 1024 * 1024) { showProfileAvatarStatus('profilePhotoTooLarge', false); return; }
  if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) { showProfileAvatarStatus('profilePhotoType', false); return; }
  const localPreview = URL.createObjectURL(file);
  if (profileAvatarPreview) { profileAvatarPreview.src = localPreview; profileAvatarPreview.classList.remove('hidden'); }
  if (profileAvatarStatus) profileAvatarStatus.textContent = t('profilePhotoUploading');
  const formData = new FormData(); formData.append('avatar', file);
  try {
    const res = await authFetch('/api/profile/avatar', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'PROFILE_IMAGE_FAILED');
    setAuthenticatedUser(data.user);
    showProfileAvatarStatus('profilePhotoUploaded', true);
  } catch (error) {
    showProfileAvatarStatus(error.message === 'PROFILE_IMAGE_TYPE_NOT_ALLOWED' ? 'profilePhotoType' : 'profilePhotoFailed', false);
  } finally {
    URL.revokeObjectURL(localPreview);
    if (profileAvatarInput) profileAvatarInput.value = '';
  }
}

function setAuthenticatedUser(user) {
  if (!user) return;
  localUserId = user.userId || localUserId;
  localName = user.displayName || localName || 'Guest';
  localStorage.setItem('lutsa_user_id', localUserId);
  localStorage.setItem('crosscall_name', localName);
  if (displayNameEl) displayNameEl.value = localName;
  if ($('homeGreeting')) $('homeGreeting').textContent = localName;
  if (myUserIdEl) myUserIdEl.textContent = localUserId;
  if ($('localLabel')) $('localLabel').textContent = localName;
  setProfileAvatarState(user);
}
function setAppAuthenticated(loggedIn) {
  authReady = loggedIn;
  appShell?.classList.toggle('auth-locked', !loggedIn);
  authScreen?.classList.toggle('auth-hidden', loggedIn);
  if (loggedIn) { setAuthMessage(''); closeIntro(); initSocialData(); }
}
function setAuthMode(mode) {
  const register = mode === 'register';
  loginModeBtn?.classList.toggle('active', !register); registerModeBtn?.classList.toggle('active', register);
  loginForm?.classList.toggle('hidden', register); registerForm?.classList.toggle('hidden', !register);
  if (authTitle) authTitle.textContent = t(register ? 'authRegisterTitle' : 'authLoginTitle');
  if (authSubtitle) authSubtitle.textContent = t(register ? 'authRegisterSubtitle' : 'authLoginSubtitle');
  setAuthMessage('');
}
function authError(error) {
  const map = { INVALID_CREDENTIALS: 'authInvalidCredentials', USERNAME_EXISTS: 'authUsernameExists', INVALID_USERNAME: 'authInvalidUsername', INVALID_PASSWORD: 'authInvalidPassword', AUTH_FAILED: 'authServerError', UNAUTHORIZED: 'authInvalidCredentials' };
  return t(map[error] || 'authServerError');
}
async function saveLoginResponse(data, message = '') {
  authToken = String(data?.token || '');
  if (!authToken || !data?.user) throw new Error('AUTH_RESPONSE_INVALID');
  localStorage.setItem('lutsa_auth_token', authToken);
  setAuthenticatedUser(data.user);
  setAppAuthenticated(true);
  if (socket.connected) await registerUser();
  socket.__lutsaAuthReady = true; setAuthMessage(message);
}
async function submitAuth(endpoint, body, pendingKey) {
  try {
    setAuthMessage(t(pendingKey));
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'AUTH_FAILED');
    await saveLoginResponse(data);
    return true;
  } catch (error) {
    setAuthMessage(error.message === 'AUTH_RESPONSE_INVALID' ? t('authServerError') : authError(error.message));
    return false;
  }
}
async function logout() {
  try { if (currentRoom) endCallToLobby(); await authFetch('/api/auth/logout', { method: 'POST' }); } catch {}
  authToken = ''; localStorage.removeItem('lutsa_auth_token'); localStorage.removeItem('lutsa_user_id');
  try { socket.disconnect(); } catch {}
  location.href = '/';
}
async function initAuth() {
  appShell?.classList.add('auth-locked');
  setAuthMode('login');
  if (!authToken) return setAppAuthenticated(false);
  try {
    const res = await authFetch('/api/auth/me', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error('UNAUTHORIZED');
    setAuthenticatedUser(data.user); setAppAuthenticated(true);
    if (socket.connected) await registerUser();
  } catch {
    authToken = ''; localStorage.removeItem('lutsa_auth_token'); localStorage.removeItem('lutsa_user_id'); setAppAuthenticated(false);
  }
}
function registerUser() {
  return new Promise(resolve => {
    if (!authToken) return resolve({ ok: false, error: 'UNAUTHORIZED' });
    socket.emit('register-user', { token: authToken, displayName: localName }, result => {
      if (result?.ok) {
        setAuthenticatedUser(result.user); socket.__lutsaAuthReady = true; friends = result.friends || []; friendRequests = result.incomingRequests || result.requests || []; outgoingFriendRequests = result.outgoingRequests || []; friendCounts = result.counts || { friends: friends.length, incoming: friendRequests.length, outgoing: outgoingFriendRequests.length }; renderFriends();
      } else if (result?.error === 'UNAUTHORIZED') { authToken = ''; localStorage.removeItem('lutsa_auth_token'); setAppAuthenticated(false); }
      resolve(result);
    });
  });
}
function renderFriends() {
  if (myUserIdEl) myUserIdEl.textContent = localUserId;
  const friendsBadge = $('friendsCountBadge');
  const requestsBadge = $('requestsCountBadge');
  if (friendsBadge) friendsBadge.textContent = String(friends.length);
  if (requestsBadge) requestsBadge.textContent = String(friendRequests.length);
  const unreadFor = id => Number(directUnread[id] || 0);
  if (friendsListEl) friendsListEl.innerHTML = friends.length ? friends.map(f => {
    const unread = unreadFor(f.userId);
    return `<div class="friend-row">
      <div class="friend-avatar">${f.avatarUrl ? `<img class="avatar-image" src="${escapeHtml(f.avatarUrl)}" alt="" loading="lazy">` : escapeHtml((f.displayName || 'G').slice(0,1).toUpperCase())}</div>
      <div class="friend-main"><strong>${escapeHtml(f.displayName)}</strong><span class="friend-username">@${escapeHtml(f.username || f.userId)}</span><span class="friend-presence ${f.online ? 'online' : 'offline'}"><i></i>${f.online ? t('online') : t('offline')}${unread ? ` · ${unread}` : ''}</span></div>
      <div class="friend-actions">
        <button class="friend-message-btn small-main" data-friend-id="${escapeHtml(f.userId)}" type="button">💬${unread ? ` <span class="direct-unread">${unread > 99 ? '99+' : unread}</span>` : ''}</button>
        <button class="friend-call-btn small-main" data-friend-id="${escapeHtml(f.userId)}" type="button">📹</button>
        <button class="friend-remove-btn friend-danger" data-friend-id="${escapeHtml(f.userId)}" type="button">🗑️</button>
      </div>
    </div>`;
  }).join('') : `<div class="empty-friends">${escapeHtml(t('noFriends'))}</div>`;
  if (friendRequestsEl) {
    const incomingHtml = friendRequests.length ? `<div class="friend-section-title">${escapeHtml(t('incomingRequests'))} <b class="mini-count">${friendRequests.length}</b></div>` + friendRequests.map(r => `<div class="friend-row">
      <div class="friend-avatar">${escapeHtml((r.fromName || 'G').slice(0,1).toUpperCase())}</div>
      <div class="friend-main"><strong>${escapeHtml(r.fromName)}</strong><span class="friend-username">@${escapeHtml(r.fromUsername || r.fromUserId)}</span><span>${escapeHtml(t('pending'))}</span></div>
      <button class="friend-accept small-main" data-request-id="${escapeHtml(r.id)}" data-action="accept" type="button">✅ ${escapeHtml(t('accept'))}</button>
      <button class="friend-decline" data-request-id="${escapeHtml(r.id)}" data-action="decline" type="button">❌ ${escapeHtml(t('decline'))}</button>
    </div>`).join('') : '';
    const outgoingHtml = outgoingFriendRequests.length ? `<div class="friend-section-title">${escapeHtml(t('sentRequests'))} <b class="mini-count">${outgoingFriendRequests.length}</b></div>` + outgoingFriendRequests.map(r => `<div class="friend-row">
      <div class="friend-avatar">${escapeHtml((r.toName || 'G').slice(0,1).toUpperCase())}</div>
      <div class="friend-main"><strong>${escapeHtml(r.toName)}</strong><span class="friend-username">@${escapeHtml(r.toUsername || r.toUserId)}</span><span>${escapeHtml(t('waitingResponse'))}</span></div>
      <button class="friend-cancel" data-request-id="${escapeHtml(r.id)}" type="button">↩️ ${escapeHtml(t('cancelRequest'))}</button>
    </div>`).join('') : '';
    friendRequestsEl.innerHTML = incomingHtml + outgoingHtml || `<div class="empty-friends">${escapeHtml(t('noRequests'))}</div>`;
  }
}
function escapeHtml(value) { const d = document.createElement('div'); d.textContent = String(value ?? ''); return d.innerHTML; }
async function refreshFriends() { const result = await new Promise(resolve => socket.emit('friends-list', resolve)); if (result?.ok) { localUserId = result.user?.userId || localUserId; localStorage.setItem('lutsa_user_id', localUserId); friends = result.friends || []; friendRequests = result.incomingRequests || result.requests || []; outgoingFriendRequests = result.outgoingRequests || []; friendCounts = result.counts || { friends: friends.length, incoming: friendRequests.length, outgoing: outgoingFriendRequests.length }; renderFriends(); } }
async function searchFriends() {
  const q = friendSearchInput?.value.trim() || ''; if (q.length < 2) { friendSearchResults.innerHTML = ''; return; }
  try { const res = await authFetch(`/api/users/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' }); const data = await res.json(); friendSearchResults.innerHTML = (data.users || []).map(u => {
      const status = u.friend ? `<span class="friend-presence online">✓ ${escapeHtml(t('alreadyFriends'))}</span>` : u.outgoing ? `<span>${escapeHtml(t('requestSent'))}</span><button class="friend-cancel" data-request-id="${escapeHtml(u.requestId || '')}" data-user-id="${escapeHtml(u.userId)}" type="button">↩️ ${escapeHtml(t('cancelRequest'))}</button>` : u.incoming ? `<span>${escapeHtml(t('incomingRequest'))}</span>` : `<button class="small-main add-friend-btn" data-user-id="${escapeHtml(u.userId)}" type="button">＋ ${escapeHtml(t('addFriend'))}</button>`;
      return `<div class="friend-row"><div class="friend-avatar">${u.avatarUrl ? `<img class="avatar-image" src="${escapeHtml(u.avatarUrl)}" alt="" loading="lazy">` : escapeHtml((u.displayName || 'G').slice(0,1).toUpperCase())}</div><div class="friend-main"><strong>${escapeHtml(u.displayName)}</strong><span class="friend-username">@${escapeHtml(u.username || u.userId)}</span><span class="friend-presence ${u.online ? 'online' : 'offline'}"><i></i>${u.online ? escapeHtml(t('online')) : escapeHtml(t('offline'))}</span></div><div class="friend-search-actions">${status}</div></div>`;
    }).join('') || `<div class="empty-friends">${escapeHtml(t('userNotFound'))}</div>`; } catch { setStatus(t('unexpected')); }
}
async function waitForSocket(timeoutMs = 8000) {
  if (socket.connected) {
    if (authToken && !socket.__lutsaAuthReady) {
      const result = await registerUser();
      if (!result?.ok) throw new Error(result?.error || 'UNAUTHORIZED');
      socket.__lutsaAuthReady = true;
    }
    return true;
  }
  await new Promise((resolve, reject) => {
    let done = false;
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      fn(value);
    };
    const onConnect = () => finish(resolve);
    const onError = err => finish(reject, err || new Error('SOCKET_CONNECT_FAILED'));
    const timer = setTimeout(() => finish(reject, new Error('SOCKET_TIMEOUT')), timeoutMs);
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });
  if (authToken) {
    const result = await registerUser();
    if (!result?.ok) throw new Error(result?.error || 'UNAUTHORIZED');
    socket.__lutsaAuthReady = true;
  }
  return true;
}

async function quickAddFriend() {
  const q = quickFriendInput?.value.trim() || '';
  if (q.length < 2) { setStatus(t('searchFriends')); quickFriendInput?.focus(); return; }
  try {
    await waitForSocket();
    const res = await authFetch(`/api/users/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    const data = await res.json();
    const results = Array.isArray(data.users) ? data.users : [];
    if (!results.length) return setStatus(t('userNotFound'));
    const exactId = results.find(u => String(u.userId).toLowerCase() === q.toLowerCase());
    const exactName = results.find(u => String(u.displayName).toLowerCase() === q.toLowerCase());
    const target = exactId || exactName || (results.length === 1 ? results[0] : null);
    if (!target) {
      friendSearchInput.value = q;
      await searchFriends();
      friendSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return setStatus(t('search'));
    }
    if (target.friend) { quickFriendInput.value = ''; return setStatus(t('alreadyFriends')); }
    if (target.pending) { quickFriendInput.value = ''; return setStatus(t('requestExists')); }
    socket.timeout(8000).emit('friend-request-send', { toUserId: target.userId }, (err, result) => {
      if (err || !result?.ok) {
        const map = { RATE_LIMITED: 'rateLimited', ALREADY_FRIENDS: 'alreadyFriends', REQUEST_EXISTS: 'requestExists', USER_NOT_FOUND: 'userNotFound' };
        return setStatus(t(map[result?.error] || 'unexpected'));
      }
      quickFriendInput.value = '';
      friendSearchInput.value = '';
      friendSearchResults.innerHTML = '';
      setStatus(t('requestSent'));
      showToast(target.displayName, t('requestSent'));
    });
  } catch (error) {
    const key = error?.message === 'SOCKET_TIMEOUT' ? 'disconnected' : (error?.message === 'UNAUTHORIZED' ? 'authInvalidCredentials' : 'disconnected');
    setStatus(t(key));
  }
}


let feedPosts = [];
let socialNotifications = [];
function relativeSocialTime(ts) {
  const diff = Math.max(0, Date.now() - Number(ts || Date.now())); const mins = Math.floor(diff / 60000);
  if (mins < 1) return currentLang === 'ar' ? 'الآن' : 'Just now';
  if (mins < 60) return currentLang === 'ar' ? `منذ ${mins} د` : `${mins}m`;
  const hours = Math.floor(mins / 60); if (hours < 24) return currentLang === 'ar' ? `منذ ${hours} س` : `${hours}h`;
  const days = Math.floor(hours / 24); return currentLang === 'ar' ? `منذ ${days} ي` : `${days}d`;
}
function storyTimeLabel(ts) {
  return relativeSocialTime(ts);
}
function storyCardHtml(story) {
  const initial = escapeHtml((story.authorName || 'G').slice(0,1).toUpperCase());
  const mediaStyle = story.mediaType === 'image' ? `style="background-image:url('${escapeHtml(story.mediaUrl)}')"` : '';
  const icon = story.mediaType === 'video' ? '<span class="story-video-icon">▶</span>' : '';
  return `<button class="story-item has-story" type="button" data-story-id="${escapeHtml(story.id)}"><span class="story-ring story-preview" ${mediaStyle}>${story.mediaType === 'image' ? '' : initial}</span><small>${escapeHtml(story.authorId === localUserId ? t('yourStory') : (story.authorName || 'Guest'))}</small>${icon}</button>`;
}
function renderStories() {
  if (!storyPeople) return;
  const byAuthor = new Map();
  [...socialStories].sort((a,b) => Number(b.createdAt||0)-Number(a.createdAt||0)).forEach(story => { if (!byAuthor.has(story.authorId)) byAuthor.set(story.authorId, story); });
  const visible = [...byAuthor.values()];
  storyPeople.innerHTML = visible.length ? visible.map(storyCardHtml).join('') : `<div class="story-empty">${escapeHtml(t('noStories'))}</div>`;
  const mine = visible.find(s => s.authorId === localUserId);
  if (storyAddRing) {
    storyAddRing.textContent = mine ? '' : '+';
    storyAddRing.classList.toggle('story-preview', Boolean(mine));
    storyAddRing.style.backgroundImage = mine?.mediaType === 'image' ? `url("${mine.mediaUrl.replace(/"/g,'')}" )` : '';
    storyAddRing.style.backgroundSize = mine ? 'cover' : '';
    storyAddRing.style.backgroundPosition = mine ? 'center' : '';
  }
}
async function loadStories() {
  if (!authReady) return;
  try {
    const res = await authFetch('/api/stories?limit=100', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'STORIES_FAILED');
    socialStories = data.stories || [];
    renderStories();
  } catch (error) {
    socialStories = [];
    renderStories();
  }
}
async function uploadStory(file) {
  if (!file || !authReady) return;
  if (file.size > 15 * 1024 * 1024) return setStatus(t('storyFileTooLarge'));
  const okImage = /^image\/(jpeg|png|webp|gif)$/i.test(file.type);
  const okVideo = /^video\/(mp4|webm)$/i.test(file.type);
  if (!okImage && !okVideo) return setStatus(t('storyFileType'));
  setStatus(t('storyUploading'));
  storyAddBtn?.setAttribute('aria-busy','true');
  const formData = new FormData(); formData.append('story', file);
  try {
    const res = await authFetch('/api/stories', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'STORY_UPLOAD_FAILED');
    await loadStories();
    setStatus(t('storyUploaded'));
    showToast(localName, t('storyUploaded'));
    if (storyViewer && data.story) openStoryViewer(data.story.id);
  } catch (error) {
    setStatus(error.message === 'STORY_FILE_TYPE_NOT_ALLOWED' ? t('storyFileType') : error.message === 'RATE_LIMITED' ? t('rateLimited') : t('storyUploadFailed'));
  } finally {
    storyAddBtn?.removeAttribute('aria-busy');
    if (storyInput) storyInput.value = '';
  }
}
function openStoryViewer(storyId) {
  const story = socialStories.find(s => s.id === storyId);
  if (!story || !storyViewerMedia) return;
  storyViewerName.textContent = story.authorName || 'Guest';
  storyViewerTime.textContent = storyTimeLabel(story.createdAt);
  storyViewerAvatar.textContent = (story.authorName || 'G').slice(0,1).toUpperCase();
  storyViewerAvatar.style.backgroundImage = story.avatarUrl ? `url("${String(story.avatarUrl).replace(/"/g,'')}" )` : '';
  storyViewerMedia.innerHTML = story.mediaType === 'video' ? `<video src="${escapeHtml(story.mediaUrl)}" controls autoplay playsinline></video>` : `<img src="${escapeHtml(story.mediaUrl)}" alt="${escapeHtml(story.authorName || 'Story')}">`;
  storyViewer.classList.remove('hidden');
  document.body.classList.add('story-view-open');
}
function closeStoryViewer() {
  storyViewer?.classList.add('hidden');
  document.body.classList.remove('story-view-open');
  if (storyViewerMedia) storyViewerMedia.innerHTML = '';
}

function feedPostHtml(post) {
  const mine = post.authorId === localUserId, comments = post.comments || [];
  const visibility = post.visibility === 'friends' ? t('friendsLabel') : t('publicLabel');
  return `<article class="social-post" data-post-id="${escapeHtml(post.id)}"><div class="post-header"><div class="mini-avatar avatar-blue">${escapeHtml((post.authorName || 'G').slice(0,1).toUpperCase())}</div><div class="post-meta"><strong>${escapeHtml(post.authorName)}</strong><span>${escapeHtml(visibility)} · ${relativeSocialTime(post.createdAt)}</span></div>${mine ? `<button class="more-btn post-menu-btn" type="button" data-post-id="${escapeHtml(post.id)}">•••</button>` : ''}</div><div class="social-post-text">${escapeHtml(post.text).replace(/\n/g, '<br>')}</div><div class="engagement-row"><span>♥ ${post.likesCount || 0}</span><span>💬 ${comments.length}</span></div><div class="post-actions"><button type="button" class="post-like-btn ${post.liked ? 'liked' : ''}" data-post-id="${escapeHtml(post.id)}">${post.liked ? '♥' : '♡'} ${post.liked ? escapeHtml(t('unlike')) : escapeHtml(t('like'))}</button><button type="button" class="post-comment-focus" data-post-id="${escapeHtml(post.id)}">💬 ${escapeHtml(t('comment'))}</button><button type="button" class="post-share-btn" data-post-id="${escapeHtml(post.id)}">↗ ${escapeHtml(t('share'))}</button></div><div class="post-comments"><div class="comment-list">${comments.map(c => `<div class="comment-item"><div class="comment-avatar">${escapeHtml((c.userName || 'G').slice(0,1).toUpperCase())}</div><div class="comment-body"><strong>${escapeHtml(c.userName)}</strong><span>${escapeHtml(c.text)}</span><small>${relativeSocialTime(c.createdAt)}</small></div></div>`).join('')}</div><form class="comment-form"><input maxlength="500" placeholder="${escapeHtml(t('commentPlaceholder'))}"><button type="submit">${escapeHtml(t('addComment'))}</button></form></div>${mine ? `<button class="post-delete-link" type="button" data-post-id="${escapeHtml(post.id)}">${escapeHtml(t('deletePost'))}</button>` : ''}</article>`;
}
function renderFeed() { if (feedList) feedList.innerHTML = feedPosts.length ? feedPosts.map(feedPostHtml).join('') : `<div class="empty-friends">${escapeHtml(t('noPosts'))}</div>`; }
async function loadFeed() {
  if (!authReady || !feedList) return; feedList.innerHTML = `<div class="feed-loading">${escapeHtml(t('loadingFeed'))}</div>`;
  try { const res = await authFetch('/api/feed?limit=30', { cache: 'no-store' }); const data = await res.json(); if (!res.ok || !data.ok) throw new Error('FEED_FAILED'); feedPosts = data.posts || []; renderFeed(); }
  catch { feedList.innerHTML = `<div class="empty-friends">${escapeHtml(t('postFailed'))}</div>`; }
}
async function publishPost(e) {
  e?.preventDefault(); const text = postText?.value.trim() || ''; if (!text) return setStatus(t('postEmpty'));
  const btn = $('createPostBtn'); if (btn) btn.disabled = true;
  try { const res = await authFetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, visibility: postVisibility?.value || 'public' }) }); const data = await res.json(); if (!res.ok || !data.ok) throw new Error(); postText.value = ''; feedPosts = [data.post, ...feedPosts].slice(0,30); renderFeed(); setStatus(t('postPublished')); }
  catch { setStatus(t('postFailed')); } finally { if (btn) btn.disabled = false; }
}
async function togglePostLike(postId) {
  try { const res = await authFetch(`/api/posts/${encodeURIComponent(postId)}/like`, { method: 'POST' }); const data = await res.json(); if (!res.ok || !data.ok) throw new Error(); const i = feedPosts.findIndex(p => p.id === postId); if (i >= 0) feedPosts[i] = data.post; renderFeed(); }
  catch { setStatus(t('unexpected')); }
}
async function addPostComment(postId, text) {
  if (!(text || '').trim()) return;
  try { const res = await authFetch(`/api/posts/${encodeURIComponent(postId)}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text.trim() }) }); const data = await res.json(); if (!res.ok || !data.ok) throw new Error(); const i = feedPosts.findIndex(p => p.id === postId); if (i >= 0) feedPosts[i] = data.post; renderFeed(); }
  catch { setStatus(t('unexpected')); }
}
async function deletePost(postId) {
  if (!confirm(t('confirmDeletePost'))) return;
  try { const res = await authFetch(`/api/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' }); const data = await res.json(); if (!res.ok || !data.ok) throw new Error(); feedPosts = feedPosts.filter(p => p.id !== postId); renderFeed(); }
  catch { setStatus(t('unexpected')); }
}
async function sharePost(postId) {
  const url = `${location.origin}/?post=${encodeURIComponent(postId)}`;
  try { if (navigator.share) await navigator.share({ title: 'Lutsa vidcall', url }); else await navigator.clipboard.writeText(url); setStatus(t('copied')); } catch {}
}
function notificationText(n) { const actor = escapeHtml(n.actorName || t('otherParty')); if (n.type === 'like') return `♥ ${actor} ${escapeHtml(t('notificationLike'))}`; if (n.type === 'comment') return `💬 ${actor} ${escapeHtml(t('notificationComment'))}${n.text ? `: ${escapeHtml(n.text)}` : ''}`; if (n.type === 'friend_request') return `➕ ${actor} ${escapeHtml(t('newFriendRequest'))}`; if (n.type === 'friend_accepted') return `✅ ${actor} ${escapeHtml(t('requestAccepted'))}`; if (n.type === 'friend_declined') return `❌ ${actor} ${escapeHtml(t('requestDeclined'))}`; if (n.type === 'friend_request_cancelled') return `↩️ ${actor} ${escapeHtml(t('requestCancelled'))}`; if (n.type === 'friend_removed') return `🗑️ ${actor} ${escapeHtml(t('friendRemoved'))}`; return actor; }
function renderNotifications() { if (!notificationsList) return; const unread = socialNotifications.filter(n => !n.read).length; if (notificationsSummary) notificationsSummary.textContent = unread ? `${unread}` : ''; notificationsNavBtn?.classList.toggle('notification-has-unread', unread > 0); notificationsList.innerHTML = socialNotifications.length ? socialNotifications.map(n => `<button class="notification-row ${n.read ? '' : 'unread'}" type="button" data-notification-id="${escapeHtml(n.id)}"><div class="notification-icon">${n.type === 'like' ? '♥' : '💬'}</div><div><strong>${notificationText(n)}</strong><span>${relativeSocialTime(n.createdAt)}</span></div></button>`).join('') : `<div class="empty-friends">${escapeHtml(t('noNotifications'))}</div>`; }
async function loadNotifications() { if (!authReady) return; try { const res = await authFetch('/api/notifications', { cache: 'no-store' }); const data = await res.json(); if (res.ok && data.ok) { socialNotifications = data.notifications || []; renderNotifications(); } } catch {} }
async function markAllNotificationsRead() { try { const res = await authFetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); if (res.ok) { socialNotifications = socialNotifications.map(n => ({ ...n, read: true })); renderNotifications(); } } catch {} }
async function markOneNotificationRead(id) { try { await authFetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const n = socialNotifications.find(x => x.id === id); if (n) n.read = true; renderNotifications(); } catch {} }
async function openProfileCard() {
  if (!authReady) return; notificationsCard?.classList.add('hidden'); profileCard?.classList.remove('hidden'); profileDisplayName.value = localName || ''; profileBio.value = ''; showProfileAvatarStatus();
  try { const res = await authFetch(`/api/profile/${encodeURIComponent(localUserId)}`, { cache: 'no-store' }); const data = await res.json(); if (res.ok && data.ok) { profileDisplayName.value = data.profile.user.displayName || ''; profileBio.value = data.profile.user.bio || ''; profileFriendsCount.textContent = data.profile.friendsCount || 0; profilePostsCount.textContent = data.profile.postsCount || 0; setAuthenticatedUser(data.profile.user); } } catch {}
  profileCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function saveProfile(e) {
  e?.preventDefault(); try { const res = await authFetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: profileDisplayName.value.trim(), bio: profileBio.value.trim() }) }); const data = await res.json(); if (!res.ok || !data.ok) throw new Error(); setAuthenticatedUser(data.user); profileCard?.classList.add('hidden'); setStatus(t('profileSaved')); }
  catch { setStatus(t('unexpected')); }
}
async function initSocialData() { await Promise.all([refreshFriends(), loadFeed(), loadNotifications(), loadStories()]); }

function openDirectMessages(friend) {
  activeDirectFriend = friend;
  directUnread[friend.userId] = 0;
  renderFriends(); directMessagesCard?.classList.remove('hidden'); if (directChatFriendLabel) directChatFriendLabel.textContent = friend.displayName;
  new Promise(resolve => socket.emit('direct-history', { withUserId: friend.userId }, resolve)).then(result => { if (result?.ok) { directMessagesEl.innerHTML = ''; (result.messages || []).forEach(m => addDirectMessage(m)); directMessagesEl.scrollTop = directMessagesEl.scrollHeight; } else setStatus(t('unexpected')); });
}
function addDirectMessage(msg) { if (!directMessagesEl || !msg) return; const mine = msg.fromUserId === localUserId; const el = document.createElement('div'); el.className = `message ${mine ? 'mine' : ''}`; const body = document.createElement('div'); body.className='message-body'; body.textContent = msg.text || ''; const time=document.createElement('div'); time.className='message-time'; time.textContent=formatMessageTime(msg.timestamp); el.appendChild(body); el.appendChild(time); directMessagesEl.appendChild(el); directMessagesEl.scrollTop=directMessagesEl.scrollHeight; }

async function callFriend(friend) {
  if (!friend?.userId) return;
  try {
    await waitForSocket();
    socket.emit('create-room', {}, async result => {
      if (!result?.ok) return setStatus(result?.error === 'RATE_LIMITED' ? t('rateLimited') : t('cannotJoin'));
      const roomUrl = `${location.origin}/?room=${encodeURIComponent(result.roomId)}`;
      socket.timeout(8000).emit('direct-message', { toUserId: friend.userId, text: roomUrl }, async (err, reply) => {
        if (err || !reply?.ok) return setStatus(reply?.error === 'RATE_LIMITED' ? t('rateLimited') : t('directMessageFailed'));
        setStatus(t('friendCallSent'));
        await joinRoom(result.roomId);
      });
    });
  } catch { setStatus(t('disconnected')); }
}

function setStatus(text) { statusEl.textContent = text; }
function setNetwork(text, kind = '') { networkState.textContent = text; networkDot.className = `dot ${kind}`; }
function formatDuration(ms) { const total = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`; }
function formatMessageTime(ts) { return new Date(ts).toLocaleTimeString(currentLang === 'ar' ? 'ar-EG' : currentLang === 'cs' ? 'cs-CZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }); }
function formatBytes(bytes) { if (!bytes) return '0 B'; const units = ['B','KB','MB','GB']; const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)} ${units[i]}`; }
function isSecureContextRequired() { return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'; }

async function loadConfig() {
  const res = await fetch('/api/config', { cache: 'no-store' });
  if (!res.ok) throw new Error('CONFIG_FAILED');
  config = await res.json();
}

function setIceServers(iceServers) {
  const incoming = Array.isArray(iceServers) ? iceServers.filter(item => item && item.urls) : [];
  const current = Array.isArray(config.iceServers) ? config.iceServers : [];
  const seen = new Set();
  config.iceServers = [...current, ...incoming].filter(item => {
    const urls = Array.isArray(item.urls) ? item.urls.join('|') : String(item.urls || '');
    const key = `${urls}|${item.username || ''}`;
    if (!urls || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function applyTurnSession(turn, { restart = true } = {}) {
  if (!turn) return;
  if (Array.isArray(turn.iceServers)) setIceServers(turn.iceServers);
  if (turn.status === 'ready' && Array.isArray(turn.iceServers) && turn.iceServers.length) {
    turnReady = true;
    if (turnStateEl) turnStateEl.textContent = t('turnReady');
    if (pc) {
      try {
        const connected = ['connected', 'completed'].includes(pc.iceConnectionState);
        pc.setConfiguration({ ...pc.getConfiguration(), iceServers: config.iceServers });
        if (restart && !connected && remoteSocketId) {
          scheduleIceRestart(t('reconnecting'));
        }
      } catch (error) {
        console.warn('[TURN CONFIG]', error);
      }
    }
    return;
  }
  if (turn.status === 'preparing' || turn.status === 'creating') {
    turnReady = false;
    if (turnStateEl) turnStateEl.textContent = t('turnPreparing');
  } else if (turn.status === 'error' || turn.status === 'disabled') {
    turnReady = false;
    if (turnStateEl) turnStateEl.textContent = t('turnUnavailable');
  }
}

async function ensureLocalMedia(constraints = null) {
  if (localStream && !constraints) return localStream;
  if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
  localStream = await navigator.mediaDevices.getUserMedia(constraints || {
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 360 }, frameRate: { ideal: 30, max: 30 } }
  });
  audioTrack = localStream.getAudioTracks()[0] || null;
  cameraTrack = localStream.getVideoTracks()[0] || null;
  localVideo.srcObject = localStream;
  await localVideo.play().catch(() => {});
  localLabel.textContent = localName;
  applyLanguage(currentLang);
  return localStream;
}
function resetMediaReferences() { audioTrack = localStream?.getAudioTracks?.()[0] || null; cameraTrack = localStream?.getVideoTracks?.()[0] || null; }

function closePeer(keepLocal = true) {
  if (statsHandle) clearInterval(statsHandle);
  statsHandle = null;
  if (pc) {
    pc.ontrack = null; pc.onicecandidate = null; pc.onconnectionstatechange = null; pc.oniceconnectionstatechange = null;
    pc.onsignalingstatechange = null; pc.onnegotiationneeded = null; pc.onicecandidateerror = null; pc.close(); pc = null;
  }
  remoteSocketId = null; remoteStream = null; remoteVideo.srcObject = null; remotePlaceholder.classList.remove('hidden'); remotePlaceholder.textContent = t('waitingPeer');
  candidateTypeEl.textContent = '—'; qualityState.textContent = '—'; bitrateState.textContent = '—'; iceStateEl.textContent = 'new'; if (turnStateEl) turnStateEl.textContent = turnReady ? t('turnReady') : (config.turnMode === 'metered-dynamic' ? t('turnPreparing') : '—'); if (!keepLocal) turnReady = false; setNetwork(t('waiting')); showRemoteAudioUnlock(false);
  if (!keepLocal && localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
}

function showRemoteAudioUnlock(show) {
  if (!remoteAudioButton) return;
  remoteAudioButton.textContent = t('enableRemoteAudio');
  remoteAudioButton.classList.toggle('hidden', !show);
  remoteAudioButton.setAttribute('aria-hidden', show ? 'false' : 'true');
}

async function enableRemoteAudio() {
  try {
    remoteVideo.muted = false;
    remoteVideo.volume = 1;
    if (audioContext?.state === 'suspended') await audioContext.resume();
    await remoteVideo.play();
    remoteAudioNeedsGesture = false;
    showRemoteAudioUnlock(false);
    setStatus(t('callConnected'));
  } catch (error) {
    remoteAudioNeedsGesture = true;
    showRemoteAudioUnlock(true);
    console.warn('[REMOTE AUDIO]', error?.name || error);
  }
}

function attachPeerEvents() {
  pc.ontrack = async event => {
    if (!remoteStream) remoteStream = new MediaStream();
    const tracks = event.streams?.[0]?.getTracks?.() || [event.track];
    for (const track of tracks) if (!remoteStream.getTracks().some(t => t.id === track.id)) remoteStream.addTrack(track);
    remoteVideo.srcObject = remoteStream;
    remoteVideo.muted = false;
    remoteVideo.volume = 1;
    remotePlaceholder.classList.add('hidden');
    $('remoteAudioBadge').textContent = remoteStream.getAudioTracks().length ? t('voice') : t('noAudio');
    try {
      await remoteVideo.play();
      remoteAudioNeedsGesture = false;
      showRemoteAudioUnlock(false);
    } catch (error) {
      remoteAudioNeedsGesture = true;
      showRemoteAudioUnlock(true);
      setStatus(t('autoplay'));
    }
  };
  pc.onicecandidate = event => socket.emit('ice-candidate', { candidate: event.candidate ? event.candidate.toJSON() : null });
  pc.onicecandidateerror = e => console.warn('[ICE ERROR]', e.url, e.errorCode, e.errorText);
  pc.oniceconnectionstatechange = () => {
    if (!pc) return;
    const state = pc.iceConnectionState; iceStateEl.textContent = state;
    if (state === 'connected' || state === 'completed') { setNetwork(t('callConnected'), 'ok'); reconnectAttempt = 0; }
    else if (state === 'checking') setNetwork(t('checking'), 'warn');
    else if (state === 'failed') { setNetwork(t('failedRetry'), 'bad'); scheduleIceRestart(t('failedRetry')); }
    else if (state === 'disconnected') { setNetwork(t('temporaryDisconnect'), 'warn'); scheduleIceRestart(t('temporaryDisconnect')); }
  };
  pc.onconnectionstatechange = () => { if (pc?.connectionState === 'connected') setStatus(t('callConnected')); if (pc?.connectionState === 'failed') scheduleIceRestart(t('failedRetry')); };
  pc.onsignalingstatechange = () => {};
  pc.onnegotiationneeded = async () => {
    if (!pc || makingOffer || !remoteSocketId || !isPolite) return;
    try { makingOffer = true; const offer = await pc.createOffer(); if (pc.signalingState !== 'stable') return; await pc.setLocalDescription(offer); socket.emit('renegotiate-offer', { description: pc.localDescription }); }
    catch (err) { console.error('[RENEGOTIATION]', err); } finally { makingOffer = false; }
  };
}

async function createPeer() {
  closePeer(true);
  pc = new RTCPeerConnection({ iceServers: config.iceServers || [], iceTransportPolicy: 'all', bundlePolicy: 'max-bundle', rtcpMuxPolicy: 'require' });
  remoteStream = new MediaStream(); remoteVideo.srcObject = remoteStream;
  for (const track of localStream.getTracks()) pc.addTrack(track, localStream);
  attachPeerEvents(); startStatsLoop();
}
async function flushRemoteCandidates() { if (!pc?.remoteDescription) return; const items = remoteCandidateQueue.splice(0); for (const item of items) { try { await pc.addIceCandidate(item); } catch {} } }
async function startCallAsCaller() {
  if (!pc || !remoteSocketId) return;
  try { makingOffer = true; const offer = await pc.createOffer(); await pc.setLocalDescription(offer); socket.emit('offer', { description: pc.localDescription }); setStatus(t('preparing')); }
  catch (err) { setStatus(err?.message || t('unexpected')); } finally { makingOffer = false; }
}

async function joinRoom(roomId) {
  currentRoom = String(roomId || '').trim().toUpperCase(); localName = String(displayNameEl.value || 'Guest').trim() || 'Guest';
  if (!currentRoom) return setStatus(t('invalidRoom'));
  if (!navigator.mediaDevices?.getUserMedia) return setStatus(t('permission'));
  if (!isSecureContextRequired()) setStatus(t('https'));
  setStatus(t('mediaPreparing'));
  try { await ensureLocalMedia(); await loadConfig(); } catch { return setStatus(t('permission')); }

  socket.emit('join-room', { roomId: currentRoom, displayName: localName }, async result => {
    if (!result?.ok) return setStatus(result?.error === 'ROOM_FULL' ? t('roomFull') : t('cannotJoin'));
    lobby.classList.add('hidden'); call.classList.remove('hidden'); roomLabel.textContent = currentRoom; localLabel.textContent = localName;
    callStartedAt = Date.now(); if (timerHandle) clearInterval(timerHandle); timerHandle = setInterval(() => $('callTimer').textContent = formatDuration(Date.now() - callStartedAt), 1000);
    history.replaceState(null, '', `/?room=${encodeURIComponent(currentRoom)}`); remoteCandidateQueue = []; isPolite = !result.isCaller;
    messagesEl.innerHTML = ''; setUnreadCount(0); (result.history || []).forEach(msg => addMessage(msg, { notify: false }));
    document.title = I18N[currentLang]?.appName || 'Lutsa vidcall';
    if (pushSubscription) await syncPushSubscription();
    await createPeer();
    await applyTurnSession(result.turn, { restart: false });
    if (result.hasPeer) {
      remoteSocketId = result.peer?.socketId || 'peer'; remoteLabel.textContent = result.peer?.displayName || t('otherParty');
      setStatus(result.isCaller ? t('foundPeer') : t('joined')); if (result.isCaller) await startCallAsCaller();
    } else { remoteLabel.textContent = t('otherParty'); setStatus(t('shareRoom')); }
  });
}

function scheduleIceRestart(reason = '') {
  if (pendingRestart || !pc || !remoteSocketId) return; pendingRestart = true; reconnectAttempt += 1;
  const delay = Math.min(800 * reconnectAttempt, 4000);
  setTimeout(async () => { pendingRestart = false; if (!pc || !remoteSocketId) return; try { pc.restartIce(); makingOffer = true; const offer = await pc.createOffer({ iceRestart: true }); await pc.setLocalDescription(offer); socket.emit('offer', { description: pc.localDescription, iceRestart: true }); setStatus(reason || t('reconnecting')); } catch {} finally { makingOffer = false; } }, delay);
}

async function handleOffer(description, renegotiate = false) {
  if (!pc || !description) return;
  const offerCollision = makingOffer || pc.signalingState !== 'stable'; ignoreOffer = !isPolite && offerCollision; if (ignoreOffer) return;
  try { await pc.setRemoteDescription(description); await flushRemoteCandidates(); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); socket.emit(renegotiate ? 'renegotiate-answer' : 'answer', { description: pc.localDescription }); }
  catch (err) { if (pc.signalingState !== 'closed') setStatus(t('unexpected')); }
}
async function replaceVideoTrack(newTrack) { if (!pc || !newTrack) return; const sender = pc.getSenders().find(s => s.track?.kind === 'video'); if (sender) await sender.replaceTrack(newTrack); }

async function startScreenShare() {
  if (!navigator.mediaDevices?.getDisplayMedia) return setStatus(t('screenUnsupported'));
  try { screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 } }, audio: false }); screenTrack = screenStream.getVideoTracks()[0]; await replaceVideoTrack(screenTrack); localVideo.srcObject = screenStream; $('screenBtn').textContent = t('stopShare'); screenTrack.addEventListener('ended', stopScreenShare, { once: true }); setStatus(t('screenOn')); }
  catch (err) { if (err?.name !== 'NotAllowedError') console.warn('[SCREEN]', err); }
}
async function stopScreenShare() { if (!screenTrack) return; screenTrack.stop(); screenTrack = null; screenStream?.getTracks?.().forEach(t => t.stop()); screenStream = null; resetMediaReferences(); if (cameraTrack) await replaceVideoTrack(cameraTrack); localVideo.srcObject = localStream; $('screenBtn').textContent = t('shareScreen'); setStatus(t('cameraBack')); }

async function refreshDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const devices = await navigator.mediaDevices.enumerateDevices();
  const fills = [['cameraSelect', devices.filter(d => d.kind === 'videoinput'), t('camera')], ['micSelect', devices.filter(d => d.kind === 'audioinput'), t('microphone')], ['speakerSelect', devices.filter(d => d.kind === 'audiooutput'), t('speaker')]];
  for (const [id, items, label] of fills) { const el = $(id); if (!el) continue; const old = el.value; el.innerHTML = ''; items.forEach((d, i) => { const option = document.createElement('option'); option.value = d.deviceId; option.textContent = d.label || `${label} ${i + 1}`; el.appendChild(option); }); if ([...el.options].some(o => o.value === old)) el.value = old; }
}
async function switchCamera(deviceId) {
  if (!deviceId || !localStream) return;
  try {
    const next = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    const nextTrack = next.getVideoTracks()[0];
    const oldTrack = localStream.getVideoTracks()[0];
    if (!screenTrack) await replaceVideoTrack(nextTrack);
    if (oldTrack) { localStream.removeTrack(oldTrack); oldTrack.stop(); }
    localStream.addTrack(nextTrack);
    cameraTrack = nextTrack;
    if (!screenTrack) localVideo.srcObject = localStream;
    setStatus(t('cameraChanged'));
    await refreshDevices();
  } catch (err) {
    console.error(err);
    setStatus(t('cameraUnsupported'));
  }
}

async function switchMicrophone(deviceId) {
  if (!deviceId || !localStream) return;
  try {
    const next = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    const nextTrack = next.getAudioTracks()[0];
    const sender = pc?.getSenders?.().find(s => s.track?.kind === 'audio');
    if (sender) await sender.replaceTrack(nextTrack);
    const oldTrack = localStream.getAudioTracks()[0];
    if (oldTrack) { localStream.removeTrack(oldTrack); oldTrack.stop(); }
    localStream.addTrack(nextTrack);
    audioTrack = nextTrack;
    setStatus(t('micChanged'));
    await refreshDevices();
  } catch (err) {
    console.error(err);
    setStatus(t('micUnsupported'));
  }
}
async function setOutputDevice(deviceId) {
  if (!deviceId || !remoteVideo.setSinkId) return setStatus(t('speakerUnsupported'));
  try { await remoteVideo.setSinkId(deviceId); setStatus(t('speakerChanged')); } catch {}
}

async function collectStats() {
  if (!pc || pc.connectionState === 'closed') return;
  try { const stats = await pc.getStats(); let selectedPair = null; let inboundVideo = null; stats.forEach(r => { if (r.type === 'candidate-pair' && r.state === 'succeeded' && (r.nominated || r.selected)) selectedPair = r; if (r.type === 'inbound-rtp' && (r.kind === 'video' || r.mediaType === 'video')) inboundVideo = r; }); if (!selectedPair) stats.forEach(r => { if (r.type === 'candidate-pair' && r.state === 'succeeded' && !selectedPair) selectedPair = r; }); if (selectedPair) { const local = stats.get(selectedPair.localCandidateId); const remote = stats.get(selectedPair.remoteCandidateId); const type = local?.candidateType || remote?.candidateType; candidateTypeEl.textContent = type === 'relay' ? t('relay') : type === 'srflx' ? t('direct') : (type || '—'); } if (inboundVideo) { const fps = Math.round(inboundVideo.framesPerSecond || 0); const width = inboundVideo.frameWidth || 0; const height = inboundVideo.frameHeight || 0; qualityState.textContent = width && height ? `${width}×${height} • ${fps}fps` : '—'; const bytes = inboundVideo.bytesReceived || 0; const now = performance.now(); if (lastStatsAt) { const mbps = ((bytes - lastBytes) * 8 / (now - lastStatsAt)) / 1000; bitrateState.textContent = Number.isFinite(mbps) ? `${mbps.toFixed(1)} Mbps` : '—'; } lastBytes = bytes; lastStatsAt = now; } } catch {}
}
function startStatsLoop() { if (statsHandle) clearInterval(statsHandle); lastBytes = 0; lastStatsAt = 0; statsHandle = setInterval(collectStats, 2500); }

function endCallToLobby(message = null) {
  if (currentRoom) socket.emit('hangup');
  if (currentRoom) socket.emit('leave-room');
  if (timerHandle) clearInterval(timerHandle); timerHandle = null; if (screenTrack) stopScreenShare(); closePeer(false); call.classList.add('hidden'); lobby.classList.remove('hidden'); $('callTimer').textContent = '00:00'; setStatus(message || t('ready')); history.replaceState(null, '', '/'); currentRoom = ''; messagesEl.innerHTML = '';
}

function setUnreadCount(count) {
  unreadCount = Math.max(0, Number(count) || 0);
  if (!unreadBadge) return;
  unreadBadge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
  unreadBadge.classList.toggle('hidden', unreadCount === 0);
  const mobileUnreadBadge = $('mobileUnreadBadge');
  if (mobileUnreadBadge) {
    mobileUnreadBadge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    mobileUnreadBadge.classList.toggle('hidden', unreadCount === 0);
  }
}
function markChatRead() { setUnreadCount(0); }
function showToast(title, text) {
  if (!toastContainer) return;
  const el = document.createElement('div'); el.className = 'toast';
  const strong = document.createElement('strong'); strong.textContent = title;
  const small = document.createElement('small'); small.textContent = text || '';
  el.append(strong, small); toastContainer.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 260); }, 5000);
}
function playProfessionalMessageSound() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    const master = audioContext.createGain(); master.gain.setValueAtTime(0.0001, now); master.gain.exponentialRampToValueAtTime(0.085, now + 0.015); master.gain.exponentialRampToValueAtTime(0.0001, now + 0.65); master.connect(audioContext.destination);
    [659.25, 783.99, 987.77].forEach((freq, i) => { const osc = audioContext.createOscillator(); const gain = audioContext.createGain(); osc.type = 'sine'; osc.frequency.value = freq; const start = now + i * 0.08; gain.gain.setValueAtTime(0.0001, start); gain.gain.exponentialRampToValueAtTime(0.42, start + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28); osc.connect(gain).connect(master); osc.start(start); osc.stop(start + 0.3); });
  } catch {}
}
function messagePreview(msg) {
  if (msg?.kind === 'file') {
    if (String(msg.file?.type || '').startsWith('image/')) return `🖼️ ${t('image')}`;
    if (String(msg.file?.type || '').startsWith('audio/')) return `🎙️ ${t('audio')}`;
    return `📎 ${msg.file?.name || t('file')}`;
  }
  return String(msg?.text || t('notificationTitle')).slice(0, 120);
}
function notifyIncomingMessage(msg) {
  if (!msg || msg.senderSocketId === socket.id) return;
  if (msg.id && msg.id === lastNotifiedMessageId) return;
  lastNotifiedMessageId = msg.id || '';
  setUnreadCount(unreadCount + 1);
  playProfessionalMessageSound();
  showToast(msg.senderName || t('otherParty'), messagePreview(msg));
  if (document.title) document.title = `(${unreadCount}) ${t('notificationTitle')} • ${I18N[currentLang]?.appName || 'CrossCall'}`;
}
async function initExistingPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    pushRegistration ||= await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    if (Notification.permission === 'granted') pushSubscription = await pushRegistration.pushManager.getSubscription();
  } catch {}
}
async function enablePushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return setStatus(t('notificationsDenied'));
  if (!isSecureContextRequired()) return setStatus(t('notificationsSecure'));
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return setStatus(t('notificationsDenied'));
    pushRegistration ||= await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    const key = await fetch('/api/push/public-key', { cache: 'no-store' }).then(r => r.json());
    if (!key?.publicKey) throw new Error('PUSH_KEY_MISSING');
    const applicationServerKey = Uint8Array.from(atob(key.publicKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    pushSubscription = await pushRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    await syncPushSubscription(true);
    notificationReady = true;
    notificationsBtn.textContent = '✅'; notificationsBtn.title = t('notificationsOn');
    setStatus(t('notificationsOn'));
  } catch (error) { console.error('[PUSH ENABLE]', error); setStatus(t('notificationsDenied')); }
}
async function syncPushSubscription(force = false) {
  if (!pushSubscription || !currentRoom) return;
  const payload = { roomId: currentRoom, socketId: socket.id, displayName: localName, lang: currentLang, subscription: pushSubscription.toJSON() };
  await fetch('/api/push/subscribe', { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload) }).then(r => { if (!r.ok) throw new Error('SUBSCRIBE_FAILED'); }).catch(() => {});
  socket.emit('push-subscription-socket', { endpoint: pushSubscription.endpoint, visible: !document.hidden });
}
async function updatePushVisibility() {
  if (!pushSubscription) return;
  socket.emit('push-visibility', { endpoint: pushSubscription.endpoint, visible: !document.hidden });
  await syncPushSubscription(false);
}
async function downloadChatHistory() {
  if (!currentRoom) return;
  try {
    const res = await fetch('/api/chat-history/download', { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ roomId: currentRoom, socketId: socket.id }) });
    const data = await res.json(); if (!res.ok || !data.ok) throw new Error(data.error || 'DOWNLOAD_FAILED');
    if (!data.history?.length) return setStatus(t('chatDownloadEmpty'));
    const lines = data.history.map(m => `[${formatMessageTime(m.timestamp)}] ${m.senderName || 'Guest'}: ${messagePreview(m)}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `chat-${currentRoom}-${new Date().toISOString().slice(0,10)}.txt`; a.click(); URL.revokeObjectURL(a.href);
    setStatus(t('chatDownloaded'));
  } catch (error) { console.error('[CHAT DOWNLOAD]', error); setStatus(t('uploadFailed')); }
}

function addMessage(msg, { notify = false } = {}) {
  if (!msg || !messagesEl) return;
  const el = document.createElement('div'); const mine = msg.senderSocketId === socket.id; el.className = `message ${mine ? 'mine' : ''}`;
  const name = document.createElement('div'); name.className = 'message-name'; name.textContent = mine ? t('yourMessages') : (msg.senderName || t('otherParty'));
  const body = document.createElement('div'); body.className = 'message-content';
  if (msg.kind === 'file' && msg.file) {
    const type = String(msg.file.type || '');
    if (type.startsWith('image/')) {
      const image = document.createElement('img'); image.className = 'chat-image'; image.src = msg.file.url; image.alt = msg.file.name; image.loading = 'lazy'; image.addEventListener('click', () => window.open(msg.file.url, '_blank', 'noopener')); body.appendChild(image);
    } else if (type.startsWith('audio/')) {
      const audio = document.createElement('audio'); audio.className = 'chat-audio'; audio.controls = true; audio.preload = 'metadata'; audio.src = msg.file.url; body.appendChild(audio);
    }
    if (msg.text) { const caption = document.createElement('div'); caption.className = 'message-text'; caption.textContent = msg.text; body.appendChild(caption); }
    const link = document.createElement('a'); link.className = 'file-link'; link.href = msg.file.url; link.target = '_blank'; link.rel = 'noopener'; link.download = msg.file.name; link.textContent = `⬇️ ${msg.file.name} • ${formatBytes(msg.file.size)}`; body.appendChild(link);
  } else {
    const text = document.createElement('div'); text.className = 'message-text'; text.textContent = msg.text || ''; body.appendChild(text);
  }
  const time = document.createElement('div'); time.className = 'message-time'; time.textContent = formatMessageTime(msg.timestamp || Date.now()); el.append(name, body, time); messagesEl.appendChild(el); messagesEl.scrollTop = messagesEl.scrollHeight;
  if (notify) notifyIncomingMessage(msg);
}

async function uploadFile(file) {
  if (!file || !currentRoom) return;
  const max = Number(config.maxFileSize || 25 * 1024 * 1024);
  if (file.size > max) return setStatus(t('maxFile', { size: Math.round(max / 1024 / 1024) }));
  setStatus(t('uploading'));
  const form = new FormData(); form.append('file', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', headers: authHeaders({ 'X-Room-Id': currentRoom, 'X-Socket-Id': socket.id }), body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'UPLOAD_FAILED');
    setStatus(t('uploaded'));
  } catch (err) { console.error('[UPLOAD]', err); setStatus(err.message === 'FILE_TOO_LARGE' ? t('maxFile', { size: Math.round(max / 1024 / 1024) }) : err.message === 'FILE_TYPE_NOT_ALLOWED' ? t('fileType') : err.message === 'RATE_LIMITED' ? t('rateLimited') : t('uploadFailed')); }
}

function chooseRecordingMime() {
  if (!window.MediaRecorder) return '';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return types.find(type => MediaRecorder.isTypeSupported?.(type)) || '';
}
async function toggleAudioRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); return; }
  if (!window.MediaRecorder) return setStatus(t('noBrowserRecord'));
  if (!audioTrack) { try { await ensureLocalMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); } catch { return setStatus(t('audioFailed')); } }
  const mimeType = chooseRecordingMime();
  try {
    audioChunks = []; const recordStream = new MediaStream([audioTrack]); mediaRecorder = new MediaRecorder(recordStream, mimeType ? { mimeType } : undefined); recordingStartedAt = Date.now();
    mediaRecorder.ondataavailable = e => { if (e.data?.size) audioChunks.push(e.data); };
    mediaRecorder.onstop = async () => { clearInterval(recordingTimer); recordAudioBtn.textContent = t('audioMessage'); const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' }); if (!blob.size) return; let ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm'; const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' }); await uploadFile(file); mediaRecorder = null; };
    mediaRecorder.start(250); recordAudioBtn.classList.add('recording'); recordingTimer = setInterval(() => { recordAudioBtn.textContent = `${t('stopRecording')} ${formatDuration(Date.now() - recordingStartedAt)}`; }, 500); setStatus(t('recording'));
  } catch (err) { console.error('[RECORD]', err); setStatus(t('audioFailed')); mediaRecorder = null; }
}

socket.on('turn-ready', async data => {
  await applyTurnSession(data, { restart: true });
});
socket.on('turn-error', data => {
  applyTurnSession(data, { restart: false });
  console.warn('[TURN] session credential unavailable');
});

socket.on('peer-joined', async info => { remoteSocketId = info.socketId || 'peer'; remoteLabel.textContent = info.displayName || t('otherParty'); setStatus(t('foundPeer')); if (pc) await startCallAsCaller(); });
socket.on('peer-ready', info => { remoteSocketId = info.socketId || 'peer'; remoteLabel.textContent = info.displayName || t('otherParty'); });
socket.on('offer', msg => handleOffer(msg.description, false));
socket.on('renegotiate-offer', msg => handleOffer(msg.description, true));
socket.on('answer', async msg => { if (!pc || !msg?.description) return; try { await pc.setRemoteDescription(msg.description); await flushRemoteCandidates(); } catch {} });
socket.on('renegotiate-answer', async msg => { if (!pc || !msg?.description) return; try { await pc.setRemoteDescription(msg.description); await flushRemoteCandidates(); } catch {} });
socket.on('ice-candidate', async msg => { if (!pc || !msg?.candidate) return; if (!pc.remoteDescription) remoteCandidateQueue.push(msg.candidate); else { try { await pc.addIceCandidate(msg.candidate); } catch {} } });
socket.on('peer-left', () => { remoteSocketId = null; remoteLabel.textContent = t('otherParty'); remotePlaceholder.textContent = t('remoteLeft'); remotePlaceholder.classList.remove('hidden'); if (pc) closePeer(true); setStatus(t('leftHint')); });
socket.on('remote-hangup', () => { remotePlaceholder.textContent = t('remoteHangup'); remotePlaceholder.classList.remove('hidden'); setNetwork(t('endedByPeer'), 'warn'); setStatus(t('remoteHangup')); });
socket.on('peer-reconnect-request', () => scheduleIceRestart(t('reconnect')));
socket.on('chat-message', msg => addMessage(msg, { notify: true }));
socket.on('chat-error', data => { if (data?.error === 'RATE_LIMITED') setStatus(t('rateLimited')); });
socket.on('chat-typing', data => { typingIndicator.textContent = data?.isTyping ? t('remoteTyping', { name: data.senderName || t('otherParty') }) : ''; });
socket.on('disconnect', () => { setNetwork(t('signalingDown'), 'bad'); if (!call.classList.contains('hidden')) setStatus(t('disconnected')); });
socket.on('connect', async () => { if (authToken) { const result = await registerUser(); socket.__lutsaAuthReady = Boolean(result?.ok); } if (!call.classList.contains('hidden')) setStatus(t('serverRestored')); });
socket.on('friend-request', req => { friendRequests = [req, ...friendRequests.filter(r => r.id !== req.id)]; friendCounts.incoming = friendRequests.length; renderFriends(); playNotificationSound('friend'); showToast(req.fromName || t('friendAdded'), t('newFriendRequest')); loadNotifications(); });
socket.on('friend-request-updated', data => {
  if (data?.status === 'accepted') { refreshFriends(); playNotificationSound('success'); showToast(data.displayName || '', t('requestAccepted')); loadNotifications(); }
  else if (data?.status === 'declined') { outgoingFriendRequests = outgoingFriendRequests.filter(r => r.id !== data.requestId); renderFriends(); playNotificationSound('friend'); showToast(data.displayName || '', t('requestDeclined')); loadNotifications(); }
  else if (data?.status === 'cancelled') { friendRequests = friendRequests.filter(r => r.id !== data.requestId); renderFriends(); showToast(data.displayName || '', t('requestCancelled')); loadNotifications(); }
  else if (data?.status === 'removed') { friends = friends.filter(f => f.userId !== data.userId); renderFriends(); showToast(data.displayName || '', t('friendRemoved')); loadNotifications(); }
});
socket.on('friend-presence', data => { const f = friends.find(x => x.userId === data?.userId); if (f) { f.online = Boolean(data.online); if (data.avatarUrl !== undefined) f.avatarUrl = data.avatarUrl || ''; renderFriends(); } });
socket.on('direct-message', msg => { const from = msg?.fromUserId; playNotificationSound('message'); if (activeDirectFriend && from === activeDirectFriend.userId) { directUnread[from] = 0; addDirectMessage(msg); } else { directUnread[from] = Number(directUnread[from] || 0) + 1; renderFriends(); showToast(msg.senderName || t('otherParty'), msg.text || ''); } });
socket.on('social-notification', n => { socialNotifications = [n, ...socialNotifications.filter(x => x.id !== n.id)].slice(0, 50); renderNotifications(); playNotificationSound(n.type?.startsWith('friend_') || n.type === 'friend_request' ? 'friend' : 'message'); showToast(n.actorName || t('otherParty'), notificationText(n)); });

friendSearchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') searchFriends(); });
$('friendSearchBtn')?.addEventListener('click', searchFriends);
quickFriendInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); quickAddFriend(); } });
quickAddFriendBtn?.addEventListener('click', quickAddFriend);
$('searchUsersBtn')?.addEventListener('click', () => { friendSearchInput?.focus(); friendSearchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
$('refreshFriendsBtn')?.addEventListener('click', refreshFriends);
friendSearchResults?.addEventListener('click', e => {
  const add = e.target.closest('.add-friend-btn'); if (add) return socket.emit('friend-request-send', { toUserId: add.dataset.userId }, result => { setStatus(result?.ok ? t('requestSent') : t(result?.error === 'ALREADY_FRIENDS' ? 'alreadyFriends' : result?.error === 'REQUEST_EXISTS' ? 'requestExists' : result?.error === 'USER_NOT_FOUND' ? 'userNotFound' : 'unexpected')); if (result?.ok) searchFriends(); });
});
[friendRequestsEl, friendsListEl, friendSearchResults].forEach(el => el?.addEventListener('click', e => {
  const action = e.target.closest('[data-action]');
  if (action) return socket.timeout(8000).emit('friend-request-respond', { requestId: action.dataset.requestId, action: action.dataset.action }, (err, result) => { if (!err && result?.ok) { friends = result.friends || friends; friendRequests = result.incomingRequests || friendRequests.filter(r => r.id !== result.requestId); outgoingFriendRequests = result.outgoingRequests || outgoingFriendRequests; friendCounts = result.counts || friendCounts; renderFriends(); playNotificationSound(result.status === 'accepted' ? 'success' : 'friend'); setStatus(t(result.status === 'accepted' ? 'requestAccepted' : 'requestDeclined')); } });
  const cancel = e.target.closest('.friend-cancel');
  if (cancel) return socket.timeout(8000).emit('friend-request-cancel', { requestId: cancel.dataset.requestId }, (err, result) => { if (!err && result?.ok) { outgoingFriendRequests = outgoingFriendRequests.filter(r => r.id !== result.requestId); friendCounts = result.counts || friendCounts; renderFriends(); searchFriends(); playNotificationSound('friend'); setStatus(t('requestCancelled')); } });
  const remove = e.target.closest('.friend-remove-btn');
  if (remove) return socket.timeout(8000).emit('friend-remove', { userId: remove.dataset.friendId }, (err, result) => { if (!err && result?.ok) { friends = result.friends || friends; activeDirectFriend = activeDirectFriend?.userId === remove.dataset.friendId ? null : activeDirectFriend; renderFriends(); playNotificationSound('friend'); setStatus(t('friendRemoved')); } });
  const add = e.target.closest('.add-friend-btn');
  if (add) return socket.timeout(8000).emit('friend-request-send', { toUserId: add.dataset.userId }, (err, result) => { if (!err && result?.ok) { playNotificationSound('success'); setStatus(t('requestSent')); searchFriends(); refreshFriends(); } else setStatus(t(result?.error === 'REQUEST_EXISTS' ? 'requestExists' : result?.error === 'ALREADY_FRIENDS' ? 'alreadyFriends' : 'unexpected')); });
  const callBtn = e.target.closest('.friend-call-btn'); if (callBtn) { const f = friends.find(x => x.userId === callBtn.dataset.friendId); if (f) return callFriend(f); }
  const msg = e.target.closest('.friend-message-btn'); if (msg) { const f = friends.find(x => x.userId === msg.dataset.friendId); if (f) openDirectMessages(f); }
}));
headerSearchBtn?.addEventListener('click', () => { friendSearchInput?.focus(); friendSearchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
copyUserIdBtn?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(localUserId); setStatus(t('copiedId')); } catch { window.prompt(t('copyId'), localUserId); } });
$('messagesNavBtn')?.addEventListener('click', () => { directMessagesCard?.classList.remove('hidden'); if (friends[0]) openDirectMessages(friends[0]); else setStatus(t('noFriends')); directMessagesCard?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('closeDirectMessagesBtn')?.addEventListener('click', () => directMessagesCard?.classList.add('hidden'));
directMessageForm?.addEventListener('submit', e => { e.preventDefault(); const text = directMessageInput.value.trim(); if (!text || !activeDirectFriend) return; socket.timeout(8000).emit('direct-message', { toUserId: activeDirectFriend.userId, text }, (err, result) => { if (err || !result?.ok) return setStatus(err || result?.error === 'RATE_LIMITED' ? t('rateLimited') : t('directMessageFailed')); directMessageInput.value=''; addDirectMessage(result.message); }); });

postForm?.addEventListener('submit', publishPost);
refreshFeedBtn?.addEventListener('click', loadFeed);
profileEditBtn?.addEventListener('click', openProfileCard);
profileNavBtn?.addEventListener('click', openProfileCard);
closeProfileBtn?.addEventListener('click', () => profileCard?.classList.add('hidden'));
profileForm?.addEventListener('submit', saveProfile);
profileAvatarInput?.addEventListener('change', () => uploadProfileAvatar(profileAvatarInput.files?.[0]));
notificationsNavBtn?.addEventListener('click', async () => { notificationsCard?.classList.toggle('hidden'); profileCard?.classList.add('hidden'); if (!notificationsCard.classList.contains('hidden')) { await loadNotifications(); notificationsCard.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
markNotificationsBtn?.addEventListener('click', markAllNotificationsRead);
storyAddBtn?.addEventListener('click', () => storyInput?.click());
storyInput?.addEventListener('change', () => uploadStory(storyInput.files?.[0]));
storyPeople?.addEventListener('click', e => { const item = e.target.closest('[data-story-id]'); if (item) openStoryViewer(item.dataset.storyId); });
storyViewerClose?.addEventListener('click', closeStoryViewer);
storyViewer?.addEventListener('click', e => { if (e.target === storyViewer) closeStoryViewer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !storyViewer?.classList.contains('hidden')) closeStoryViewer(); });
notificationsList?.addEventListener('click', e => { const row = e.target.closest('[data-notification-id]'); if (row) markOneNotificationRead(row.dataset.notificationId); });
feedList?.addEventListener('click', e => { const like = e.target.closest('.post-like-btn'); if (like) return togglePostLike(like.dataset.postId); const share = e.target.closest('.post-share-btn'); if (share) return sharePost(share.dataset.postId); const del = e.target.closest('.post-delete-link'); if (del) return deletePost(del.dataset.postId); const focus = e.target.closest('.post-comment-focus'); if (focus) { e.target.closest('.social-post')?.querySelector('.comment-form input')?.focus(); } });
feedList?.addEventListener('submit', e => { const form = e.target.closest('.comment-form'); if (!form) return; e.preventDefault(); const article = e.target.closest('.social-post'); const input = form.querySelector('input'); if (article) addPostComment(article.dataset.postId, input.value); });
$('discoverBtn')?.addEventListener('click', () => { notificationsCard?.classList.add('hidden'); profileCard?.classList.add('hidden'); $('feedCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); loadFeed(); });
$('createBtn').onclick = () => socket.emit('create-room', {}, result => { if (!result?.ok) return setStatus(result?.error === 'RATE_LIMITED' ? t('rateLimited') : t('cannotJoin')); roomInput.value = result.roomId; $('joinBox').classList.remove('hidden'); setStatus(t('roomCreated', { room: result.roomId })); joinRoom(result.roomId); });
$('joinBtn').onclick = () => $('joinBox').classList.toggle('hidden');
$('joinExistingBtn').onclick = () => joinRoom(roomInput.value);
roomInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(roomInput.value); });
displayNameEl.value = localStorage.getItem('crosscall_name') || '';
let registerNameTimer = null;
displayNameEl.addEventListener('input', () => { localStorage.setItem('crosscall_name', displayNameEl.value); clearTimeout(registerNameTimer); registerNameTimer = setTimeout(() => { if (socket.connected) registerUser(); }, 450); });
document.addEventListener('pointerdown', unlockNotificationAudio, { once: true });
$('hangupBtn').onclick = () => endCallToLobby();
$('micBtn').onclick = () => { resetMediaReferences(); if (!audioTrack) return; audioTrack.enabled = !audioTrack.enabled; $('micBtn').textContent = audioTrack.enabled ? t('mic') : t('micOff'); };
$('cameraBtn').onclick = () => { resetMediaReferences(); if (!cameraTrack) return; cameraTrack.enabled = !cameraTrack.enabled; $('cameraBtn').textContent = cameraTrack.enabled ? t('camera') : t('cameraOff'); };
$('screenBtn').onclick = () => screenTrack ? stopScreenShare() : startScreenShare();
$('deviceBtn').onclick = async () => { $('devicePanel').classList.toggle('hidden'); if (!$('devicePanel').classList.contains('hidden')) await refreshDevices(); };
$('cameraSelect').onchange = e => switchCamera(e.target.value);
$('micSelect').onchange = e => switchMicrophone(e.target.value);
$('speakerSelect').onchange = e => setOutputDevice(e.target.value);
$('restartBtn').onclick = () => { socket.emit('request-reconnect'); scheduleIceRestart(t('reconnecting')); };
$('shareBtn').onclick = async () => { const url = `${location.origin}/?room=${encodeURIComponent(currentRoom)}`; try { await navigator.clipboard.writeText(url); setStatus(t('copied')); } catch { window.prompt(t('copyPrompt'), url); } };
$('chatForm').addEventListener('submit', async e => { e.preventDefault(); const text = chatInput.value.trim(); if (!text || !currentRoom) return; const sendBtn = $('chatForm').querySelector('.send-btn'); sendBtn.disabled = true; try { await waitForSocket(); socket.timeout(8000).emit('chat-message', { text }, (err, result) => { if (err || !result?.ok) { setStatus(err || result?.error === 'RATE_LIMITED' ? t('rateLimited') : (result?.error === 'NOT_IN_ROOM' ? t('cannotJoin') : t('unexpected'))); return; } chatInput.value = ''; socket.emit('chat-typing', { isTyping: false }); }); } catch { setStatus(t('disconnected')); } finally { sendBtn.disabled = false; } });


chatInput.addEventListener('input', () => { socket.emit('chat-typing', { isTyping: Boolean(chatInput.value.trim()) }); clearTimeout(typingTimer); typingTimer = setTimeout(() => socket.emit('chat-typing', { isTyping: false }), 900); });
fileInput.addEventListener('change', async () => { const files = [...fileInput.files].slice(0, 8); for (const file of files) await uploadFile(file); fileInput.value = ''; });
uploadBtn.onclick = () => fileInput.click();
recordAudioBtn.onclick = toggleAudioRecording;
const dropzone = $('dropzone');
['dragenter','dragover'].forEach(type => dropzone?.addEventListener(type, e => { e.preventDefault(); dropzone.classList.add('drag'); }));
['dragleave','drop'].forEach(type => dropzone?.addEventListener(type, e => { e.preventDefault(); dropzone.classList.remove('drag'); }));
dropzone?.addEventListener('drop', async e => { const files = [...e.dataTransfer.files].slice(0, 8); for (const file of files) await uploadFile(file); });
notificationsBtn?.addEventListener('click', enablePushNotifications);
downloadChatBtn?.addEventListener('click', downloadChatHistory);
messagesEl?.addEventListener('click', markChatRead);
messagesEl?.addEventListener('focus', markChatRead);
document.addEventListener('visibilitychange', () => { updatePushVisibility(); if (!document.hidden) { markChatRead(); document.title = I18N[currentLang]?.appName || 'Lutsa vidcall'; } });
languageSelect?.addEventListener('change', e => applyLanguage(e.target.value));
function closeIntro() { if (!introScreen) return; introScreen.classList.add('intro-hidden'); document.body.classList.remove('intro-active'); setTimeout(() => introScreen.remove(), 520); }
skipIntroBtn?.addEventListener('click', closeIntro);
document.addEventListener('DOMContentLoaded', () => { document.body.classList.add('intro-active'); window.setTimeout(closeIntro, 2800); });
remoteVideo.addEventListener('click', () => enableRemoteAudio());
remoteAudioButton?.addEventListener('click', enableRemoteAudio);
async function fullscreen(el) { try { if (document.fullscreenElement) await document.exitFullscreen(); else await el.requestFullscreen(); } catch {} }
$('remoteFullBtn').onclick = () => fullscreen(remoteVideo); $('localFullBtn').onclick = () => fullscreen(localVideo);

displayNameEl.value = localName || '';
if (myUserIdEl) myUserIdEl.textContent = localUserId || '—';
loginModeBtn?.addEventListener('click', () => setAuthMode('login'));
registerModeBtn?.addEventListener('click', () => setAuthMode('register'));
loginForm?.addEventListener('submit', async e => { e.preventDefault(); await submitAuth('/api/auth/login', { username: loginUsername.value.trim(), password: loginPassword.value }, 'authLogging'); if (authReady) loginPassword.value = ''; });
registerForm?.addEventListener('submit', async e => { e.preventDefault(); await submitAuth('/api/auth/register', { displayName: registerDisplayName.value.trim(), username: registerUsername.value.trim(), password: registerPassword.value }, 'authCreating'); if (authReady) registerPassword.value = ''; });
logoutBtn?.addEventListener('click', logout);
applyLanguage(currentLang);
initExistingPushSubscription();
initAuth();
setInterval(() => { if (!document.hidden && authReady) loadStories(); }, 120000);

(async () => {
  try { const cfg = await fetch('/api/config').then(r => r.json()); $('appName').textContent = cfg.appName || t('appName'); config = cfg; if (turnStateEl) turnStateEl.textContent = cfg.turnStatus === 'ready' || (cfg.hasTurn && cfg.turnMode === 'static-fallback') ? t('turnReady') : (cfg.turnMode === 'metered-dynamic' ? t('turnPreparing') : t('turnUnavailable')); } catch {}
  const room = new URLSearchParams(location.search).get('room');
  if (room) { roomInput.value = room; $('joinBox').classList.remove('hidden'); setStatus(t('shareRoom')); }
  if (location.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(location.hostname)) setStatus(t('productionHttps'));
})();
