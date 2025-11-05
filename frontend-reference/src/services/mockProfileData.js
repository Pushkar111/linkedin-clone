/**
 * ============================================================================
 * API RESPONSE EXAMPLES & MOCK DATA
 * ============================================================================
 * 
 * This file contains example API responses for development and testing
 * Use these as reference for API contract implementation
 */

// ============================================================================
// GET /api/users/:userId - Get User Profile
// ============================================================================
export const mockProfileResponse = {
  success: true,
  user: {
    _id: "507f1f77bcf86cd799439011",
    email: "john.doe@example.com",
    fullName: "John Doe",
    profilePicURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    profile: {
      headline: "Senior Software Engineer at Tech Corp | React & Node.js Expert",
      about: "Passionate full-stack developer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud architecture. Love mentoring junior developers and contributing to open source.\n\nAlways learning, always building. Let's connect!",
      location: "San Francisco, CA",
      bannerUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&h=400",
      website: "https://johndoe.dev",
      experience: [
        {
          position: "Senior Software Engineer",
          company: "Tech Corp",
          employmentType: "Full-time",
          location: "San Francisco, CA",
          startDate: "2020-01-01",
          endDate: null, // null means current
          description: "Leading development of microservices architecture serving 10M+ users. Mentoring team of 5 engineers. Implemented CI/CD pipeline reducing deployment time by 60%.",
          companyLogo: "https://logo.clearbit.com/techcorp.com",
          skills: ["React", "Node.js", "AWS", "Kubernetes"]
        },
        {
          position: "Full Stack Developer",
          company: "StartupXYZ",
          employmentType: "Full-time",
          location: "Remote",
          startDate: "2018-06-01",
          endDate: "2019-12-31",
          description: "Built product from 0 to 1. Developed RESTful APIs and responsive frontend. Grew user base to 50K users in first year.",
          companyLogo: "https://logo.clearbit.com/startupxyz.com",
          skills: ["JavaScript", "MongoDB", "Express", "React"]
        }
      ],
      education: [
        {
          school: "Stanford University",
          degree: "Master of Science",
          fieldOfStudy: "Computer Science",
          startYear: "2014",
          endYear: "2016",
          grade: "GPA: 3.8/4.0",
          activities: "Teaching Assistant for CS101, Member of ACM",
          description: "Focused on distributed systems and machine learning.",
          schoolLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_University_seal_2003.svg/200px-Stanford_University_seal_2003.svg.png"
        },
        {
          school: "University of California, Berkeley",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          startYear: "2010",
          endYear: "2014",
          grade: "GPA: 3.6/4.0",
          schoolLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Seal_of_University_of_California%2C_Berkeley.svg/200px-Seal_of_University_of_California%2C_Berkeley.svg.png"
        }
      ],
      skills: [
        { name: "JavaScript", endorsements: 45 },
        { name: "React", endorsements: 38 },
        { name: "Node.js", endorsements: 32 },
        { name: "AWS", endorsements: 28 },
        { name: "TypeScript", endorsements: 25 },
        { name: "MongoDB", endorsements: 22 },
        { name: "Docker", endorsements: 18 },
        { name: "Kubernetes", endorsements: 15 }
      ]
    },
    postCount: 127,
    connectionsCount: 842,
    followersCount: 1543,
    profileViews: 4287,
    reactionsReceived: 2156,
    isFollowedByCurrentUser: false,
    isOwner: false,
    createdAt: "2018-01-15T10:30:00.000Z",
    updatedAt: "2025-11-04T15:45:00.000Z"
  }
};

// ============================================================================
// GET /api/posts/user/:userId - Get User Posts (Paginated)
// ============================================================================
export const mockUserPostsResponse = {
  success: true,
  posts: [
    {
      _id: "post001",
      strPostId: "post001",
      text: "Just shipped a major feature at work! 🚀\n\nBuilt a real-time collaboration tool using React, WebSockets, and Redis. The team can now edit documents together seamlessly.\n\nKey learnings:\n1. WebSocket connection management is tricky at scale\n2. Conflict resolution algorithms are fascinating\n3. User experience is everything\n\n#SoftwareEngineering #React #WebDev",
      mediaURL: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
      attachments: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
          width: 800,
          height: 600
        }
      ],
      createdAt: "2025-11-04T10:30:00.000Z",
      updatedAt: "2025-11-04T10:30:00.000Z",
      author: {
        _id: "507f1f77bcf86cd799439011",
        fullName: "John Doe",
        profilePicURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        profile: {
          headline: "Senior Software Engineer at Tech Corp"
        }
      },
      reactions: [
        { user: "user001", type: "like" },
        { user: "user002", type: "like" },
        { user: "user003", type: "celebrate" }
      ],
      intReactionCount: 42,
      likes: ["user001", "user002", "user003"],
      comments: [],
      commentCount: 8,
      hashtags: ["SoftwareEngineering", "React", "WebDev"]
    },
    {
      _id: "post002",
      strPostId: "post002",
      text: "Excited to share that I'll be speaking at ReactConf 2025! 🎤\n\nTopic: \"Building Scalable Design Systems with React and TypeScript\"\n\nIf you're attending, let's connect!",
      mediaURL: null,
      attachments: [],
      createdAt: "2025-11-01T14:20:00.000Z",
      updatedAt: "2025-11-01T14:20:00.000Z",
      author: {
        _id: "507f1f77bcf86cd799439011",
        fullName: "John Doe",
        profilePicURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        profile: {
          headline: "Senior Software Engineer at Tech Corp"
        }
      },
      reactions: [{ user: "user004", type: "celebrate" }],
      intReactionCount: 65,
      likes: ["user004", "user005"],
      comments: [],
      commentCount: 12,
      hashtags: ["ReactConf", "Speaking", "WebDev"]
    },
    {
      _id: "post003",
      strPostId: "post003",
      text: "Weekend project: Built a CLI tool to automate my development workflow ⚡\n\nReduces setup time from 30 mins to 30 seconds. Open sourced it on GitHub!\n\nCheck it out: github.com/johndoe/dev-setup",
      mediaURL: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
      attachments: [
        {
          type: "image",
          url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
          width: 800,
          height: 600
        }
      ],
      createdAt: "2025-10-28T09:15:00.000Z",
      updatedAt: "2025-10-28T09:15:00.000Z",
      author: {
        _id: "507f1f77bcf86cd799439011",
        fullName: "John Doe",
        profilePicURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        profile: {
          headline: "Senior Software Engineer at Tech Corp"
        }
      },
      reactions: [],
      intReactionCount: 28,
      likes: [],
      comments: [],
      commentCount: 5,
      hashtags: ["OpenSource", "CLI", "Productivity"]
    }
  ],
  total: 127,
  page: 1,
  limit: 10,
  hasMore: true
};

