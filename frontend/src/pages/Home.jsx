import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, TrendingUp, Cpu, Shirt, Home as HomeIcon, ArrowRight, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const CategoryCard = memo(({ name, icon, path, bg }) => (
  <Link
    to={path}
    className="glass-panel border border-slate-200/60 dark:border-slate-800/30 rounded-2xl p-6 flex items-center space-x-4 hover:shadow-lg hover:border-primary-500/40 dark:hover:border-primary-400/40 hover:-translate-y-1 transition-all group"
  >
    <div className={`p-4 rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-lg">{name}</h3>
      <span className="text-xs text-slate-400 group-hover:text-primary-500 transition-colors">Browse products &rarr;</span>
    </div>
  </Link>
));

CategoryCard.displayName = 'CategoryCard';

const Home = () => {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [personalized, setPersonalized] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await API.get('/api/recommend/trending?limit=4');
        const detailsPromises = res.data.map(async (item) => {
          const prodRes = await API.get(`/api/products/${item.productId}`);
          return { ...prodRes.data, explanation: item.explanation, similarityScore: item.similarityScore };
        });
        const detailedProducts = await Promise.all(detailsPromises);
        setTrending(detailedProducts);
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      } finally {
        setLoadingTrending(false);
      }
    };

    const fetchPersonalized = async () => {
      if (!user) {
        setLoadingPersonal(false);
        return;
      }
      try {
        const res = await API.get(`/api/recommend/user/${user.id}?limit=4`);
        const detailsPromises = res.data.map(async (item) => {
          const prodRes = await API.get(`/api/products/${item.productId}`);
          return { ...prodRes.data, explanation: item.explanation, similarityScore: item.similarityScore };
        });
        const detailedProducts = await Promise.all(detailsPromises);
        setPersonalized(detailedProducts);
      } catch (err) {
        console.error("Failed to fetch personalized:", err);
      } finally {
        setLoadingPersonal(false);
      }
    };

    fetchTrending();
    fetchPersonalized();
  }, [user]);

  const categories = [
    { name: 'Electronics', icon: <Cpu size={24} />, path: '/shop?category=Electronics', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { name: 'Fashion', icon: <Shirt size={24} />, path: '/shop?category=Fashion', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { name: 'Home & Kitchen', icon: <HomeIcon size={24} />, path: '/shop?category=Home%20%26%20Kitchen', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 md:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 rounded-full bg-primary-500/15 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl"></div>
        <div className="relative max-w-2xl space-y-6 z-10">
          <div className="inline-flex items-center space-x-2 bg-primary-500/10 border border-primary-500/20 px-3 py-1 rounded-full text-xs font-semibold text-primary-300">
            <Sparkles size={14} className="text-primary-400" />
            <span>AI-Driven Recommendations Engine</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Discover Products <br />
            <span className="bg-gradient-to-r from-primary-400 to-indigo-300 bg-clip-text text-transparent">Tailored For You</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-lg leading-relaxed">
            Our intelligent recommendation algorithm analyzes your browsing patterns and purchases to suggest items you will actually love.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/shop" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-primary-500/20 hover:-translate-y-0.5">
              <span>Start Shopping</span>
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link to="/login" className="bg-white/10 hover:bg-white/15 border border-white/10 px-8 py-3.5 rounded-xl font-bold flex items-center justify-center transition-all">
                Sign In to Personalize
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Shop by Category</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Explore our high-quality curated catalogs</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <CategoryCard key={idx} {...cat} />
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {user && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2.5">
            <div className="bg-purple-100 dark:bg-purple-950/40 p-2 rounded-xl text-purple-600 dark:text-purple-400">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Personalized For You</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Context-aware recommendations computed by Scikit-Learn TF-IDF model
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingPersonal ? (
              [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : personalized.length > 0 ? (
              personalized.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  showMatch
                  matchScore={prod.similarityScore}
                  explanation={prod.explanation}
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center bg-slate-100/50 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm">
                No browsing history yet. Explore some products below to enable personalization!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trending Products */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2.5">
          <div className="bg-rose-100 dark:bg-rose-950/40 p-2 rounded-xl text-rose-600 dark:text-rose-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Trending Items</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Top items ranked by visitor interactions and popularity scores
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingTrending ? (
            [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            trending.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                showRating
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
