import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Store, LayoutDashboard, UserCircle, Package } from 'lucide-react';
import Marketplace from './pages/Marketplace';
import ProductDetails from './pages/ProductDetails';
import Dashboard from './pages/Dashboard';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-primary-600 text-white p-1.5 rounded-lg">
                <Store className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">AI Market</span>
            </div>
            
            <nav className="flex items-center space-x-6 text-sm font-medium text-slate-600">
              <Link to="/" className="hover:text-primary-600 transition-colors flex items-center space-x-1">
                <Package className="w-4 h-4" />
                <span>Explore</span>
              </Link>
              <Link to="/dashboard" className="hover:text-primary-600 transition-colors flex items-center space-x-1">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-slate-200"></div>
              <button className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors">
                <UserCircle className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
