import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
  console.log('Connected to MongoDB');

  // Remove all existing users to avoid duplicates
  await User.deleteMany({});
  console.log('Cleared existing users');

  const users = [
    { email: 'admin@example.com',       password: 'Password@123', name: 'Admin User',           role: 'ADMIN' },
    { email: 'sales@example.com',       password: 'Password@123', name: 'Sales Executive',      role: 'SALES' },
    { email: 'sanction@example.com',    password: 'Password@123', name: 'Sanction Officer',     role: 'SANCTION' },
    { email: 'disbursement@example.com',password: 'Password@123', name: 'Disbursement Officer', role: 'DISBURSEMENT' },
    { email: 'collection@example.com',  password: 'Password@123', name: 'Collection Agent',     role: 'COLLECTION' },
    { email: 'borrower@example.com',    password: 'Password@123', name: 'Test Borrower',        role: 'BORROWER' },
  ];

  for (const u of users) {
    const user = new User(u);
    await user.save();
    console.log(`✅ Created: ${u.email} (${u.role})`);
  }

  console.log('\n=== SEED CREDENTIALS ===');
  console.log('All passwords: Password@123\n');
  users.forEach(u => console.log(`${u.role.padEnd(15)} | ${u.email}`));

  await mongoose.disconnect();
  console.log('\nSeed complete!');
};

seed().catch(console.error);
