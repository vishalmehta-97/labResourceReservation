import React, { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, FlaskConical, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import EquipmentCard from '../components/EquipmentCard';
import BookingModal from '../components/BookingModal';

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

const CatalogPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/equipment/categories');
      setCategories(res.data.data.categories);
    } catch {}
  }, []);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      params.set('page', page);
      params.set('limit', '12');

      const res = await api.get(`/equipment?${params.toString()}`);
      setEquipment(res.data.data.equipment);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load equipment.');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const t = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(t);
  }, [fetchEquipment]);

  const handleReserveSuccess = (reservation) => {
    setSelectedEquipment(null);
    setSuccessMsg(`Reservation submitted for "${reservation.equipment_name}". Awaiting admin approval.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleCategory = (cat) => { setCategory(cat === category ? '' : cat); setPage(1); };
  const handleStatus = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination ? `${pagination.total} items available` : 'Browse all lab equipment'}
          </p>
        </div>
        <button onClick={fetchEquipment} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4 mb-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, serial number, or location..."
            className="input-field pl-11 text-sm"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatus(s.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                status === s.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {s.label}
            </button>
          ))}

          {categories.length > 0 && (
            <>
              <span className="text-gray-300 mx-1">|</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                    category === cat
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </>
          )}

          {(search || category || status) && (
            <button
              onClick={() => { setSearch(''); setCategory(''); setStatus(''); setPage(1); }}
              className="px-3 py-1 rounded-full text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button onClick={fetchEquipment} className="mt-4 btn-primary text-sm">Try Again</button>
        </div>
      ) : equipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FlaskConical className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No equipment found</h3>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {equipment.map((item) => (
              <EquipmentCard key={item.id} equipment={item} onReserve={setSelectedEquipment} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {selectedEquipment && (
        <BookingModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onSuccess={handleReserveSuccess}
        />
      )}
    </div>
  );
};

export default CatalogPage;
