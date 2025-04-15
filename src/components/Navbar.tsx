import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Diamond, Users, ShoppingBag, CreditCard, BarChart2, Package } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 'bg-purple-700' : '';
  };

  return (
    <nav className="bg-purple-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Diamond className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">jewellery Management</span>
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/customers"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/customers')}`}
            >
              <Users className="h-4 w-4" />
              <span>Customers</span>
            </Link>
            <Link
              to="/orders"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/orders')}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Orders</span>
            </Link>
            <Link
              to="/jewellery"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/jewellery')}`}
            >
              <Diamond className="h-4 w-4" />
              <span>jewellery</span>
            </Link>
            <Link
              to="/payment"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/payment')}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>payment</span>
            </Link>
            <Link
              to="/linked-stock"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/linked-stock')}`}
            >
              <Package className="h-4 w-4" />
              <span>Stock</span>
            </Link>
            <Link
              to="/"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/')}`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;