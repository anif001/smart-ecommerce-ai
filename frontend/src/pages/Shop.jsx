import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const searchVal = searchParams.get('search') || '';
  const categoryVal = searchParams.get('category') || '';
  const pageVal = parseInt(searchParams.get('page')) || 0;
  const sortVal = searchParams.get('sortBy') || 'id';
  const directionVal = searchParams.get('direction') || 'desc';

  const [searchField, setSearchField] = useState(searchVal);
  const [categoryFilter, setCategoryFilter] = useState(categoryVal);
  const [sortBy, setSortBy] = useState(sortVal);
  const [direction, setDirection] = useState(directionVal);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = ['Electronics', 'Fashion', 'Home & Kitchen'];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page: pageVal, size: 8, sortBy, direction };
        if (searchVal) params.search = searchVal;
        else if (categoryFilter) params.category = categoryFilter;

        const res = await API.get('/api/products', { params });
        setProducts(res.data.content);
        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch shop products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchVal, categoryFilter, pageVal, sortBy, direction]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchField, sortBy, direction, page: 0 });
  };

  const selectCategory = (catName) => {
    const newCat = categoryFilter === catName ? '' : catName;
    setCategoryFilter(newCat);
    setSearchParams({ category: newCat, sortBy, direction, page: 0 });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    let newSort = 'id', newDir = 'desc';
    if (val === 'price-asc') { newSort = 'price'; newDir = 'asc'; }
    else if (val === 'price-desc') { newSort = 'price'; newDir = 'desc'; }
    else if (val === 'popularity') { newSort = 'popularityScore'; newDir = 'desc'; }
    else if (val === 'rating') { newSort = 'averageRating'; newDir = 'desc'; }
    setSortBy(newSort);
    setDirection(newDir);
    setSearchParams({ search: searchVal, category: categoryFilter, sortBy: newSort, direction: newDir, page: 0 });
  };

  const navigatePage = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setSearchParams({ search: searchVal, category: categoryFilter, sortBy, direction, page: newPage });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Our Catalog</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Search and filter through our intelligent stock lists</p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search products..."
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all font-medium text-sm"
          />
          <button type="submit" className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={18} />
          </button>
        </form>
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden flex items-center space-x-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
          <div className="relative flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-sm font-medium">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select value={`${sortBy}-${direction}`} onChange={handleSortChange} className="bg-transparent outline-none cursor-pointer pr-4 font-semibold text-xs">
              <option value="id-desc">Latest Added</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popularity-desc">Popularity</option>
              <option value="rating-desc">Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden md:block space-y-6">
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Categories</h3>
            <div className="space-y-3">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => selectCategory(cat)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-between ${
                    categoryFilter === cat
                      ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-500/10'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  {categoryFilter === cat && <span className="text-xs">&bull;</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Filter Sheet */}
        {mobileFiltersOpen && (
          <div className="md:hidden glass-panel border border-slate-200/50 dark:border-slate-800/30 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Filter Category</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => { selectCategory(cat); setMobileFiltersOpen(false); }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                    categoryFilter === cat
                      ? 'bg-primary-600 text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Catalog Grid */}
        <div className="col-span-1 md:col-span-3 space-y-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} showRating />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
              <p className="font-bold text-lg mb-1">No products found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
              <Link to="/shop" className="text-primary-500 hover:underline text-xs font-bold mt-3 inline-block">
                Clear all filters
              </Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 border-t border-slate-200 dark:border-slate-900 pt-6">
              <button
                disabled={pageVal === 0}
                onClick={() => navigatePage(pageVal - 1)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold">Page {pageVal + 1} of {totalPages}</span>
              <button
                disabled={pageVal === totalPages - 1}
                onClick={() => navigatePage(pageVal + 1)}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
