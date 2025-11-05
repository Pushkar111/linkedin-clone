/**
 * Connection Degree Updater
 * Handles automatic degree recalculation when connections change
 */

import Connection from "../models/Connection.js";
import User from "../models/User.js";

/**
 * Update degrees for all affected users when a new connection is made
 * This is called after a connection is accepted
 * 
 * @param {ObjectId} userId1 - First user in the new connection
 * @param {ObjectId} userId2 - Second user in the new connection
 */
export const updateDegreesOnConnect = async (userId1, userId2) => {
  try {
    console.log(`[DegreeUpdater] Updating degrees after connection: ${userId1} <-> ${userId2}`);

    // Get all friends of both users
    const [user1Friends, user2Friends] = await Promise.all([
      Connection.find({
        $or: [
          { user1: userId1, active: true },
          { user2: userId1, active: true }
        ]
      }).select('user1 user2'),
      Connection.find({
        $or: [
          { user1: userId2, active: true },
          { user2: userId2, active: true }
        ]
      }).select('user1 user2')
    ]);

    // Extract friend IDs
    const user1FriendIds = user1Friends.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId1.toString() ? id2 : id1;
    });

    const user2FriendIds = user2Friends.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId2.toString() ? id2 : id1;
    });

    // All friends of user1 are now 2nd degree to user2 (and vice versa)
    // This happens automatically via the getConnectionDegree method
    // But we can cache the results if needed

    console.log(`[DegreeUpdater] User1 has ${user1FriendIds.length} friends, User2 has ${user2FriendIds.length} friends`);
    console.log(`[DegreeUpdater] Degrees will be automatically calculated on next API call`);

    // Note: Degrees are calculated dynamically by Connection.getConnectionDegree()
    // No need to store them in database - they're computed on-the-fly
    
    return {
      user1Friends: user1FriendIds.length,
      user2Friends: user2FriendIds.length,
      affectedUsers: [...new Set([...user1FriendIds, ...user2FriendIds])]
    };
  } catch (error) {
    console.error('[DegreeUpdater] Error updating degrees:', error);
    // Don't throw - this is a background task
    return null;
  }
};

/**
 * Update degrees when a connection is removed
 * 
 * @param {ObjectId} userId1 - First user
 * @param {ObjectId} userId2 - Second user
 */
export const updateDegreesOnDisconnect = async (userId1, userId2) => {
  try {
    console.log(`[DegreeUpdater] Updating degrees after disconnect: ${userId1} <-> ${userId2}`);

    // Degrees will be automatically recalculated on next API call
    // No need to do anything here since we calculate dynamically
    
    return {
      message: "Degrees will be recalculated on next request"
    };
  } catch (error) {
    console.error('[DegreeUpdater] Error updating degrees on disconnect:', error);
    return null;
  }
};

/**
 * Get all users affected by a connection change
 * These are users whose degree to one of the connected users might have changed
 * 
 * @param {ObjectId} userId1 - First user
 * @param {ObjectId} userId2 - Second user
 * @returns {Promise<Array>} Array of affected user IDs
 */
export const getAffectedUsers = async (userId1, userId2) => {
  try {
    // Get all friends of both users
    const [user1Friends, user2Friends] = await Promise.all([
      Connection.find({
        $or: [
          { user1: userId1, active: true },
          { user2: userId1, active: true }
        ]
      }).select('user1 user2'),
      Connection.find({
        $or: [
          { user1: userId2, active: true },
          { user2: userId2, active: true }
        ]
      }).select('user1 user2')
    ]);

    // Extract friend IDs
    const user1FriendIds = user1Friends.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId1.toString() ? id2 : id1;
    });

    const user2FriendIds = user2Friends.map(conn => {
      const id1 = conn.user1.toString();
      const id2 = conn.user2.toString();
      return id1 === userId2.toString() ? id2 : id1;
    });

    // Combine and deduplicate
    const affectedUserIds = [...new Set([...user1FriendIds, ...user2FriendIds])];

    return affectedUserIds;
  } catch (error) {
    console.error('[DegreeUpdater] Error getting affected users:', error);
    return [];
  }
};

export default {
  updateDegreesOnConnect,
  updateDegreesOnDisconnect,
  getAffectedUsers
};
