# 🧪 LinkedIn Clone - Testing Guide

## ✅ Current Status

### Backend Server
- **Status**: ✅ Running
- **URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **MongoDB**: ✅ Connected
- **Cloudinary**: ✅ Configured

### Frontend Server
- **Status**: ✅ Running
- **URL**: http://localhost:3000/linkedin
- **API Connection**: http://localhost:5000/api

---

## 🎯 Features to Test

### 1. User Registration & Authentication

#### Test Signup with Email/Password
1. Open http://localhost:3000/linkedin
2. Fill in the registration form:
   - **First Name**: Test
   - **Last Name**: User
   - **Email**: test@example.com
   - **Password**: test123 (minimum 6 characters)
   - **Headline** (optional): Full Stack Developer
   - **Country** (optional): USA
   - **Postal Code** (optional): 12345
3. Optional: Upload a profile picture
4. Click **"Agree & Join"**
5. ✅ **Expected**: Should redirect to Feed page with success toast

#### Test Login
1. Click "Already have an account? Sign in"
2. Enter:
   - **Email**: test@example.com
   - **Password**: test123
3. Click **"Sign In"**
4. ✅ **Expected**: Should redirect to Feed page

#### Test Google Sign-In
1. Click **"Join with Google"**
2. Select Google account
3. ✅ **Expected**: Should authenticate and redirect to Feed

---

### 2. Create Posts

#### Test Text-Only Post
1. After login, you'll see the Feed page
2. Look for the "Start a post" or post creation area
3. Click to open post creation
4. Type: "Hello LinkedIn! This is my first post! 🚀"
5. Click **"Post"**
6. ✅ **Expected**: Post appears at the top of your feed

#### Test Post with Image
1. Click to create a new post
2. Type some text: "Check out this amazing view!"
3. Click image upload button
4. Select an image file (JPEG, PNG, GIF, WebP - max 5MB)
5. Click **"Post"**
6. ✅ **Expected**: Post with image appears in feed

---

### 3. View All Posts (Public Feed)

1. Scroll through the feed
2. ✅ **Expected**: 
   - See posts from all users
   - Latest posts appear first
   - Each post shows:
     - User's name
     - Profile picture
     - Post text
     - Image (if uploaded)
     - Timestamp (e.g., "2 minutes ago")
     - Like count
     - Comment count

---

### 4. Like Posts

1. Find any post in the feed
2. Click the **Like/Thumbs Up** button
3. ✅ **Expected**: 
   - Like count increases
   - Button changes state (filled/colored)
4. Click again to unlike
5. ✅ **Expected**: 
   - Like count decreases
   - Button returns to normal state

---

### 5. Comment on Posts

#### Add Comment
1. Click on a post or the comment icon
2. Type a comment: "Great post! Very insightful."
3. Click **"Comment"** or **"Post"**
4. ✅ **Expected**: 
   - Comment appears below the post
   - Comment count increases
   - Shows your name and timestamp

#### Delete Your Comment
1. Find your comment
2. Click the **delete/trash** icon
3. Confirm deletion
4. ✅ **Expected**: Comment is removed

---

### 6. Edit/Delete Own Posts

#### Edit Post
1. Find one of your posts
2. Click the **edit/pencil** icon or menu (⋮)
3. Modify the text
4. Click **"Save"** or **"Update"**
5. ✅ **Expected**: Post text is updated

#### Delete Post
1. Find one of your posts
2. Click **delete/trash** icon or menu (⋮)
3. Confirm deletion
4. ✅ **Expected**: 
   - Post is removed from feed
   - Success toast notification

---

### 7. User Profile

#### View Your Profile
1. Click on your name or profile picture in the navbar
2. ✅ **Expected**: See your profile page with:
   - Profile picture
   - Name
   - Headline
   - About section
   - Your posts

#### Edit Profile
1. On your profile page, click **"Edit Profile"**
2. Update:
   - Headline: "Senior Full Stack Developer"
   - About: "Passionate about building great products"
   - Location
3. Upload new profile picture (optional)
4. Click **"Save"**
5. ✅ **Expected**: Profile is updated

#### View Other User's Profile
1. Click on any other user's name in the feed
2. ✅ **Expected**: See their profile with their posts

---

### 8. Logout

1. Click on your profile menu in the navbar
2. Click **"Logout"** or **"Sign Out"**
3. ✅ **Expected**: 
   - Redirected to landing page
   - Success toast: "Logged out successfully"

---

## 🔍 API Endpoint Testing (Using curl or Postman)

### Test Backend Directly

#### Health Check
```powershell
curl http://localhost:5000/health
```
✅ **Expected**: `{"success":true,"message":"Server is running"}`

#### Register User
```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"newuser@example.com\",\"password\":\"test123\",\"fullName\":\"New User\"}'
```

#### Login
```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"test123\"}'
```

#### Get All Posts (No Auth Required)
```powershell
curl http://localhost:5000/api/posts
```

#### Create Post (Auth Required)
First, get your token from login, then:
```powershell
curl -X POST http://localhost:5000/api/posts `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"text\":\"My first API post!\"}'
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
**Solution**: 
- Check backend is running on port 5000
- Verify `.env` has correct `MONGO_URI`
- Check frontend `.env` has `REACT_APP_API_URL=http://localhost:5000/api`

