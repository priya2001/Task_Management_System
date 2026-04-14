const File = require('../models/File');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Check if user can access task
const canAccessTask = (task, userId, userRole) => {
  if (userRole === 'admin') return true;
  return task.assignedTo._id.toString() === userId || task.createdBy._id.toString() === userId;
};

// Upload files to a task
const uploadFiles = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const description = req.body.description || '';

    console.log('📤 File Upload Started:', { taskId, filesCount: req.files?.length });

    // Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      console.log('❌ Invalid task ID format:', taskId);
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      console.log('❌ Task not found:', taskId);
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    console.log('✓ Task found:', task._id);

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      console.log('❌ Not authorized to upload');
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload files to this task',
      });
    }

    console.log('✓ Authorization passed');

    // Check existing file count for this task
    const existingFiles = await File.countDocuments({ task: taskId });
    if (existingFiles + req.files.length > 3) {
      console.log('❌ File limit exceeded');
      // Clean up uploaded files
      req.files.forEach(file => {
        fs.unlinkSync(file.path);
      });
      return res.status(400).json({
        success: false,
        message: `Cannot upload more than 3 files per task. Current: ${existingFiles}, Attempted: ${req.files.length}`,
      });
    }

    // Create file documents in database
    const uploadedFiles = [];
    for (const file of req.files) {
      console.log('💾 Saving file to DB:', file.filename);
      const fileDoc = new File({
        filename: file.filename,
        originalName: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size,
        task: taskId,
        uploadedBy: req.user._id,
        description: description || `${file.originalname}`,
      });

      const savedFile = await fileDoc.save();
      console.log('✓ File saved with ID:', savedFile._id);
      await savedFile.populate('uploadedBy', 'email');
      uploadedFiles.push(savedFile);
    }

    console.log('✓ All files uploaded successfully:', uploadedFiles.length);
    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      count: uploadedFiles.length,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error('❌ File upload error:', error.message);
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(error);
  }
};

// Get all files for a task
const getTaskFiles = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format',
      });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view files for this task',
      });
    }

    // Get all files for the task
    const files = await File.find({ task: taskId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: files.length,
      taskId,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

// Download a specific file
const downloadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Validate file ID format
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format',
      });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Get task to check authorization
    const task = await Task.findById(file.task);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Associated task not found',
      });
    }

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this file',
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
      });
    }

    // Download the file
    res.download(file.filepath, file.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file',
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get file metadata
const getFileMetadata = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Validate file ID format
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format',
      });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Get task to check authorization
    const task = await Task.findById(file.task);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Associated task not found',
      });
    }

    // Check authorization
    if (!canAccessTask(task, req.user._id.toString(), req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view file metadata',
      });
    }

    // Get file size on disk for verification
    const fileSizeOnDisk = fs.existsSync(file.filepath)
      ? fs.statSync(file.filepath).size
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...file.toObject(),
        fileSizeOnDisk,
        exists: fs.existsSync(file.filepath),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a file
const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Validate file ID format
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file ID format',
      });
    }

    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Get task to check authorization
    const task = await Task.findById(file.task);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Associated task not found',
      });
    }

    // Check authorization - users can delete their own files, admins can delete any
    const isOwner = file.uploadedBy._id.toString() === req.user._id.toString();
    const isAdminOrTaskAssigned = req.user.role === 'admin' || canAccessTask(task, req.user._id.toString(), req.user.role);

    if (!isOwner && !isAdminOrTaskAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file',
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // Delete file document from database
    await File.findByIdAndDelete(fileId);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      data: {
        id: file._id,
        originalName: file.originalName,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFiles,
  getTaskFiles,
  downloadFile,
  getFileMetadata,
  deleteFile,
};
