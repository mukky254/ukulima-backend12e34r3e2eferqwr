import express from 'express';
import Message from '../entities/Message';
import auth, { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get messages for a chat
router.get('/:chatId', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    let filter: any = { chatId };

    if (before) {
      filter.createdAt = { $lt: new Date(before as string) };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name profile.avatar profile.businessName')
      .populate('receiver', 'name profile.avatar profile.businessName')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .exec();

    res.json({
      success: true,
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load messages'
    });
  }
});

// Send message
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId, receiver, content, type = 'text' } = req.body;

    if (!chatId || !receiver || !content) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID, receiver, and content are required'
      });
    }

    const message = new Message({
      chatId,
      sender: req.userId,
      receiver,
      content,
      type
    });

    await message.save();
    await message.populate('sender', 'name profile.avatar profile.businessName');
    await message.populate('receiver', 'name profile.avatar profile.businessName');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Mark messages as read
router.patch('/:chatId/read', auth, async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chatId,
        receiver: req.userId,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

export default router;
