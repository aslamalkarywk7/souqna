import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Gavel, ArrowLeft, Loader2, Tag, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Bid {
  id: number;
  bidderName: string;
  amount: number;
  createdAt: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  sellerId: number;
  sellerName: string;
  image: string;
  bids: Bid[];
}

interface AIInsights {
  target_audience: string;
  price_range: string;
  keywords: string[];
}

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>('');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setBidAmount(String(data.bids?.[0]?.amount + 10 || data.price + 10));
        setLoading(false);
      });
  }, [id]);

  const loadAIInsights = async () => {
    if (!product) return;
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productTitle: product.title, description: product.description })
      });
      const data = await res.json();
      setInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleBid = async () => {
    if (!product || !bidAmount) return;
    
    // Simulate user 3 (Buyer One) bidding for demo
    await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        bidderId: 3, 
        amount: parseFloat(bidAmount)
      })
    });
    
    // Refresh product
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    setProduct(data);
    setBidAmount(String(data.bids?.[0]?.amount + 10 || data.price + 10));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  if (!product) return <div>Product not found</div>;

  const highestBid = product.bids?.[0]?.amount || product.price;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white aspect-[4/3]">
            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-indigo-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                AI Market Analysis
              </h3>
              {!insights && !loadingInsights && (
                <button 
                  onClick={loadAIInsights}
                  className="text-sm bg-white text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-all font-medium"
                >
                  Generate Insights
                </button>
              )}
            </div>

            {loadingInsights ? (
              <div className="flex items-center justify-center py-8 text-indigo-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>AI is analyzing this product...</span>
              </div>
            ) : insights ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-start">
                  <Users className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <span className="font-medium text-indigo-900 block">Target Audience</span>
                    <span className="text-indigo-700">{insights.target_audience}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <BarChart3 className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <span className="font-medium text-indigo-900 block">Estimated Fair Value</span>
                    <span className="text-indigo-700">{insights.price_range}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <Tag className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 shrink-0" />
                  <div>
                    <span className="font-medium text-indigo-900 block">Keywords</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {insights.keywords?.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-indigo-100 rounded text-indigo-600 text-xs">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-indigo-600/70 text-sm">Use our Gemini-powered AI to get instant market insights, audience demographics, and price estimations before bidding.</p>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{product.title}</h1>
          <p className="text-slate-500 mt-2 text-sm flex items-center">
            Listed by <span className="font-medium text-slate-700 ml-1 mr-3">{product.sellerName}</span>
            • <span className="ml-3">Item #{product.id}</span>
          </p>

          <div className="my-6 border-y border-slate-200 py-6">
            <h3 className="font-medium text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-auto">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Current Highest Bid</p>
                <div className="text-4xl font-bold text-slate-900 tracking-tight">
                  ${highestBid.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 mb-1">Auction ends in</p>
                <div className="text-lg font-bold text-slate-700">
                  2d 14h 30m
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-6">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                <input 
                  type="number" 
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full pl-7 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button 
                onClick={handleBid}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-xl flex items-center transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Gavel className="w-5 h-5 mr-2" />
                Place Bid
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 pt-4 border-t border-slate-200">Bid History</h4>
              {product.bids?.length > 0 ? (
                product.bids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-600 flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-200 mr-2 flex items-center justify-center text-[10px] font-bold">{bid.bidderName.charAt(0)}</div>
                      {bid.bidderName}
                    </span>
                    <span className="font-semibold text-slate-900">${bid.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No bids yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
