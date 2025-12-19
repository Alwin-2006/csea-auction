import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  currentBid: {
    type: Number,
    required: true,
    min: 0
  },
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  highestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mode: {
    type: String,
    enum: ['standard', 'dutch'],
    default: 'standard',
    required: true
  },
  startingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endingDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  bidHistory: [{
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default:null,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      default:0,
      min: 0
    },
    bidTime: {
      type: Date,
      default: Date.now
    }
  }],
  totalBids: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
bidSchema.index({ status: 1, endingDate: 1 });
bidSchema.index({ seller: 1 });
bidSchema.index({ highestBidder: 1 });

export default mongoose.model('Bid', bidSchema);