import express from 'express';
import Order from '../entities/Order';
import Product from '../entities/Product';
import auth, { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create order
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { items, shippingAddress, paymentMethod, deliveryMethod, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address and payment method are required'
      });
    }

    // Calculate total and validate items
    let totalAmount = 0;
    const orderItems = [];
    let sellerId: string | null = null;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (!product.isAvailable || product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      // Set seller ID (all items should be from the same seller)
      if (!sellerId) {
        sellerId = product.farmer.toString();
      } else if (sellerId !== product.farmer.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All items must be from the same seller'
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price
      });

      // Update product quantity
      product.quantity -= item.quantity;
      if (product.quantity === 0) {
        product.isAvailable = false;
      }
      await product.save();
    }

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to determine seller'
      });
    }

    // Create order
    const order = new Order({
      buyer: req.userId,
      seller: sellerId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      payment: { method: paymentMethod },
      delivery: { method: deliveryMethod, cost: 0 }, // Calculate based on location in real app
      notes
    });

    await order.save();
    await order.populate('items.product', 'name images');
    await order.populate('seller', 'name profile.businessName');
    await order.populate('buyer', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order'
    });
  }
});

// Get user's orders (as buyer)
router.get('/my-orders', auth, async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find({ buyer: req.userId })
      .populate('items.product', 'name images category')
      .populate('seller', 'name profile.businessName profile.avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load orders'
    });
  }
});

// Get seller's orders (as seller)
router.get('/my-sales', auth, async (req: AuthRequest, res) => {
  try {
    const orders = await Order.find({ seller: req.userId })
      .populate('items.product', 'name images category')
      .populate('buyer', 'name email phone location')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error: any) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load sales'
    });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findOne({
      _id: orderId,
      $or: [{ buyer: req.userId }, { seller: req.userId }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

export default router;
