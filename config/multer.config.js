import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Absolute upload root
const UPLOAD_ROOT = path.join(__dirname, '../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
};

// ---------- Storage ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    switch (file.fieldname) {
      case 'logo':
        uploadPath = path.join(UPLOAD_ROOT, 'brands');
        break;
      case 'mainImage':
        uploadPath = path.join(UPLOAD_ROOT, 'products', 'main');
        break;
      case 'gallery':
        uploadPath = path.join(UPLOAD_ROOT, 'products', 'gallery');
        break;
      case 'fileUpload':
        uploadPath = path.join(UPLOAD_ROOT, 'products', 'files');
        break;
      case 'heroBackground':
        uploadPath = path.join(UPLOAD_ROOT, 'homepage', 'hero');
        break;
      
      case 'heroImage': {
      const isHomepage =
        req.baseUrl?.includes('/homepage') ||
        req.originalUrl?.includes('/homepage');
      
      const isCareer =
        req.baseUrl?.includes('/careers') ||
        req.originalUrl?.includes('/careers'); // 👈 Added Careers check

      if (isHomepage) {
        uploadPath = path.join(UPLOAD_ROOT, 'homepage', 'hero');
      } else if (isCareer) {
        uploadPath = path.join(UPLOAD_ROOT, 'careers', 'hero'); // 👈 Save here
      } else {
        uploadPath = path.join(UPLOAD_ROOT, 'application-pages', 'hero');
      }
      break;
    }
      default:
        uploadPath = path.join(UPLOAD_ROOT, 'temp');
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random    = Math.round(Math.random() * 1e9);
    const ext       = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${timestamp}-${random}${ext}`);
  },
});

// ---------- File filter ----------
const imageTypes = /jpeg|jpg|png|gif|webp|svg/;
const docExts    = /pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv/;
const docMimes   = /pdf|msword|officedocument|excel|powerpoint|zip|rar|text|csv/;

const fileFilter = (req, file, cb) => {
  const ext  = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype || '';

  if (file.fieldname === 'fileUpload') {
    if (docExts.test(ext) && docMimes.test(mime)) return cb(null, true);
    return cb(
      new Error('fileUpload must be a document (pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, txt, csv)')
    );
  }

  // Everything else is expected to be an image
  if (imageTypes.test(ext) && imageTypes.test(mime)) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
};

// ---------- Multer instance ----------
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — raised for documents
  fileFilter,
});

// ---------- Field configs ----------
const uploadBrandLogo = upload.single('logo');


const uploadProductImagesBase = upload.fields([
  { name: 'mainImage',  maxCount: 1  },
  { name: 'gallery',    maxCount: 10 },
  { name: 'fileUpload', maxCount: 1  },
]);

// ---------- Safe wrapper: cleanup partial files on error ----------
const cleanupOnError = (err, req) => {
  const files = req.files;
  if (!files) return;

  const list = Array.isArray(files)
    ? files
    : Object.values(files).flat();

  list.forEach((f) => {
    try {
      if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    } catch (_) { /* ignore */ }
  });
};

const uploadProductImages = (req, res, next) => {
  uploadProductImagesBase(req, res, (err) => {
    if (err) {
      cleanupOnError(err, req);
      return next(err);
    }
    next();
  });
};

// Application Pages + Homepage hero (route-disambiguated by destination logic above)
const uploadHeroImage     = upload.single('heroImage');
const uploadHomeHeroImage = upload.single('heroImage');
const uploadCareerHeroImage = upload.single('heroImage'); 

export {
  upload,
  uploadBrandLogo,
  uploadProductImages,
  uploadHeroImage,
  uploadHomeHeroImage,
  uploadCareerHeroImage,
  UPLOAD_ROOT,
};