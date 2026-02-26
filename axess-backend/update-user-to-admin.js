// update-user-to-admin.js
// Run this in your backend folder: node update-user-to-admin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateToAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // OPTION 1: Update by email
    const email = 'jrgerazi@gmail.com'; // ← CHANGE THIS to your email
    
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log('✅ User updated to admin:');
      console.log('   Email:', user.email);
      console.log('   Name:', user.fullName);
      console.log('   Role:', user.role);
    } else {
      console.log('❌ User not found with email:', email);
      
      // List all users to help you find the right one
      const allUsers = await User.find().select('email fullName role');
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.fullName}) - Role: ${u.role || 'none'}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateToAdmin();