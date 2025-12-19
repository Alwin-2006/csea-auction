import mongoose from 'mongoose';

const SystemSettingsSchema = new mongoose.Schema({
  gmailRefreshToken: {
    type: String,
    required: true,
  },
  gmailSenderEmail: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` on save
SystemSettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('SystemSettings', SystemSettingsSchema);