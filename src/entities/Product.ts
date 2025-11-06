import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  unit: string;
  quantity: number;
  minOrder: number;
  images: string[];
  farmer: mongoose.Types.ObjectId;
  specifications: {
    grade?: string;
    variety?: string;
    organic?: boolean;
    pesticideFree?: boolean;
    expiryDate?: Date;
    harvestDate?: Date;
  };
  location: {
    city: string;
    country: string;
  };
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: ['Vegetables', 'Fruits', 'Grains', 'Livestock', 'Dairy', 'Poultry', 'Other']
  },
  subcategory: { type: String, trim: true },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: { 
    type: String, 
    required: [true, 'Unit is required'],
    enum: ['kg', 'g', 'lb', 'piece', 'bunch', 'crate', 'bag']
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  minOrder: { 
    type: Number, 
    default: 1,
    min: [1, 'Minimum order must be at least 1']
  },
  images: [{ type: String }],
  farmer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Farmer is required'] 
  },
  specifications: {
    grade: { 
      type: String, 
      enum: ['A', 'B', 'C', 'Premium', 'Standard', 'Economy'] 
    },
    variety: { type: String, trim: true },
    organic: { type: Boolean, default: false },
    pesticideFree: { type: Boolean, default: false },
    expiryDate: { type: Date },
    harvestDate: { type: Date }
  },
  location: {
    city: { 
      type: String, 
      required: [true, 'City is required'],
      trim: true
    },
    country: { 
      type: String, 
      default: 'Kenya',
      trim: true
    }
  },
  isAvailable: { type: Boolean, default: true },
  rating: { 
    type: Number, 
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: { type: Number, default: 0 },
  tags: [{ type: String, trim: true }]
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text',
  category: 1,
  'specifications.organic': 1,
  'location.city': 1
});

export default mongoose.model<IProduct>('Product', productSchema);
