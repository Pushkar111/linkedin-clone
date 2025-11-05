// ADD THESE TWO FUNCTIONS TO THE END OF postController.js

/**
 * @route   GET /api/posts/hashtag/:tag
 * @desc    Get posts by hashtag
 * @access  Public
 */
export const getPostsByHashtag = asyncHandler(async (req, res) => {
  const { tag } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Normalize hashtag (lowercase, remove # if present)
  const normalizedTag = tag.toLowerCase().replace(/^#/, '');

  const query = { 
    hashtags: normalizedTag,
    active: true 
  };

  const total = await Post.countDocuments(query);

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName profilePicURL email profile.headline')
    .populate('comments.user', 'fullName profilePicURL')
    .lean();

  res.status(200).json({
    success: true,
    hashtag: normalizedTag,
    count: posts.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    posts,
  });
});

/**
 * @route   GET /api/posts/hashtags/trending
 * @desc    Get trending hashtags
 * @access  Public
 */
export const getTrendingHashtags = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const days = parseInt(req.query.days) || 7; // Last 7 days by default

  // Get posts from last N days
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const posts = await Post.find({
    active: true,
    createdAt: { $gte: dateThreshold },
    hashtags: { $exists: true, $ne: [] }
  })
  .select('hashtags')
  .lean();

  // Count hashtag occurrences
  const hashtagCounts = {};
  
  posts.forEach(post => {
    if (post.hashtags && Array.isArray(post.hashtags)) {
      post.hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    }
  });

  // Convert to array and sort by count
  const trending = Object.entries(hashtagCounts)
    .map(([hashtag, count]) => ({ hashtag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  res.status(200).json({
    success: true,
    count: trending.length,
    trending,
  });
});
