require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const User = require('./models/user');
const Business = require('./models/Business');

async function seedDemoUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Customer Demo (Shopper / Buyer)
  let customer = await User.findOne({ email: 'customer@hitmeup.com' });
  if (!customer) {
    customer = await User.create({
      name: 'Sarah Shopper',
      email: 'customer@hitmeup.com',
      password: 'Password123!',
      role: 'customer',
      phone: '+94 77 111 2233'
    });
    console.log('Created demo customer: customer@hitmeup.com');
  } else {
    customer.password = 'Password123!';
    await customer.save();
    console.log('Updated demo customer password');
  }

  // 2. Business Demo (Merchant / Seller)
  let businessUser = await User.findOne({ email: 'business@hitmeup.com' });
  if (!businessUser) {
    businessUser = await User.create({
      name: 'Chef Mario',
      email: 'business@hitmeup.com',
      password: 'Password123!',
      role: 'business',
      phone: '+94 77 444 5566'
    });
    console.log('Created demo business user: business@hitmeup.com');
  } else {
    businessUser.password = 'Password123!';
    await businessUser.save();
    console.log('Updated demo business user password');
  }

  let business = await Business.findOne({ ownerId: businessUser._id });
  if (!business) {
    business = await Business.create({
      ownerId: businessUser._id,
      name: "Mario's Italian Bistro",
      category: 'Restaurant',
      phone: '+94 77 444 5566',
      email: 'business@hitmeup.com',
      description: 'Authentic stone-baked pizza and fresh pasta in Colombo.',
      address: { city: 'Colombo', street: '14 Marine Drive', country: 'Sri Lanka' },
      status: 'active'
    });
    businessUser.businessId = business._id;
    await businessUser.save();
    console.log('Created demo business:', business.name);
  }

  console.log('Demo accounts ready!');
  process.exit(0);
}

seedDemoUsers().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
