const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ category: 1, createdAt: -1 });

// Virtual for getting days until due
taskSchema.virtual('daysUntilDue').get(function () {
  if (!this.dueDate) return null;
  const today = new Date();
  const timeDiff = this.dueDate - today;
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Ensure virtuals are included in JSON output
taskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
