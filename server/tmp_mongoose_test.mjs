import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
import Community from './modules/communities/model.js';
try {
  const c = await Community.create({ name:'x', description:'d', address:'a', city:'c', state:'s', pincode:'1', deliverySchedule:[{day:'Monday', cutOffTime:'18:00'},{day:'Thursday', cutOffTime:'20:00'}], createdBy:new mongoose.Types.ObjectId() });
  console.log('created', c._id);
} catch (e) {
  console.error(e);
}
await mongoose.disconnect();
