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
      backgroundPicURL: String,
      sections: {
        type: [String], // ['education', 'skill', 'experience']
        default: [],
      },
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
  };
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
