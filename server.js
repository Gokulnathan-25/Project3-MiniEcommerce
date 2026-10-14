const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
for (const file of [USERS_FILE, ORDERS_FILE]) if (!fs.existsSync(file)) fs.writeFileSync(file, '[]', 'utf8');

function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; } }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8'); }

const products = [
  { id: 1, name: 'Studio Wireless Headphones', category: 'Electronics', price: 3499, oldPrice: 4999, rating: 4.8, reviews: 248, badge: 'BESTSELLER', color: '#e8e4dc', emoji: '🎧', description: 'Rich, balanced sound with soft memory-foam ear cushions and all-day battery life.', stock: 18 },
  { id: 2, name: 'Everyday Carry Backpack', category: 'Accessories', price: 2199, oldPrice: 2799, rating: 4.7, reviews: 183, badge: 'POPULAR', color: '#e2e8dc', emoji: '🎒', description: 'A lightweight everyday backpack with a padded laptop sleeve and smart pockets.', stock: 24 },
  { id: 3, name: 'Minimal Ceramic Mug Set', category: 'Home', price: 899, oldPrice: 1199, rating: 4.6, reviews: 96, badge: 'NEW', color: '#f1e4d6', emoji: '☕', description: 'Two beautifully simple ceramic mugs designed for slow mornings and good coffee.', stock: 32 },
  { id: 4, name: 'Classic Analog Watch', category: 'Accessories', price: 2899, oldPrice: 3699, rating: 4.9, reviews: 312, badge: 'TOP RATED', color: '#e3e4ed', emoji: '⌚', description: 'A timeless dial, comfortable strap and understated design that works every day.', stock: 12 },
  { id: 5, name: 'Portable Bluetooth Speaker', category: 'Electronics', price: 1799, oldPrice: 2299, rating: 4.5, reviews: 141, badge: '', color: '#e8dfe0', emoji: '🔊', description: 'Room-filling portable audio, punchy bass and a splash-resistant compact body.', stock: 21 },
  { id: 6, name: 'Soft Knit Everyday Tee', category: 'Clothing', price: 699, oldPrice: 999, rating: 4.4, reviews: 207, badge: 'VALUE PICK', color: '#e4e7dc', emoji: '👕', description: 'A breathable cotton-blend tee with a relaxed fit and a soft, lived-in feel.', stock: 45 },
  { id: 7, name: 'Modern Desk Lamp', category: 'Home', price: 1499, oldPrice: 1899, rating: 4.6, reviews: 78, badge: '', color: '#e9e2d8', emoji: '💡', description: 'A warm, focused glow and clean silhouette for your desk, bedside or reading nook.', stock: 16 },
  { id: 8, name: 'Everyday Running Sneakers', category: 'Clothing', price: 3299, oldPrice: 4299, rating: 4.7, reviews: 169, badge: 'LIMITED DEAL', color: '#e0e5ea', emoji: '👟', description: 'Cushioned comfort and a flexible sole for daily walks, workouts and weekend plans.', stock: 14 }
];

