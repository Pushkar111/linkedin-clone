# Hashtag Feature Implementation - Step-by-Step Guide

## ✅ Completed Steps

### 1. Backend Model Updated ✅
**File**: `backend/src/models/Post.js`

Added hashtags field:
```javascript
hashtags: [
  {
    type: String,
    lowercase: true,
    trim: true,
  },
],
```

Added index:
```javascript
postSchema.index({ hashtags: 1 }); // For hashtag search
```

### 2. Hashtag Utilities Created ✅
**File**: `backend/src/utils/hashtags.js`

Functions created:
- `extractHashtags(text)` - Extract hashtags from text
- `formatHashtag(hashtag)` - Add # prefix
- `isValidHashtag(hashtag)` - Validate format
- `getTrendingHashtags(posts, limit)` - Get trending tags

### 3. Controller Updated for Auto-Extraction ✅
**File**: `backend/src/controllers/postController.js`

- Import added: `import { extractHashtags } from '../utils/hashtags.js';`
- `createPost` function: Extracts hashtags automatically when creating post
- `updatePost` function: Re-extracts hashtags when text is updated

### 4. Routes Added ✅
**File**: `backend/src/routes/postRoutes.js`

Added routes:
- `GET /api/posts/hashtags/trending` - Get trending hashtags
- `GET /api/posts/hashtag/:tag` - Get posts by hashtag

Imports updated to include:
- `getPostsByHashtag`
- `getTrendingHashtags`

---

## ⚠️ MANUAL STEP REQUIRED

### Add These Two Functions to postController.js

**Location**: Add at the END of `backend/src/controllers/postController.js` (after the `getUserPosts` function)

```javascript
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
```

### How to Add:
1. Open `backend/src/controllers/postController.js`
2. Scroll to the very end of the file
3. Copy and paste the two functions above
4. Save the file

---

## 🧪 Testing the Backend

After adding those functions, test the hashtag system:

### 1. Create a Post with Hashtags
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Excited about #javascript and #reactjs! #webdev"}'
```

**Expected Response**:
```json
{
  "success": true,
  "post": {
    "_id": "...",
    "text": "Excited about #javascript and #reactjs! #webdev",
    "hashtags": ["javascript", "reactjs", "webdev"],
    ...
  }
}
```

### 2. Get Posts by Hashtag
```bash
curl http://localhost:5000/api/posts/hashtag/javascript
```

**Expected Response**:
```json
{
  "success": true,
  "hashtag": "javascript",
  "count": 1,
  "total": 1,
  "posts": [...]
}
```

### 3. Get Trending Hashtags
```bash
curl http://localhost:5000/api/posts/hashtags/trending
```

**Expected Response**:
```json
{
  "success": true,
  "count": 3,
  "trending": [
    { "hashtag": "javascript", "count": 5 },
    { "hashtag": "reactjs", "count": 3 },
    { "hashtag": "webdev", "count": 2 }
  ]
}
```

---

## 📋 Backend Completion Checklist

- [x] Post model updated with hashtags field
- [x] Index added for hashtag search performance
- [x] Hashtag utility functions created
- [x] createPost auto-extracts hashtags
- [x] updatePost re-extracts hashtags
- [x] Routes added to postRoutes.js
- [ ] **MANUAL STEP**: Add `getPostsByHashtag` and `getTrendingHashtags` functions to postController.js
- [ ] Test backend API endpoints

---

## 🎯 Next Steps

Once the backend is complete and tested:

### Frontend Implementation (Coming Next):
1. Create hashtag parser utility
2. Create Hashtag component to display clickable hashtags
3. Update PostEntry to parse and render hashtags
4. Create HashtagFeed page to show posts by hashtag
5. Add TrendingHashtags sidebar widget
6. Update apiAdapters to include hashtags

**Estimated Time**: 1-2 hours for frontend

---

## 📝 Notes

### Hashtag Format Rules:
- Must start with `#`
- Can contain letters, numbers, underscores
- Must start with letter or underscore (not a number)
- Maximum 50 characters
- Case-insensitive (stored as lowercase)

### Examples:
- ✅ Valid: `#javascript`, `#React_Native`, `#webDev2024`, `#_private`
- ❌ Invalid: `#123abc` (starts with number), `#too-many-dashes`, `#with spaces`

---

**Status**: Backend 90% complete - waiting for manual addition of controller functions
