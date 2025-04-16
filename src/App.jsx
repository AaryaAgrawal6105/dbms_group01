import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import JewelleryList from './components/JewelleryList';
import JewelleryForm from './components/JewelleryForm';
import PaymentList from './components/PaymentList';
import PaymentForm from './components/PaymentForm';
import LinkedStockList from './components/linked_stockList';
import LinkedStockForm from './components/linked_stockForm';
import Login from './components/auth/Login';
import StaffManagement from './components/auth/StaffManagement';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/auth/Dashboard';
import Reports from './pages/Reports';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes - accessible to both admin and staff */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/add-customer" element={<CustomerForm />} />
                  <Route path="/edit-customer/:id" element={<CustomerForm />} />
                  <Route path="/orders" element={<OrderList />} />
                  <Route path="/add-order" element={<OrderForm />} />
                  <Route path="/edit-order/:id" element={<OrderForm />} />
                  <Route path="/jewellery" element={<JewelleryList />} />
                  <Route path="/add-jewellery" element={<JewelleryForm />} />
                  <Route path="/edit-jewellery/:id" element={<JewelleryForm />} />
                  <Route path="/payment" element={<PaymentList />} />
                  <Route path="/add-payment" element={<PaymentForm />} />
                  <Route path="/edit-payment/:id" element={<PaymentForm />} />
                  <Route path="/linked-stock" element={<LinkedStockList />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/add-linked-stock" element={<LinkedStockForm />} />
                  <Route path="/edit-linked-stock/:jewellery_id/:model_no/:unit_id" element={<LinkedStockForm />} />
                </Route>
                
                {/* Admin-only routes */}
                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="/staff" element={<StaffManagement />} />
                  <Route path="/reports" element={<Dashboard />} />
                </Route>
                
                {/* Redirect all other routes to dashboard if authenticated, otherwise to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
