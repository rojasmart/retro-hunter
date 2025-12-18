import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string; // Hex color for the folder
  icon?: string; // Optional icon name
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  color: {
    type: String,
    default: '#22d3ee' // cyan-400
  },
  icon: {
    type: String,
    default: 'folder'
  }
}, {
  timestamps: true
});

// Índice composto para garantir nomes únicos por usuário
FolderSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Folder || mongoose.model<IFolder>('Folder', FolderSchema);
