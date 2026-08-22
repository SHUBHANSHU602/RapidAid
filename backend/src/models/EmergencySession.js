const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['USER', 'DRIVER', 'ADMIN'] },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const emergencySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    emergencyType: {
      type: String,
      enum: [
        'ACCIDENT',
        'CARDIAC',
        'FIRE',
        'STROKE',
        'OTHER',
        'SNAKE_BITE',
        'BREATHING',
        'HEAD_INJURY',
        'BURNS',
        'POISONING',
        'PREGNANCY',
        'TRAUMA',
        'RESPIRATORY',
        'NEUROLOGICAL',
      ],
      required: [true, 'Emergency type is required'],
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    severityLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    ambulanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ambulance',
      default: null,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    hospitalRanking: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    status: {
      type: String,
      enum: ['INITIATED', 'ASSIGNED', 'EN_ROUTE', 'DELAYED', 'RESOLVED', 'CANCELLED'],
      default: 'INITIATED',
    },
    // phase tracks pre/post arrival for driver dashboard switching
    phase: {
      type: String,
      enum: ['PRE_ARRIVAL', 'POST_ARRIVAL'],
      default: 'PRE_ARRIVAL',
    },
    arrivalConfirmedAt: {
      type: Date,
      default: null,
    },
    // OTP for arrival confirmation (low severity)
    arrivalOtp: {
      type: String,
      default: null,
    },
    generalFirstAid: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    chatMessages: {
      type: [chatMessageSchema],
      default: [],
    },
    eventLog: {
      type: [eventLogSchema],
      default: [],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emergencySessionSchema.index({ userId: 1, status: 1 });
emergencySessionSchema.index({ status: 1, createdAt: -1 });
emergencySessionSchema.index({ ambulanceId: 1 });

emergencySessionSchema.methods.addEvent = function (status, meta = {}) {
  this.eventLog.push({ status, timestamp: new Date(), meta });
};

module.exports = mongoose.model('EmergencySession', emergencySessionSchema);