### Issue 2: "CORS Error"
**Solution**: 
- Backend `.env` should have `FRONTEND_URL=http://localhost:3000`
- Restart both servers after changing `.env`

### Issue 3: "Image upload fails"
**Solution**: 
- Check Cloudinary credentials in backend `.env`
- Ensure image is < 5MB
- Supported formats: JPEG, PNG, GIF, WebP

### Issue 4: "MongoDB connection failed"
**Solution**: 
- Check MongoDB is running (local) or accessible (Atlas)
- Verify `MONGO_URI` format in backend `.env`
- For Atlas: Check IP whitelist (use 0.0.0.0/0 for development)

### Issue 5: "Token expired"
**Solution**: 
- Logout and login again
- Token refresh happens automatically
- Check JWT_SECRET and JWT_EXPIRE in backend `.env`

---

## 📊 Test Checklist

Copy this checklist and mark as you test:

### Authentication
- [ ] User can register with email/password
- [ ] User can login with email/password
- [ ] Google Sign-In works (if configured)
- [ ] User name appears in navbar after login
- [ ] Logout works correctly

### Posts
- [ ] User can create text-only post
- [ ] User can create post with image
- [ ] All posts visible in feed
- [ ] Latest posts appear first
- [ ] Post shows user name, text, image, timestamp

### Interactions
- [ ] User can like a post
- [ ] User can unlike a post
- [ ] Like count updates correctly
- [ ] User can comment on posts
- [ ] Comment shows author and timestamp
- [ ] User can delete own comments

### Post Management
- [ ] User can edit own posts
- [ ] User can delete own posts
- [ ] User CANNOT edit/delete others' posts

### Profile
- [ ] User can view own profile
- [ ] User can edit profile information
- [ ] User can upload profile picture
- [ ] User can view others' profiles
- [ ] Profile shows user's posts

### UI/UX
- [ ] Clean, responsive design
- [ ] Works on mobile view
- [ ] Toast notifications appear for actions
- [ ] Loading states show appropriately
- [ ] Error messages are clear and helpful

---

## 🎓 Assignment Requirements Verification

### ✅ Required Features (Core)
- [x] **User Registration**: Email + Password ✅
- [x] **User Login**: JWT Authentication ✅
- [x] **User Display**: Name in navbar ✅
- [x] **Create Post**: Text content ✅
- [x] **Post Display**: User name, text, timestamp ✅
- [x] **View All Posts**: Public feed ✅
- [x] **Latest First**: Sorted by date ✅

### ✅ Bonus Features (All Implemented)
- [x] **Like Button**: Toggle like/unlike ✅
- [x] **Comment System**: Add/delete comments ✅
- [x] **Edit/Delete Posts**: Owner can modify ✅
- [x] **User Profiles**: Profile pages ✅
- [x] **Image Upload**: Post with images ✅

### ✅ Technical Requirements
- [x] **Frontend**: React.js ✅
- [x] **Backend**: Node.js + Express.js ✅
- [x] **Database**: MongoDB ✅
- [x] **Clean UI**: Professional design ✅
- [x] **Responsive**: Mobile-friendly ✅

---

## 📝 Test Results Template

Copy and fill this after testing:

```
=== LinkedIn Clone - Test Results ===
Date: [Your Date]
Tester: [Your Name]

AUTHENTICATION
✅ Registration: PASS / FAIL
✅ Login: PASS / FAIL
✅ Google Sign-In: PASS / FAIL
✅ Logout: PASS / FAIL

POSTS
✅ Create Text Post: PASS / FAIL
✅ Create Image Post: PASS / FAIL
✅ View Feed: PASS / FAIL
✅ Latest First: PASS / FAIL

INTERACTIONS
✅ Like Post: PASS / FAIL
✅ Unlike Post: PASS / FAIL
✅ Add Comment: PASS / FAIL
✅ Delete Comment: PASS / FAIL

POST MANAGEMENT
✅ Edit Own Post: PASS / FAIL
✅ Delete Own Post: PASS / FAIL

PROFILE
✅ View Profile: PASS / FAIL
✅ Edit Profile: PASS / FAIL
✅ Upload Picture: PASS / FAIL

OVERALL RATING: [ /10]
NOTES: [Any issues or observations]
```

---

## 🎉 Success Criteria

Your application is ready for submission when:

1. ✅ All core features work
2. ✅ All bonus features work
3. ✅ No console errors in browser
4. ✅ API returns proper responses
5. ✅ UI is clean and responsive
6. ✅ Toast notifications work
7. ✅ Both servers start without errors
8. ✅ MongoDB connection successful
9. ✅ Images upload successfully
10. ✅ JWT authentication secure

---

## 📧 Ready to Submit?

Once all tests pass:

1. ✅ Test locally one more time
2. ✅ Push code to GitHub
3. ✅ Deploy backend to Render
4. ✅ Deploy frontend to Vercel
5. ✅ Test production URLs
6. ✅ Send email to hr@appdost.in

**Next Steps**: See `DEPLOYMENT_GUIDE.md` for deployment instructions

---

**Happy Testing! 🚀**
