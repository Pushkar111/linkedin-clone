const Reactions = Object.freeze({
  LIKE: "like",
  CELEBRATE: "celebrate",
  SUPPORT: "support",
  FUNNY: "funny",
  LOVE: "love",
  INSIGHTFUL: "insightful",
  CURIOUS: "curious",
});

const ReactionParentTypes = Object.freeze({
  POST: "post",
  POSTCOMMENT: "post-comment",
  COMMENTREPLY: "comment-reply",
});

const MediaTypes = Object.freeze({
  PHOTO: "photo",
  VIDEO: "video",
  NONE: "none",
});

const ProfileSections = Object.freeze({
  EDUCATION: "education",
  SKILL: "skill",
  EXPERIENCE: "experience",
});

const AuthenticationMethods = Object.freeze({
  EMAIL_PASSWORD: "email-password",
  GOOGLE: "google",
  // Firebase methods removed - application now uses REST API
});

// CollectionNames kept for backward compatibility with legacy Firestore utilities
// These are no longer used but prevent import errors
const CollectionNames = Object.freeze({
  USERS: "users",
  COMMENT_REPLIES: "commentreplies",
  EDUCATIONS: "educations",
  EXPERIENCES: "experiences",
  LANGUAGES: "languages",
  POSTS: "posts",
  POST_COMMENTS: "postscomments",
  PROFILES: "profiles",
  REACTIONS: "reactions",
  SKILLS: "skills",
  VIEWS: "views",
  DATABASE_VALUES: "database-values",
});

const NavigationPaths = Object.freeze({
  UNKNOWN: "*",
  BASE: "/linkedin",
  FEED: "feed",
});

export {
  Reactions,
  ReactionParentTypes,
  MediaTypes,
  ProfileSections,
  AuthenticationMethods,
  CollectionNames,
  NavigationPaths,
};
