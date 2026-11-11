import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, TrendingUp } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  sellerId: number;
  sellerName: string;
  image: string;
  status: string;
  createdAt: string;
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-slate-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Explore Marketplace</h1>
          <p className="text-slate-500 mt-1">Find the best products with AI-driven insights.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
            />
          </div>
          <button className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-full text-slate-700 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>Trending</span>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{product.title}</h3>
                <span className="font-bold text-primary-600">${product.price.toLocaleString()}</span>
              </div>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{product.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                    {product.sellerName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-slate-600">{product.sellerName}</span>
                </div>
                <span className="text-xs font-medium text-slate-400">Ends in 2 days</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