const productCollections = [
  { category: 'Electronics', emoji: '🎧', items: [
    ['Studio Noise-Cancelling Headphones', 4299, 'Focused sound and a comfortable fit for long listening sessions.'],
    ['True Wireless Earbuds', 1899, 'Pocket-sized earbuds with clear calls and a secure everyday fit.'],
    ['Compact Smart Speaker', 2499, 'A room-friendly speaker with balanced sound and simple controls.'],
    ['Fast-Charge Power Bank', 1599, 'Reliable portable power with a slim body for daily carry.'],
    ['Multiport USB-C Hub', 1299, 'Add the everyday ports you need to your laptop setup.'],
    ['Foldable Laptop Stand', 999, 'A stable, travel-ready lift for a more comfortable desk setup.'],
    ['Wireless Charging Pad', 899, 'A neat charging spot for compatible phones and earbuds.'],
    ['Mechanical Keyboard', 3499, 'Tactile, satisfying keys in a compact desk-friendly layout.'],
    ['Precision Wireless Mouse', 1499, 'Quiet clicks and precise tracking for work or study.'],
    ['HD Webcam', 2799, 'A crisp, dependable camera for calls and remote meetings.'],
    ['Portable Mini Projector', 8999, 'Bring movies and presentations to a larger screen at home.'],
    ['Smart LED Desk Light', 1999, 'Adjustable, comfortable light for focused work after dark.']
  ] },
  { category: 'Accessories', emoji: '🎒', items: [
    ['Canvas Crossbody Bag', 1699, 'A hands-free everyday bag with room for your daily essentials.'],
    ['Slim Leather Wallet', 1299, 'A neatly organized wallet with a pocket-friendly profile.'],
    ['Field Dial Wristwatch', 3199, 'A clean, easy-to-read dial on a comfortable adjustable strap.'],
    ['Polarized Wayfarer Sunglasses', 1499, 'Lightweight frames with polarized lenses for bright days.'],
    ['Reversible Everyday Belt', 1099, 'A versatile belt with a clean finish for work or weekends.'],
    ['Travel Organizer Pouch', 799, 'Keep small travel essentials together and easy to find.'],
    ['Card Holder', 699, 'A slim card case for the essentials you carry every day.'],
    ['Padded Laptop Sleeve', 1199, 'Soft, protective padding for carrying your laptop confidently.'],
    ['Key Organizer', 599, 'Keep keys quiet, tidy and easy to reach in your bag or pocket.'],
    ['Insulated Travel Bottle', 999, 'A reusable bottle that keeps your drink close throughout the day.'],
    ['Everyday Baseball Cap', 899, 'A comfortable adjustable cap with a simple, timeless shape.'],
    ['Minimalist Crossbody Sling', 1899, 'A compact hands-free carry option for commutes and day trips.']
  ] },
  { category: 'Home', emoji: '🏠', items: [
    ['Linen Cushion Cover', 899, 'A soft-textured cover that brings an easy layer to your living space.'],
    ['Woven Cotton Throw', 1799, 'A lightweight throw for the sofa, reading chair or end of the bed.'],
    ['Hand-Finished Ceramic Vase', 1299, 'A sculptural vase that looks lovely with or without fresh stems.'],
    ['Linen Duvet Cover Set', 4299, 'Breathable bedding with a relaxed feel for a restful bedroom.'],
    ['Oak Picture Frame', 699, 'A clean-lined frame to give favourite photographs a place to shine.'],
    ['Ribbed Glass Tumbler Set', 999, 'An everyday set of textured glasses for water, juice or iced tea.'],
    ['Stoneware Serving Bowl', 1499, 'A generously sized bowl for shared meals and weekend gatherings.'],
    ['Scented Soy Candle', 799, 'A softly scented candle poured for slower evenings at home.'],
    ['Cotton Bath Towel Set', 1899, 'Soft, absorbent towels made for a comfortable daily routine.'],
    ['Woven Storage Basket', 1199, 'A useful catch-all for blankets, toys or everyday clutter.'],
    ['Acacia Serving Board', 1399, 'A sturdy natural-wood board for serving snacks and small plates.'],
    ['Pleated Table Lamp', 2499, 'A warm, diffused glow with a quietly considered silhouette.']
  ] },
  { category: 'Clothing', emoji: '👕', items: [
    ['Relaxed Cotton Overshirt', 2199, 'An easy layer with a relaxed shape for changing seasons.'],
    ['Everyday Straight-Leg Jeans', 2799, 'A dependable straight fit designed for all-day comfort.'],
    ['Soft Fleece Hoodie', 1999, 'A cosy midweight layer with a comfortable everyday fit.'],
    ['Classic Oxford Shirt', 1899, 'A versatile button-up that works from weekdays to weekends.'],
    ['Lightweight Puffer Vest', 2999, 'A practical extra layer that keeps your movement unrestricted.'],
    ['Relaxed Linen Trousers', 1799, 'An airy, comfortable pair for warm days and easy dressing.'],
    ['Ribbed Everyday Socks', 399, 'A soft, breathable staple with a comfortable stay-put cuff.'],
    ['Cotton Poplin Midi Dress', 2499, 'An easy-to-wear silhouette made from breathable cotton poplin.'],
    ['Merino Blend Crew Sweater', 3299, 'A soft, warm knit with a timeless crew neckline.'],
    ['Lightweight Rain Jacket', 3499, 'A packable outer layer for sudden showers and breezy commutes.'],
    ['Everyday Chino Shorts', 1299, 'Comfortable tailored shorts for warm-weather plans.'],
    ['Classic Canvas Slip-Ons', 1599, 'Easy-on shoes with a flexible sole for everyday errands.']
  ] }
];
const productImageVariants = {
  Electronics: [
    [11945638, 16303233, 3394666, 5269726],
    [10104407, 22940565, 3921806, 16703782],
    [27682103, 12021852, 9072408, 374114],
    [518530, 37475662, 10104281, 40137062],
    [4195404, 4195398, 7054723, 4195408],
    [4792712, 34502055, 4792717, 14458078],
    [7742588, 15921116, 5083410, 5961044],
    [12561283, 5152261, 6804466, 9020272],
    [7240349, 33693665, 7151690, 13870516],
    [16547328, 40094748, 24347621, 27505236],
    [31726737, 31726725, 31726719, 28228012],
    [39487380, 6913319, 8092411, 4008356]
  ],
  Accessories: [
    [33235378, 27302803, 14455773, 37093046],
    [14402075, 7085799, 17923962, 33277784],
    [17630869, 8792247, 16841017, 27579379],
    [2585559, 13092353, 29550561, 19706608],
    [34443362, 34443363, 38053161, 35392687],
    [10104605, 3850586, 21898260, 9185867],
    [28028260, 28028264, 10634549, 37326711],
    [89723, 7742558, 28028270, 28086431],
    [15440423, 15679989, 1007568, 15440419],
    [10582935, 15698105, 7879832, 17662565],
    [9558597, 6345390, 30731085, 14017718],
    [4063545, 22432981, 27204287, 8801132]
  ],
  Home: [
    [8762876, 4846589, 7055754, 8762877],
    [6275951, 31658575, 30778647, 16805301],
    [34775286, 17619624, 38408974, 19341648],
    [6696879, 27439405, 7445013, 3847588],
    [7956938, 10322820, 310435, 8947552],
    [18926187, 6515389, 34631661, 17255665],
    [6208156, 6952245, 3847438, 7623367],
    [37162119, 5933684, 18766655, 27089756],
    [19014649, 4194709, 4404976, 6188050],
    [8581052, 9695849, 31390667, 10117739],
    [5865425, 6004174, 8473138, 16550026],
    [37341641, 17125805, 9657668, 6594388]
  ],
  Clothing: [
    [7984830, 7671168, 18864127, 5944141],
    [10396605, 14792111, 10133282, 17658565],
    [10877545, 10886563, 36044003, 6311642],
    [14358988, 7562142, 33729525, 6931344],
    [15988407, 20532194, 30603542, 4483940],
    [2897539, 33561660, 5175677, 33561661],
    [5746098, 5746050, 5746037, 14037332],
    [5616549, 5616542, 20851443, 9725049],
    [7576509, 13423296, 7339193, 6326172],
    [26838404, 35625425, 27255129, 12505397],
    [5544124, 30710089, 9637741, 9637740],
    [38154568, 5768146, 12745103, 15059773]
  ]
};
const productFinishes = [
  { name: 'Graphite', color: '#e8e4dc' },
  { name: 'Cloud', color: '#e2e8dc' },
  { name: 'Sage', color: '#e3e4ed' },
  { name: 'Terracotta', color: '#f1e4d6' }
];
for (const collection of productCollections) {
  for (const [itemIndex, [name, price, description]] of collection.items.entries()) {
    for (const [finishIndex, finish] of productFinishes.entries()) {
      const id = products.length + 1;
      const index = itemIndex * productFinishes.length + finishIndex;
      products.push({
        id,
        name: `${name} - ${finish.name}`,
        category: collection.category,
        imageId: productImageVariants[collection.category][itemIndex][finishIndex],
        price: price + finishIndex * 50,
        oldPrice: Math.round((price + finishIndex * 50) * 1.25 / 100) * 100,
        rating: Number((4.2 + (index % 7) * 0.1).toFixed(1)),
        reviews: 36 + index * 13,
        badge: index % 12 === 0 ? 'NEW' : '',
        color: finish.color,
        emoji: collection.emoji,
        description: `${description} Available in ${finish.name}.`,
        stock: 10 + (index % 35)
      });
    }
  }
}

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'shopora.sid',
  secret: process.env.SESSION_SECRET || 'shopora-demo-secret-change-before-deploying',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 6 }
}));
app.use(express.static(path.join(__dirname, 'public')));

