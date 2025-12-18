import mongoose, { Document, Schema } from 'mongoose';

export interface IGameInCollection extends Document {
  _id: string;
  userId: string;
  folderId?: string; // Reference to Folder
  gameTitle: string;
  platform: string;
  condition: 'new' | 'used' | 'refurbished' | 'poor';
  purchasePrice?: number;
  currentValue?: number;
  lowestPrice?: number;
  highestPrice?: number;
  averagePrice?: number;
  newPrice?: number;
  loosePrice?: number;
  gradedPrice?: number;
  completePrice?: number;
  priceHistory?: Array<{
    date: Date;
    newPrice?: number;
    loosePrice?: number;
    gradedPrice?: number;
    completePrice?: number;
  }>;
  purchaseDate?: Date;
  location?: string; // Onde está fisicamente
  notes?: string;
  images?: string[];
  isWishlist: boolean; // true = wishlist, false = owned
  rating?: number; // 1-10
  completionStatus?: 'not-started' | 'in-progress' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const GameInCollectionSchema = new Schema<IGameInCollection>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  folderId: {
    type: String,
    index: true
  },
  gameTitle: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['new', 'used', 'refurbished', 'poor'],
    default: 'used'
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  currentValue: {
    type: Number,
    min: 0
  },
  lowestPrice: {
    type: Number,
    min: 0
  },
  highestPrice: {
    type: Number,
    min: 0
  },
  averagePrice: {
    type: Number,
    min: 0
  },
  newPrice: {
    type: Number,
    min: 0
  },
  loosePrice: {
    type: Number,
    min: 0
  },
  gradedPrice: {
    type: Number,
    min: 0
  },
  completePrice: {
    type: Number,
    min: 0
  },
  priceHistory: [{
    date: {
      type: Date,
      required: true
    },
    newPrice: {
      type: Number,
      min: 0
    },
    loosePrice: {
      type: Number,
      min: 0
    },
    gradedPrice: {
      type: Number,
      min: 0
    },
    completePrice: {
      type: Number,
      min: 0
    }
  }],
  purchaseDate: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  images: {
    type: [String],
    default: []
  },
  isWishlist: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 10
  },
  completionStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'abandoned'],
    default: 'not-started'
  }
}, {
  timestamps: true
});

// Índices compostos para melhor performance
GameInCollectionSchema.index({ userId: 1, isWishlist: 1 });
GameInCollectionSchema.index({ userId: 1, platform: 1 });

export default mongoose.models.GameInCollection || mongoose.model<IGameInCollection>('GameInCollection', GameInCollectionSchema);