// ============================================================================
// POST /api/users/:userId/follow - Follow User
// ============================================================================
export const mockFollowResponse = {
  success: true,
  message: "User followed successfully",
  data: {
    userId: "507f1f77bcf86cd799439011",
    isFollowing: true,
    followersCount: 1544
  }
};

// ============================================================================
// DELETE /api/users/:userId/follow - Unfollow User
// ============================================================================
export const mockUnfollowResponse = {
  success: true,
  message: "User unfollowed successfully",
  data: {
    userId: "507f1f77bcf86cd799439011",
    isFollowing: false,
    followersCount: 1543
  }
};

// ============================================================================
// GET /api/users/:userId/connections - Get Connections
// ============================================================================
export const mockConnectionsResponse = {
  success: true,
  connections: [
    {
      _id: "user001",
      fullName: "Sarah Johnson",
      profilePicURL: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=random",
      profile: {
        headline: "Product Manager at Innovation Labs"
      },
      mutualConnections: 12,
      isConnected: true
    },
    {
      _id: "user002",
      fullName: "Michael Chen",
      profilePicURL: "https://ui-avatars.com/api/?name=Michael+Chen&background=random",
      profile: {
        headline: "UX Designer | Creating delightful experiences"
      },
      mutualConnections: 8,
      isConnected: true
    }
  ],
  total: 842,
  page: 1,
  limit: 20
};

// ============================================================================
// GET /api/users/suggestions - Get Suggested Connections
// ============================================================================
export const mockSuggestionsResponse = {
  success: true,
  suggestions: [
    {
      _id: "user003",
      fullName: "Emma Davis",
      profilePicURL: "https://ui-avatars.com/api/?name=Emma+Davis&background=random",
      profile: {
        headline: "Frontend Developer | React & TypeScript"
      },
      mutualConnections: 15,
      reason: "Works at Tech Corp"
    },
    {
      _id: "user004",
      fullName: "James Wilson",
      profilePicURL: "https://ui-avatars.com/api/?name=James+Wilson&background=random",
      profile: {
        headline: "DevOps Engineer | AWS Certified"
      },
      mutualConnections: 7,
      reason: "Studied at Stanford University"
    }
  ],
  total: 50
};

// ============================================================================
// ERROR RESPONSES
// ============================================================================

// 404 - User not found
export const mockNotFoundError = {
  success: false,
  error: {
    code: "USER_NOT_FOUND",
    message: "User with ID 507f1f77bcf86cd799439011 not found",
    statusCode: 404
  }
};

// 401 - Unauthorized
export const mockUnauthorizedError = {
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required. Please log in.",
    statusCode: 401
  }
};

// 403 - Forbidden
export const mockForbiddenError = {
  success: false,
  error: {
    code: "FORBIDDEN",
    message: "You do not have permission to access this profile",
    statusCode: 403
  }
};

// 500 - Server error
export const mockServerError = {
  success: false,
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred. Please try again later.",
    statusCode: 500
  }
};

// Rate limit error
export const mockRateLimitError = {
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again in 60 seconds.",
    statusCode: 429,
    retryAfter: 60
  }
};

// ============================================================================
// UTILITY: Mock API Delay
// ============================================================================
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// UTILITY: Mock API Client for Development
// ============================================================================
export const mockAPI = {
  getUserProfile: async (userId) => {
    await delay(800); // Simulate network delay
    return mockProfileResponse;
  },

  getUserPosts: async (userId, page = 1, limit = 10) => {
    await delay(600);
    return mockUserPostsResponse;
  },

  followUser: async (userId) => {
    await delay(400);
    // Simulate 10% error rate for testing
    if (Math.random() < 0.1) {
      throw mockServerError;
    }
    return mockFollowResponse;
  },

  unfollowUser: async (userId) => {
    await delay(400);
    return mockUnfollowResponse;
  },

  getConnections: async (userId) => {
    await delay(500);
    return mockConnectionsResponse;
  },

  getSuggestions: async () => {
    await delay(500);
    return mockSuggestionsResponse;
  }
};

// ============================================================================
// USAGE IN COMPONENTS (FOR DEVELOPMENT)
// ============================================================================
/*
import { mockAPI } from './mockData';

// In your component:
const fetchProfile = async () => {
  try {
    const response = await mockAPI.getUserProfile(userId);
    setProfile(response.user);
  } catch (error) {
    setError(error.message);
  }
};
*/
