/**
 * Backend integration tests for like-toggle idempotency
 */

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import Post from '../src/models/Post.js';
import User from '../src/models/User.js';

describe('POST /api/posts/:id/like-toggle - Idempotency Tests', () => {
  let testUser;
  let testPost;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/linkedin-clone-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Post.deleteMany({});

    // Create test user
    testUser = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Generate auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginRes.body.token;

    // Create test post
    testPost = await Post.create({
      user: testUser._id,
      text: 'Test post for like toggle',
      mediaType: 'none',
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Idempotency', () => {
    it('should handle duplicate like requests idempotently', async () => {
      const requestId = 'test_req_123';

      // First request - should like the post
      const res1 = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.liked).toBe(true);
      expect(res1.body.likeCount).toBe(1);
      expect(res1.body.requestId).toBe(requestId);

      // Second request with same requestId - should be idempotent (still liked)
      const res2 = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.liked).toBe(true);
      expect(res2.body.likeCount).toBe(1); // Still 1, not 2
      expect(res2.body.requestId).toBe(requestId);
    });

    it('should toggle correctly on different requestIds', async () => {
      const requestId1 = 'test_req_1';
      const requestId2 = 'test_req_2';

      // Like the post
      const res1 = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId: requestId1 });

      expect(res1.body.liked).toBe(true);
      expect(res1.body.likeCount).toBe(1);

      // Unlike the post (different requestId)
      const res2 = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId: requestId2 });

      expect(res2.body.liked).toBe(false);
      expect(res2.body.likeCount).toBe(0);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent like requests correctly', async () => {
      // Send multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post(`/api/posts/${testPost._id}/like-toggle`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ requestId: `concurrent_req_${i}` })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      // Final state should be consistent
      const finalPost = await Post.findById(testPost._id);
      
      // Should have exactly 1 like (odd number of toggles = liked)
      expect(finalPost.likes).toHaveLength(1);
      expect(finalPost.likes[0].toString()).toBe(testUser._id.toString());
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback on save failure', async () => {
      // Mock save to fail
      jest.spyOn(Post.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'));

      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId: 'test_req_fail' });

      expect(res.status).toBe(500);

      // Verify post state is unchanged
      const unchangedPost = await Post.findById(testPost._id);
      expect(unchangedPost.likes).toHaveLength(0);

      // Restore mock
      jest.restoreAllMocks();
    });
  });

  describe('Response Format', () => {
    it('should return correct response format', async () => {
      const requestId = 'test_req_format';

      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('liked');
      expect(res.body).toHaveProperty('likeCount');
      expect(res.body).toHaveProperty('post');
      expect(res.body).toHaveProperty('requestId', requestId);
      expect(typeof res.body.liked).toBe('boolean');
      expect(typeof res.body.likeCount).toBe('number');
    });

    it('should accept requestId from header', async () => {
      const requestId = 'test_req_header';

      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-request-id', requestId)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.requestId).toBe(requestId);
    });

    it('should generate requestId if not provided', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.requestId).toBeDefined();
      expect(res.body.requestId).toMatch(/^req_/);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent post', async () => {
      const fakePostId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/posts/${fakePostId}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId: 'test_req_404' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Post not found');
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .send({ requestId: 'test_req_unauth' });

      expect(res.status).toBe(401);
    });

    it('should return 404 for inactive post', async () => {
      testPost.active = false;
      await testPost.save();

      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like-toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ requestId: 'test_req_inactive' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Post not found');
    });
  });

  describe('Backward Compatibility', () => {
    it('should support legacy /like endpoint', async () => {
      const res = await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.liked).toBe(true);
      expect(res.body.likeCount).toBe(1);
    });
  });
});
