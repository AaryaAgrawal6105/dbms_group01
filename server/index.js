import express from 'express';
import cors from 'cors';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import jewelleryRoutes from './routes/jewelleryRoutes.js';
import linked_stockRoutes from './routes/linked_stockRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS to allow requests from any origin during development
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test route to check if server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working properly!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/jewellery', jewelleryRoutes);
app.use('/api/linked_stock', linked_stockRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});