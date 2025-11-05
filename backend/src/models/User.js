/**
 * User Model
 * Represents a user in the LinkedIn clone application
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function() {
        // Password required only for email/password authentication
        return this.authMethod === 'email-password';
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    authMethod: {
      type: String,
      enum: ['email-password', 'google', 'anonymous'],
      default: 'email-password',
    },
    profilePicURL: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/default-avatar.png',
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false, // Don't return in queries by default
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Profile information (denormalized for performance)
    profile: {
      firstName: String,
      lastName: String,
      headline: {
        type: String,
        default: '',
      },
      about: {
        type: String,
        default: '',
      },
      countryLoc: String,
      postalCodeLoc: String,
      location: String, // City, State, Country format
      bannerUrl: String, // Profile banner/cover image
      backgroundPicURL: String,
      sections: {
        type: [String], // ['education', 'skill', 'experience']
        default: [],
      },
      // Experience section
      experience: [
        {
          company: String,
          companyLogo: String,
          position: String,
          startDate: Date,
          endDate: Date,
          current: { type: Boolean, default: false },
          location: String,
          description: String,
          skills: [String],
        },
      ],
      // Education section
      education: [
        {
          school: String,
          schoolLogo: String,
          degree: String,
          fieldOfStudy: String,
          startDate: Date,
          endDate: Date,
          grade: String,
          activities: String,
          description: String,
        },
      ],
      // Skills section
      skills: [
        {
          name: { type: String, required: true },
          endorsements: { type: Number, default: 0 },
          endorsedBy: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
        },
      ],
    },
    // Social features
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Analytics
    profileViews: {
      type: Number,
      default: 0,
    },
    searchAppearances: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
  }
);

// Index for faster queries (email already has unique index from schema definition)
userSchema.index({ active: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ connections: 1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) {
    return next();
  }

  // Hash password with bcrypt
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare provided password with hashed password
 * @param {string} enteredPassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Get user's full profile info
 * @returns {Object}
 */
userSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    email: this.email,
    fullName: this.fullName,
    profilePicURL: this.profilePicURL,
    profile: this.profile,
    authMethod: this.authMethod,
    createdAt: this.createdAt,
    followersCount: this.followers ? this.followers.length : 0,
    followingCount: this.following ? this.following.length : 0,
    connectionsCount: this.connections ? this.connections.length : 0,
    profileViews: this.profileViews || 0,
    searchAppearances: this.searchAppearances || 0,
  };
};

/**
 * Follow another user
 * @param {ObjectId} targetUserId - User to follow
 * @returns {Promise<boolean>}
 */
userSchema.methods.followUser = async function (targetUserId) {
  const targetUserIdString = targetUserId.toString();
  const thisIdString = this._id.toString();
  
  // Can't follow yourself
  if (targetUserIdString === thisIdString) {
    throw new Error('Cannot follow yourself');
  }
  
  // Check if already following
  if (this.following && this.following.some(id => id.toString() === targetUserIdString)) {
    return false; // Already following
  }
  
  // Add to following array
  if (!this.following) this.following = [];
  this.following.push(targetUserId);
  await this.save();
  
  // Add this user to target's followers
  await mongoose.model('User').findByIdAndUpdate(
    targetUserId,
    { $addToSet: { followers: this._id } }
  );
  
  return true;
};

/**
 * Unfollow a user
 * @param {ObjectId} targetUserId - User to unfollow
 * @returns {Promise<boolean>}
 */
userSchema.methods.unfollowUser = async function (targetUserId) {
  const targetUserIdString = targetUserId.toString();
  
  // Check if actually following
  if (!this.following || !this.following.some(id => id.toString() === targetUserIdString)) {
    return false; // Not following
  }
  
  // Remove from following array
  this.following = this.following.filter(id => id.toString() !== targetUserIdString);
  await this.save();
  
  // Remove this user from target's followers
  await mongoose.model('User').findByIdAndUpdate(
    targetUserId,
    { $pull: { followers: this._id } }
  );
  
  return true;
};

/**
 * Check if following a user
 * @param {ObjectId} targetUserId - User to check
 * @returns {boolean}
 */
userSchema.methods.isFollowing = function (targetUserId) {
  if (!this.following) return false;
  return this.following.some(id => id.toString() === targetUserId.toString());
};

/**
 * Increment profile view count
 * @returns {Promise<void>}
 */
userSchema.methods.incrementProfileView = async function () {
  this.profileViews = (this.profileViews || 0) + 1;
  await this.save();
};

/**
 * Generate password reset token
 * @returns {string} Reset token
 */
userSchema.methods.generatePasswordResetToken = function () {
  // Generate random token using crypto (already imported at top)
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expiry to 1 hour from now
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken; // Return unhashed token to send via email
};

const User = mongoose.model('User', userSchema);

export default User;
