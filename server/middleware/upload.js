const multer = require('multer');

const storage = multer.memoryStorage();

// ---------- Images only (events, canteen menu, organizer logos, etc.) ----------
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
  }
};

const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ---------- Documents (Campus Help attachments) ----------
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', // .txt
    'text/markdown', // .md
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed: images, PDF, Word, Excel, TXT, MD'), false);
  }
};

const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — documents tend to be bigger than images
});

// ---------- Audio (AI voice transcription) ----------
const audioFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3',
    'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/x-m4a',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files (webm, ogg, mp3, m4a, wav) are allowed'), false);
  }
};

const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — voice notes should never need more
});

module.exports = { uploadImage, uploadDocument, uploadAudio };