function publicUser(user) { return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }; }
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Please sign in to continue.' });
  const user = readJson(USERS_FILE).find(u => u.id === req.session.userId);
  if (!user) { req.session.destroy(() => {}); return res.status(401).json({ error: 'Your session expired. Please sign in again.' }); }
  req.user = user; next();
}
function getCart(req) { if (!Array.isArray(req.session.cart)) req.session.cart = []; return req.session.cart; }
function cartDetails(req) {
  const items = getCart(req).map(line => { const p = products.find(x => x.id === line.productId); return p ? { ...p, quantity: line.quantity, lineTotal: p.price * line.quantity } : null; }).filter(Boolean);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = subtotal === 0 || subtotal >= 1999 ? 0 : 99;
  return { items, subtotal, shipping, total: subtotal + shipping, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
}

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Shopora', mode: 'test' }));
app.get('/api/products', (req, res) => {
  let list = products.slice();
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || 'All');
  const sort = String(req.query.sort || 'featured');
  if (q) list = list.filter(p => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q));
  if (category !== 'All') list = list.filter(p => p.category === category);
  if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
  if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  const categoryCounts = products.reduce((counts, product) => {
    counts[product.category] = (counts[product.category] || 0) + 1;
    return counts;
  }, { All: products.length });
  res.json({ products: list, categories: ['All', ...new Set(products.map(p => p.category))], categoryCounts });
});
app.get('/api/auth/me', (req, res) => {
  const user = readJson(USERS_FILE).find(u => u.id === req.session.userId);
  res.json({ user: user ? publicUser(user) : null });
});
app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'Name must be between 2 and 60 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  const users = readJson(USERS_FILE);
  if (users.some(u => u.email === email)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = { id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name, email, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date().toISOString() };
  users.push(user); writeJson(USERS_FILE, users); req.session.userId = user.id;
  res.status(201).json({ user: publicUser(user), message: 'Account created. Welcome to Shopora!' });
});
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = readJson(USERS_FILE).find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ error: 'Could not create a secure session. Please retry.' });
    req.session.userId = user.id;
    res.json({ user: publicUser(user), message: `Welcome back, ${user.name.split(' ')[0]}!` });
  });
});
app.post('/api/auth/logout', (req, res) => req.session.destroy(err => {
  if (err) return res.status(500).json({ error: 'Could not sign out. Please retry.' });
  res.clearCookie('shopora.sid'); res.json({ message: 'Signed out successfully.' });
}));

