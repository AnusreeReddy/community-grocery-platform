import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './modules/users/model.js';

dotenv.config();

const base = 'http://localhost:5000/api/v1';
const request = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(base + path, {
    ...options,
    headers,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const unique = Date.now();
  const customerEmail = `customer${unique}@example.com`;
  const shopkeeperEmail = `shop${unique}@example.com`;
  const adminEmail = `admin${unique}@example.com`;
  const password = 'Password123';

  const customerReg = await request('/auth/register', { method: 'POST', body: JSON.stringify({ fullName: 'Customer One', email: customerEmail, password }) });
  console.log('REGISTER CUSTOMER', customerReg.status, JSON.stringify(customerReg.data));
  const customerLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: customerEmail, password }) });
  console.log('LOGIN CUSTOMER', customerLogin.status, JSON.stringify(customerLogin.data));
  const customerToken = customerLogin.data.token;

  const shopkeeperPasswordHash = await bcrypt.hash(password, 10);
  const shopkeeper = await User.create({ fullName: 'Shopkeeper One', email: shopkeeperEmail, password: shopkeeperPasswordHash, role: 'shopkeeper' });
  const shopkeeperLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: shopkeeperEmail, password }) });
  console.log('LOGIN SHOPKEEPER', shopkeeperLogin.status, JSON.stringify(shopkeeperLogin.data));
  const shopkeeperToken = shopkeeperLogin.data.token;

  const adminPasswordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({ fullName: 'Admin One', email: adminEmail, password: adminPasswordHash, role: 'superAdmin' });
  const adminLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: adminEmail, password }) });
  console.log('LOGIN ADMIN', adminLogin.status, JSON.stringify(adminLogin.data));
  const adminToken = adminLogin.data.token;

  console.log('ME CUSTOMER', (await request('/auth/me', { headers: { Authorization: `Bearer ${customerToken}` } })).status, JSON.stringify((await request('/auth/me', { headers: { Authorization: `Bearer ${customerToken}` } })).data));
  console.log('UNAUTH ME', (await request('/auth/me')).status, JSON.stringify((await request('/auth/me')).data));

  console.log('GET COMMUNITIES', (await request('/communities')).status, JSON.stringify((await request('/communities')).data));
  const createCommunity = await request('/communities', { method: 'POST', headers: { Authorization: `Bearer ${customerToken}` }, body: JSON.stringify({ name: 'Test Community', description: 'desc', address: '1 Main', city: 'City', state: 'ST', pincode: '111111', deliverySchedule: [{ day: 'Monday', cutOffTime: '18:00' }, { day: 'Thursday', cutOffTime: '20:00' }] })});
  console.log('CREATE COMMUNITY', createCommunity.status, JSON.stringify(createCommunity.data));
  const communityId = createCommunity.data.community?._id || createCommunity.data.community?.id;
  console.log('JOIN COMMUNITY', (await request(`/communities/${communityId}/join`, { method: 'POST', headers: { Authorization: `Bearer ${customerToken}` } })).status, JSON.stringify((await request(`/communities/${communityId}/join`, { method: 'POST', headers: { Authorization: `Bearer ${customerToken}` } })).data));

  console.log('GET PRODUCTS', (await request('/products')).status, JSON.stringify((await request('/products')).data));
  const createProduct = await request('/products', { method: 'POST', headers: { Authorization: `Bearer ${shopkeeperToken}` }, body: JSON.stringify({ name: 'Apples', category: 'Fruits', price: 120, description: 'Fresh apples', stock: 10 }) });
  console.log('CREATE PRODUCT', createProduct.status, JSON.stringify(createProduct.data));
  const productId = createProduct.data.product?._id || createProduct.data.product?.id;
  const cart = await request('/cart', { headers: { Authorization: `Bearer ${customerToken}` } });
  console.log('GET CART', cart.status, JSON.stringify(cart.data));
  const addToCart = await request('/cart', { method: 'POST', headers: { Authorization: `Bearer ${customerToken}` }, body: JSON.stringify({ productId, quantity: 2 }) });
  console.log('ADD TO CART', addToCart.status, JSON.stringify(addToCart.data));
  const order = await request('/orders', { method: 'POST', headers: { Authorization: `Bearer ${customerToken}` }, body: JSON.stringify({ deliveryDay: 'Monday' }) });
  console.log('CREATE ORDER', order.status, JSON.stringify(order.data));
  console.log('MY ORDERS', (await request('/orders/my-orders', { headers: { Authorization: `Bearer ${customerToken}` } })).status, JSON.stringify((await request('/orders/my-orders', { headers: { Authorization: `Bearer ${customerToken}` } })).data));
  console.log('GET DELIVERIES', (await request('/deliveries', { headers: { Authorization: `Bearer ${shopkeeperToken}` } })).status, JSON.stringify((await request('/deliveries', { headers: { Authorization: `Bearer ${shopkeeperToken}` } })).data));
  console.log('THRESHOLD RUN', (await request('/threshold/run', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } })).status, JSON.stringify((await request('/threshold/run', { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } })).data));
  await mongoose.disconnect();
})();
