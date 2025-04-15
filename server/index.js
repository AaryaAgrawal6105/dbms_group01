import express from 'express';
import cors from 'cors';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import jewelleryRoutes from './routes/jewelleryRoutes.js';
import linked_stockRoutes from './routes/linked_stockRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/jewellery', jewelleryRoutes);
app.use('/api/linked_stock', linked_stockRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});