import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    address: string;
    city: string;
    country: string;
    phone: string;
  };
  payment: {
    method: 'stripe' | 'mpesa' | 'cod';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
  };
  delivery: {
    method: string;
    cost: number;
    estimatedDate?: Date;
    trackingNumber?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  buyer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Buyer is required'] 
  },
  seller: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Seller is required'] 
  },
  items: [{
    product: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product', 
      required: [true, 'Product is required'] 
    },
    quantity: { 
      type: Number, 
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    }
  }],
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    address: { 
      type: String, 
      required: [true, 'Shipping address is required'],
      trim: true
    },
    city: { 
      type: String, 
      required: [true, 'City is required'],
      trim: true
    },
    country: { 
      type: String, 
      required: [true, 'Country is required'],
      trim: true,
      default: 'Kenya'
    },
    phone: { 
      type: String, 
      required: [true, 'Phone is required'],
      trim: true
    }
  },
  payment: {
    method: { 
      type: String, 
      enum: ['stripe', 'mpesa', 'cod'],
      required: [true, 'Payment method is required']
    },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: { type: String }
  },
  delivery: {
    method: { type: String, default: 'standard' },
    cost: { 
      type: Number, 
      default: 0,
      min: [0, 'Delivery cost cannot be negative']
    },
    estimatedDate: { type: Date },
    trackingNumber: { type: String }
  },
  notes: { 
    type: String, 
    maxlength: [500, 'Notes cannot be more than 500 characters'] 
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
