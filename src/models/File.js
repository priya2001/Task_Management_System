const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    filepath: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimetype: {
      type: String,
      default: 'application/pdf',
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'File must be associated with a task'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader information is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
fileSchema.index({ task: 1, createdAt: -1 });
fileSchema.index({ uploadedBy: 1 });

// Populate references before returning
fileSchema.pre(/^find/, function () {
  this.populate({
    path: 'uploadedBy',
    select: 'email',
  });
});

module.exports = mongoose.model('File', fileSchema);
