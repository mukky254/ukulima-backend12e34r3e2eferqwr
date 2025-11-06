import express from 'express';
import Product from '../entities/Product';
import auth, { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all products with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 12,
      minPrice,
      maxPrice,
      organic,
      city 
    } = req.query;
    
    let filter: any = { isAvailable: true };
    
    // Category filter
    if (category) filter.category = category;
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Organic filter
    if (organic === 'true') {
      filter['specifications.organic'] = true;
    }
    
    // City filter
    if (city) {
      filter['location.city'] = { $regex: new RegExp(city as string, 'i') };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate('farmer', 'name profile.businessName profile.avatar location')
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load products'
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name profile.businessName profile.bio profile.avatar location');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to load product'
    });
  }
});

// Create product (protected)
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const productData = {
      ...req.body,
      farmer: req.userId
    };

    const product = new Product(productData);
    await product.save();
    
    await product.populate('farmer', 'name profile.businessName profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Update product (protected)
router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      farmer: req.userId 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you are not authorized to update it'
      });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Get farmer's products
router.get('/farmer/my-products', auth, async (req: AuthRequest, res) => {
  try {
    const products = await Product.find({ farmer: req.userId })
      .populate('farmer', 'name profile.businessName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (error: any) {
    console.error('Get farmer products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load your products'
    });
  }
});

export default router;