app.get('/api/cart', (req, res) => res.json(cartDetails(req)));
app.post('/api/cart', (req, res) => {
  const productId = Number(req.body.productId); const quantity = Number(req.body.quantity || 1);
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ error: 'Quantity must be between 1 and 10.' });
  const cart = getCart(req); const line = cart.find(item => item.productId === productId);
  if (line) { if (line.quantity + quantity > Math.min(product.stock, 10)) return res.status(400).json({ error: `Only ${product.stock} available. Maximum 10 per order.` }); line.quantity += quantity; }
  else cart.push({ productId, quantity });
  res.json({ ...cartDetails(req), message: `${product.name} added to your bag.` });
});
app.patch('/api/cart/:productId', (req, res) => {
  const productId = Number(req.params.productId); const quantity = Number(req.body.quantity);
  const product = products.find(p => p.id === productId); const line = getCart(req).find(item => item.productId === productId);
  if (!line || !product) return res.status(404).json({ error: 'Cart item not found.' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(product.stock, 10)) return res.status(400).json({ error: 'That quantity is not available.' });
  line.quantity = quantity; res.json(cartDetails(req));
});
app.delete('/api/cart/:productId', (req, res) => {
  req.session.cart = getCart(req).filter(item => item.productId !== Number(req.params.productId));
  res.json({ ...cartDetails(req), message: 'Item removed from your bag.' });
});
app.delete('/api/cart', (req, res) => { req.session.cart = []; res.json(cartDetails(req)); });

app.post('/api/checkout', requireAuth, (req, res) => {
  const cart = cartDetails(req);
  if (!cart.items.length) return res.status(400).json({ error: 'Your bag is empty.' });
  const { fullName, email, phone, address, city, postalCode, paymentMethod, testCard } = req.body;
  if (![fullName, email, phone, address, city, postalCode].every(v => typeof v === 'string' && v.trim())) return res.status(400).json({ error: 'Please complete all delivery details.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid checkout email.' });
  if (!/^[0-9]{6}$/.test(postalCode.trim())) return res.status(400).json({ error: 'Enter a valid 6-digit PIN code.' });
  if (paymentMethod === 'card' && !['4242424242424242', '4000000000000002'].includes(String(testCard || '').replace(/\s/g, ''))) return res.status(400).json({ error: 'Use the demo test card 4242 4242 4242 4242.' });
  if (!['card', 'cod'].includes(paymentMethod)) return res.status(400).json({ error: 'Choose a payment method.' });
  const orders = readJson(ORDERS_FILE);
  const order = {
    id: `SH-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    userId: req.user.id, items: cart.items.map(({ id, name, price, quantity, lineTotal }) => ({ productId: id, name, price, quantity, lineTotal })),
    subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total,
    customer: { fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), address: address.trim(), city: city.trim(), postalCode: postalCode.trim() },
    paymentMethod, paymentStatus: paymentMethod === 'card' ? (String(testCard).replace(/\s/g, '') === '4000000000000002' ? 'declined-demo' : 'paid-test-mode') : 'cash-on-delivery',
    status: 'Confirmed', createdAt: new Date().toISOString()
  };
  orders.unshift(order); writeJson(ORDERS_FILE, orders); req.session.cart = [];
  res.status(201).json({ order, message: 'Order placed successfully. This is a test checkout; no real payment was taken.' });
});
app.get('/api/orders', requireAuth, (req, res) => res.json({ orders: readJson(ORDERS_FILE).filter(order => order.userId === req.user.id) }));
app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = readJson(ORDERS_FILE).find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' }); res.json({ order });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`\nShopora is running at http://localhost:${PORT}\nCheckout mode: TEST ONLY — no real payments are processed.\n`));
