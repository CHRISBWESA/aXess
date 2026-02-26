// scripts/seed.js - Database seeding script
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Room = require('../models/Room');
const Request = require('../models/Request');
const Report = require('../models/Report');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Request.deleteMany({});
    await Report.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@axess.local',
      phone: '+255700000000',
      password: adminPassword,
      accountType: 'non_student',
      institution: 'MUST Administration',
      membership: 'Staff',
      role: 'admin',
      verificationStatus: 'approved'
    });
    console.log('✅ Created admin user (email: admin@axess.local, password: admin123)');

    // Create sample users
    const userPassword = await bcrypt.hash('password123', 10);
    const users = await User.create([
      {
        fullName: 'Alice Mwanga',
        email: 'alice@must.ac.tz',
        phone: '+255700111222',
        password: userPassword,
        accountType: 'student',
        institution: 'MUST',
        membership: 'Student',
        campus: 'Main Campus',
        regNumber: 'REG-2021-001',
        program: 'Computer Science',
        level: 'Undergraduate',
        yearOfStudy: '3',
        role: 'user',
        verificationStatus: 'approved'
      },
      {
        fullName: 'Bob Kamau',
        email: 'bob@example.com',
        phone: '+255700111333',
        password: userPassword,
        accountType: 'non_student',
        institution: 'Tech Innovators Ltd',
        membership: 'Partner',
        educationBackground: 'Bachelor',
        role: 'user',
        verificationStatus: 'pending'
      },
      {
        fullName: 'Carol Ndege',
        email: 'carol@must.ac.tz',
        phone: '+255700111444',
        password: userPassword,
        accountType: 'student',
        institution: 'MUST',
        membership: 'Student',
        campus: 'Main Campus',
        regNumber: 'REG-2020-045',
        program: 'Information Systems',
        level: 'Undergraduate',
        yearOfStudy: '4',
        role: 'user',
        verificationStatus: 'approved'
      },
      {
        fullName: 'David Maliki',
        email: 'david@udsm.ac.tz',
        phone: '+255700111555',
        password: userPassword,
        accountType: 'student',
        institution: 'UDSM',
        membership: 'External Student',
        campus: 'UDSM Main',
        regNumber: 'REG-2019-123',
        program: 'Engineering',
        level: 'Undergraduate',
        yearOfStudy: '5',
        role: 'user',
        verificationStatus: 'rejected'
      }
    ]);
    console.log(`✅ Created ${users.length} sample users`);

    // Create rooms
    const rooms = await Room.create([
      {
        name: 'DataScien Hub',
        code: 'C-108',
        status: 'available',
        floorLabel: 'ground',
        direction: 'North Wing – Ground – Corner A',
        description: 'Sector A, near main entrance. Data science and analytics workspace.',
        isPrivate: false
      },
      {
        name: 'AI Innovation Lab',
        code: 'B-205',
        status: 'available',
        floorLabel: 'first',
        direction: 'East Wing – 1st Floor – Corner B',
        description: 'Restricted access for research. AI and machine learning projects.',
        isPrivate: false
      },
      {
        name: 'Maker Studio',
        code: 'A-012',
        status: 'available',
        floorLabel: 'ground',
        direction: 'West Wing – Ground – By Lift',
        description: 'Tools available: CNC, Laser cutter, 3D printers.',
        isPrivate: false
      },
      {
        name: 'Robotics Arena',
        code: 'D-315',
        status: 'available',
        floorLabel: 'second',
        direction: 'North Wing – 2nd Floor – Corner C',
        description: 'Large open testing area for robotics projects.',
        isPrivate: false
      },
      {
        name: 'Media Room',
        code: 'L-115',
        status: 'available',
        floorLabel: 'basement',
        direction: 'South Wing – Basement – Corner C',
        description: 'A/V studio and editing bays.',
        isPrivate: false
      },
      {
        name: 'Private Server Room',
        code: 'S-001',
        status: 'maintenance',
        floorLabel: 'basement',
        direction: 'Secure Wing – Basement',
        description: 'IT infrastructure. Admin access only.',
        isPrivate: true
      }
    ]);
    console.log(`✅ Created ${rooms.length} rooms`);

    // Create sample requests
    const approvedUsers = users.filter(u => u.verificationStatus === 'approved');
    const requests = await Request.create([
      {
        userId: approvedUsers[0]._id,
        roomId: rooms[0]._id,
        carriedItems: 'Laptop, notebooks',
        phone: approvedUsers[0].phone,
        membership: approvedUsers[0].membership,
        status: 'approved',
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
      },
      {
        userId: approvedUsers[1]._id,
        roomId: rooms[1]._id,
        carriedItems: '2 laptops, external monitor',
        phone: approvedUsers[1].phone,
        membership: approvedUsers[1].membership,
        status: 'pending',
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
      },
      {
        userId: approvedUsers[0]._id,
        roomId: rooms[2]._id,
        carriedItems: 'Arduino kits, soldering tools',
        phone: approvedUsers[0].phone,
        membership: approvedUsers[0].membership,
        status: 'returned',
        requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        returnedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      }
    ]);
    console.log(`✅ Created ${requests.length} sample requests`);

    // Create sample reports
    const reports = await Report.create([
      {
        title: 'Door lock malfunction',
        roomCode: 'C-108',
        reportedBy: approvedUsers[0]._id,
        description: 'The electronic lock is not responding properly. Need maintenance.',
        priority: 'high',
        status: 'open'
      },
      {
        title: 'Missing equipment',
        roomCode: 'A-012',
        reportedBy: approvedUsers[1]._id,
        description: 'Two soldering irons are missing from the toolkit.',
        priority: 'medium',
        status: 'in_progress'
      }
    ]);
    console.log(`✅ Created ${reports.length} sample reports`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Users: ${users.length + 1} (including 1 admin)`);
    console.log(`   - Rooms: ${rooms.length}`);
    console.log(`   - Requests: ${requests.length}`);
    console.log(`   - Reports: ${reports.length}`);
    console.log('\n🔐 Admin Login:');
    console.log(`   Email: admin@axess.local`);
    console.log(`   Password: admin123`);
    console.log('\n👤 Test User Login:');
    console.log(`   Email: alice@must.ac.tz`);
    console.log(`   Password: password123`);

  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run seeder
connectDB().then(seedDatabase);