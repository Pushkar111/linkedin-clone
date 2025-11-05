/**
 * Connection Degree Auto-Update Test
 * This script demonstrates automatic degree updates when connections are made
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/User.js";
import Connection from "./src/models/Connection.js";
import ConnectionRequest from "./src/models/ConnectionRequest.js";

dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/linkedin-clone");
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Test scenario: UserA connects to UserB, then check degrees
const testDegreeUpdates = async () => {
  console.log("\n🧪 Testing Automatic Connection Degree Updates\n");

  try {
    // Find or create test users
    let userA = await User.findOne({ email: "user1@yopmail.com" });
    let userB = await User.findOne({ email: "user2@yopmail.com" });
    let userC = await User.findOne({ email: "user3@yopmail.com" });

    if (!userA || !userB || !userC) {
      console.log("❌ Test users not found. Please create:");
      console.log("   - user1@yopmail.com");
      console.log("   - user2@yopmail.com");
      console.log("   - user3@yopmail.com");
      return;
    }

    console.log(`📋 Test Users:`);
    console.log(`   User A: ${userA.name} (${userA._id})`);
    console.log(`   User B: ${userB.name} (${userB._id})`);
    console.log(`   User C: ${userC.name} (${userC._id})`);

    // Check initial degree between A and B
    console.log("\n📊 Initial State:");
    const initialDegree = await Connection.getConnectionDegree(userA._id, userB._id);
    console.log(`   Degree between A and B: ${initialDegree}° (${getDegreeLabel(initialDegree)})`);

    // Create connection request from A to B
    console.log("\n🔄 Creating connection request from A to B...");
    
    // Check if request already exists
    let request = await ConnectionRequest.findOne({
      $or: [
        { sender: userA._id, receiver: userB._id },
        { sender: userB._id, receiver: userA._id }
      ]
    });

    if (request && request.status === "accepted") {
      console.log("   ✅ Already connected!");
    } else if (request) {
      console.log("   ⏳ Request already exists, status:", request.status);
      
      if (request.status === "pending") {
        console.log("   📩 Accepting request...");
        await request.accept();
        
        // Create connection
        await Connection.create({
          user1: request.sender,
          user2: request.receiver,
          connectedAt: Date.now(),
          active: true
        });

        // Update users' connections arrays
        await User.findByIdAndUpdate(request.sender, {
          $addToSet: { connections: request.receiver }
        });
        await User.findByIdAndUpdate(request.receiver, {
          $addToSet: { connections: request.sender }
        });

        console.log("   ✅ Connection established!");
      }
    } else {
      // Create new request
      request = await ConnectionRequest.create({
        sender: userA._id,
        receiver: userB._id,
        status: "pending",
        message: "Test connection request"
      });
      console.log("   ✅ Request created!");
      
      // Accept immediately for testing
      console.log("   📩 Accepting request...");
      await request.accept();
      
      // Create connection
      await Connection.create({
        user1: userA._id,
        user2: userB._id,
        connectedAt: Date.now(),
        active: true
      });

      // Update users' connections arrays
      await User.findByIdAndUpdate(userA._id, {
        $addToSet: { connections: userB._id }
      });
      await User.findByIdAndUpdate(userB._id, {
        $addToSet: { connections: userA._id }
      });

      console.log("   ✅ Connection established!");
    }

    // Check degree after connection
    console.log("\n📊 After Connection:");
    const afterDegree = await Connection.getConnectionDegree(userA._id, userB._id);
    console.log(`   Degree between A and B: ${afterDegree}° (${getDegreeLabel(afterDegree)})`);

    // Check degree between A and C
    const degreeAC = await Connection.getConnectionDegree(userA._id, userC._id);
    console.log(`   Degree between A and C: ${degreeAC}° (${getDegreeLabel(degreeAC)})`);

    // If B is connected to C, A and C should be 2nd degree
    const connectionBC = await Connection.findOne({
      $or: [
        { user1: userB._id, user2: userC._id, active: true },
        { user1: userC._id, user2: userB._id, active: true }
      ]
    });

    if (connectionBC) {
      console.log(`   💡 B and C are connected, so A-C should be 2nd degree!`);
    } else {
      console.log(`   💡 B and C are not connected yet`);
    }

    // Show connection counts
    const countA = await Connection.getConnectionCount(userA._id);
    const countB = await Connection.getConnectionCount(userB._id);
    const countC = await Connection.getConnectionCount(userC._id);

    console.log("\n📈 Connection Counts:");
    console.log(`   User A: ${countA} connections`);
    console.log(`   User B: ${countB} connections`);
    console.log(`   User C: ${countC} connections`);

    console.log("\n✅ Test completed successfully!");
    console.log("\n💡 Key Points:");
    console.log("   • Degrees are calculated dynamically (not stored in DB)");
    console.log("   • When A-B connect, their degree changes from 3° → 1°");
    console.log("   • If B-C are connected, then A-C are 2° (friends of friends)");
    console.log("   • Frontend components will automatically show updated degrees");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Helper function to get degree label
function getDegreeLabel(degree) {
  switch (degree) {
    case 0:
      return "Same User";
    case 1:
      return "Direct Connection";
    case 2:
      return "2nd Degree (Friend of Friend)";
    case 3:
      return "3rd Degree (No Connection)";
    default:
      return "Unknown";
  }
}

// Run test
const runTest = async () => {
  await connectDB();
  await testDegreeUpdates();
  await mongoose.connection.close();
  console.log("\n👋 Database connection closed");
  process.exit(0);
};

runTest();
