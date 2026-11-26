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
    const variantMatch = file.fieldname.match(/^variants\[\d+\]\.(mainImage|gallery|fileUpload)$/);

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
      case 'image':
        uploadPath = path.join(UPLOAD_ROOT, 'staff');
        break;
      case 'resume':
        uploadPath = path.join(UPLOAD_ROOT, 'careers', 'resumes');
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
        if (variantMatch) {
          const folder = variantMatch[1] === 'fileUpload'
            ? 'files'
            : variantMatch[1] === 'gallery'
              ? 'gallery'
              : 'main';
          uploadPath = path.join(UPLOAD_ROOT, 'products', folder);
        } else {
          uploadPath = path.join(UPLOAD_ROOT, 'temp');
        }
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
  const isDocumentField = file.fieldname === 'fileUpload'
    || file.fieldname === 'resume'
    || /^variants\[\d+\]\.fileUpload$/.test(file.fieldname);

  if (isDocumentField) {
    if (docExts.test(ext) && docMimes.test(mime)) return cb(null, true);
    return cb(new Error('File must be a document (pdf, doc, docx, xls, xlsx, ppt, pptx, zip, rar, txt, csv)'));
  }

  // Everything else is expected to be an image
  if (imageTypes.test(ext) && imageTypes.test(mime)) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'));
};

// ---------- Multer instance ----------
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB — raised for documents
  fileFilter,
});

// ---------- Field configs ----------
const uploadBrandLogo = upload.single('logo');


const uploadProductImagesBase = upload.any();

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

    const rootFiles = {};
    const variantFiles = {};
    const counts = {};

    for (const file of req.files || []) {
      const variantMatch = file.fieldname.match(/^variants\[(\d+)\]\.(mainImage|gallery|fileUpload)$/);
      const isRootField = ['mainImage', 'gallery', 'fileUpload'].includes(file.fieldname);

      if (!variantMatch && !isRootField) {
        cleanupOnError(null, req);
        return next(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      }

      counts[file.fieldname] = (counts[file.fieldname] || 0) + 1;
      const limit = file.fieldname === 'gallery' || variantMatch?.[2] === 'gallery' ? 10 : 1;
      if (counts[file.fieldname] > limit) {
        cleanupOnError(null, req);
        return next(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
      }

      if (variantMatch) {
        const [, index, field] = variantMatch;
        if (!variantFiles[index]) variantFiles[index] = {};
        if (!variantFiles[index][field]) variantFiles[index][field] = [];
        variantFiles[index][field].push(file);
      } else {
        if (!rootFiles[file.fieldname]) rootFiles[file.fieldname] = [];
        rootFiles[file.fieldname].push(file);
      }
    }

    req.files = rootFiles;
    req.variantFiles = variantFiles;
    next();
  });
};

// Application Pages + Homepage hero (route-disambiguated by destination logic above)
const uploadHeroImage     = upload.single('heroImage');
const uploadHomeHeroImage = upload.single('heroImage');
const uploadCareerHeroImage = upload.single('heroImage'); 
const uploadResume = upload.single('resume');
const uploadStaffImage = upload.single('image');


export {
  upload,
  uploadBrandLogo,
  uploadProductImages,
  uploadHeroImage,
  uploadHomeHeroImage,
  uploadCareerHeroImage,
  uploadResume,
  uploadStaffImage,
  UPLOAD_ROOT,
};