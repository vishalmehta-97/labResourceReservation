import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  BookOpen, Package, RotateCcw, MapPin, Hash, ChevronRight
} from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  APPROVED: { label: 'Approved', bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  ACTIVE: { label: 'Active', bg: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  COMPLETED: { label: 'Completed', bg: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  REJECTED: { label: 'Rejected', bg: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

const TABS = [
  { key: 'upcoming', label: 'Upcoming', statuses: ['PENDING', 'APPROVED'] },
  { key: 'active', label: 'Active', statuses: ['ACTIVE'] },
  { key: 'past', label: 'Past', statuses: ['COMPLETED', 'CANCELLED', 'REJECTED'] },
];

const formatDt = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });
};

const ReservationCard = ({ reservation, onCancel }) => {
  const statusCfg = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const canCancel = ['PENDING', 'APPROVED'].includes(reservation.status);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setCancelling(true);
    try {
      await onCancel(reservation.id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{reservation.equipment_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{reservation.category}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusCfg.bg}`}>
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs truncate">{reservation.lab_location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs">{formatDt(reservation.start_time)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs">{formatDt(reservation.end_time)}</span>
        </div>
      </div>

      {reservation.purpose && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4 line-clamp-2">
          {reservation.purpose}
        </p>
      )}

      {reservation.admin_notes && (
        <div className={`text-xs rounded-lg px-3 py-2 mb-4 ${
          reservation.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          <span className="font-semibold">Admin note: </span>{reservation.admin_notes}
        </div>
      )}

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
          Cancel Reservation
        </button>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const currentTab = TABS.find(t => t.key === activeTab);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '9');
      currentTab.statuses.forEach(s => params.append('status', s));

      const res = await api.get(`/reservations/my?${params.toString()}`);
      setReservations(res.data.data.reservations);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, currentTab]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleCancel = async (id) => {
    try {
      await api.patch(`/reservations/${id}/cancel`);
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your equipment reservations</p>
        </div>
        <button
          onClick={fetchReservations}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RotateCcw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          <button onClick={fetchReservations} className="mt-4 btn-primary text-sm">Try Again</button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No {activeTab} reservations</h3>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === 'upcoming'
              ? 'Browse the equipment catalog to make a reservation.'
              : 'Your completed reservations will appear here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reservations.map((r) => (
              <ReservationCard key={r.id} reservation={r} onCancel={handleCancel} />
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
    </div>
  );
};

export default UserDashboard;
