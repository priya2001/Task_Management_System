const express = require('express');
const {
  uploadFiles,
  getTaskFiles,
  downloadFile,
  getFileMetadata,
  deleteFile,
} = require('../controllers/fileController');
const upload = require('../middleware/multerConfig');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All file routes require authentication
router.use(protect);

// Upload files to a task - max 3 files per request
router.post('/:taskId/upload', upload.array('files', 3), uploadFiles);

// Get all files for a task
router.get('/:taskId', getTaskFiles);

// Download a specific file
router.get('/file/:fileId/download', downloadFile);

// Get file metadata
router.get('/file/:fileId', getFileMetadata);

// Delete a file
router.delete('/file/:fileId', deleteFile);

module.exports = router;
