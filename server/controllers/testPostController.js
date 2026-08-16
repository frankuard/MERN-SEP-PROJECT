const TestPost = require('../models/TestPost');

const createTestPost = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'title and description are required' });
    }

    // createdBy comes from the verified JWT, never from req.body
    const post = await TestPost.create({
      title,
      description,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      message: 'Test post created',
      post,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTestPosts = async (req, res) => {
  try {
    const posts = await TestPost.find().populate('createdBy', 'username email role');
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTestPost, getTestPosts };