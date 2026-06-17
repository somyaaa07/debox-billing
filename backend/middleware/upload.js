import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {       // FIX 1: missing `>`
        const uploadPath = path.join(
            __dirname,
            '..',
            process.env.UPLOAD_PATH || 'uploads',  // FIX 2: missing comma
            req.uploadFolder || 'misc'
        );
        ensureDir(uploadPath);
        cb(null, uploadPath);
    },                                      // FIX 3: missing comma between properties

    filename: (req, file, cb) => {          // FIX 4: `fileName` -> `filename` (multer requires lowercase)
        const uniqueSuffix =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        cb(
            null,
            `${uniqueSuffix}${path.extname(file.originalname)}`  // FIX 5: removed newline inside template literal
        );
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowed = [
        '.pdf', '.jpg', '.jpeg', '.png',
        '.doc', '.docx', '.xls', '.xlsx'
    ];

    const ext = path.extname(file.originalname).toLowerCase();  // FIX 6: `extname` -> `path.extname`

    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(
            new Error(`File type ${ext} not allowed`),  // FIX 7: `new.Error` -> `new Error`
            false                                        // FIX 8: `$(ext)` -> `${ext}`
        );                                               // FIX 9: `not allowed` was outside the string
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
    }
});

// Set upload folder middleware
export const setUploadFolder = (folder) => (req, res, next) => {
    req.uploadFolder = folder;   // FIX 10: comma -> semicolon
    next();                      // FIX 11: removed stray `upload,` — upload is applied separately on the route
};