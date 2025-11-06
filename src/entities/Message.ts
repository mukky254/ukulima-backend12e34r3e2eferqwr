import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  chatId: string;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file';
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: { 
    type: String, 
    required: [true, 'Chat ID is required'] 
  },
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Sender is required'] 
  },
  receiver: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Receiver is required'] 
  },
  content: { 
    type: String, 
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file'], 
    default: 'text' 
  },
  read: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Index for efficient chat queries
messageSchema.index({ chatId: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
