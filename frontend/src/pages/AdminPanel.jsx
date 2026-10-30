import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Package, Users, Calendar, CheckCircle, XCircle,
  Clock, AlertCircle, Loader2, Search, RefreshCw, ChevronDown,
  Plus, Edit2, Trash2, RotateCcw, MapPin, Hash, Tag, X, Save
} from 'lucide-react';
import api from '../services/api';

/* ─── Status helpers ────────────────────────────────────────────── */
const RESERVATION_STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-100 text-amber-700 border-amber-200' },
  APPROVED:  { label: 'Approved',  bg: 'bg-blue-100  text-blue-700  border-blue-200'  },
  ACTIVE:    { label: 'Active',    bg: 'bg-green-100 text-green-700 border-green-200' },
  COMPLETED: { label: 'Completed', bg: 'bg-gray-100  text-gray-700  border-gray-200'  },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100   text-red-700   border-red-200'   },
  REJECTED:  { label: 'Rejected',  bg: 'bg-red-100   text-red-700   border-red-200'   },
};

const EQUIPMENT_STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available',   bg: 'bg-green-100 text-green-700 border-green-200' },
  MAINTENANCE: { label: 'Maintenance', bg: 'bg-amber-100 text-amber-700 border-amber-200' },
  RETIRED:     { label: 'Retired',     bg: 'bg-red-100   text-red-700   border-red-200'   },
};

const CATEGORIES = [
  'Electronics', 'Microcontroller', 'Single Board Computer', 'Measurement',
  'Workshop Tool', 'Signal Generator', '3D Printing', 'Networking',
  'Power Equipment', 'Digital Design',
];

const formatDt = (dt) => {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

/* ─── Equipment Form Modal ──────────────────────────────────────── */
const EquipmentFormModal = ({ equipment, onClose, onSaved }) => {
  const isEdit = !!equipment;
  const [form, setForm] = useState({
    name: equipment?.name || '',
    description: equipment?.description || '',
    category: equipment?.category || CATEGORIES[0],
    serial_number: equipment?.serial_number || '',
    lab_location: equipment?.lab_location || '',
    status: equipment?.status || 'AVAILABLE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.serial_number.trim() || !form.lab_location.trim()) {
      setError('Name, serial number, and location are required.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/equipment/${equipment.id}`, form);
      } else {
        await api.post('/equipment', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save equipment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Equipment' : 'Add New Equipment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Equipment Name *</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Oscilloscope Rigol DS1054Z" className="input-field" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="Brief description of the equipment..."
              className="input-field resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-field">
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Serial Number *</label>
            <input name="serial_number" value={form.serial_number} onChange={handleChange}
              placeholder="e.g. DS1054Z-001" className="input-field font-mono" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lab Location *</label>
            <input name="lab_location" value={form.lab_location} onChange={handleChange}
              placeholder="e.g. Electronics Lab – Room 201" className="input-field" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Add Equipment'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Review Modal ──────────────────────────────────────────────── */
const ReviewModal = ({ reservation, onClose, onReviewed }) => {
  const [action, setAction] = useState('APPROVED');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (action === 'REJECTED' && !notes.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/reservations/${reservation.id}/review`, {
        status: action,
        admin_notes: notes.trim() || undefined,
      });
      onReviewed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Review Reservation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm space-y-1">
          <p className="font-semibold text-gray-900">{reservation.equipment_name}</p>
          <p className="text-gray-500">Requested by: <span className="text-gray-700 font-medium">{reservation.user_name}</span></p>
          <p className="text-gray-500">From: <span className="text-gray-700">{formatDt(reservation.start_time)}</span></p>
          <p className="text-gray-500">To: <span className="text-gray-700">{formatDt(reservation.end_time)}</span></p>
          {reservation.purpose && (
            <p className="text-gray-500">Purpose: <span className="text-gray-700">{reservation.purpose}</span></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setAction('APPROVED')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                action === 'APPROVED'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-green-300'
              }`}>
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button type="button" onClick={() => setAction('REJECTED')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                action === 'REJECTED'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-red-300'
              }`}>
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Admin Notes {action === 'REJECTED' && <span className="text-red-500">*</span>}
            </label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={action === 'REJECTED' ? 'Reason for rejection (required)...' : 'Optional notes for the user...'}
              className="input-field resize-none text-sm" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 btn-secondary text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                action === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50`}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                : action === 'APPROVED' ? 'Approve' : 'Reject'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Stats Card ────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

/* ─── Admin Panel ───────────────────────────────────────────────── */
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [equipFormTarget, setEquipFormTarget] = useState(null); // null = closed, false = new, obj = edit
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* Stats */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch {}
  }, []);

  /* Reservations */
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/admin/reservations?${params.toString()}`);
      setReservations(res.data.data.reservations);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  /* Equipment */
  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/equipment?${params.toString()}`);
      setEquipment(res.data.data.equipment);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load equipment.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    setPage(1);
    setSearch('');
  }, [activeTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === 'reservations') fetchReservations();
      else fetchEquipment();
    }, 300);
    return () => clearTimeout(t);
  }, [activeTab, fetchReservations, fetchEquipment]);

  const handleDeleteEquipment = async (id) => {
    try {
      await api.delete(`/equipment/${id}`);
      setDeleteConfirm(null);
      fetchEquipment();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete equipment.');
    }
  };

  const handleReviewed = () => {
    setReviewTarget(null);
    fetchReservations();
    fetchStats();
  };

  const handleEquipSaved = () => {
    setEquipFormTarget(null);
    fetchEquipment();
    fetchStats();
  };

  const RESERVATION_STATUSES = ['', 'PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage reservations and equipment</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Equipment" value={stats.total_equipment} icon={Package} color="bg-blue-500" />
          <StatCard label="Pending Reviews" value={stats.pending_reservations} icon={Clock} color="bg-amber-500" />
          <StatCard label="Active Now" value={stats.active_reservations} icon={CheckCircle} color="bg-green-500" />
          <StatCard label="Total Users" value={stats.total_users} icon={Users} color="bg-purple-500" />
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        {[
          { key: 'reservations', label: 'Reservations', icon: Calendar },
          { key: 'equipment', label: 'Equipment', icon: Package },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={activeTab === 'reservations' ? 'Search by equipment or user...' : 'Search equipment...'}
            className="input-field pl-10 text-sm" />
        </div>

        {activeTab === 'reservations' && (
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field text-sm w-auto min-w-[160px]">
            <option value="">All Statuses</option>
            {RESERVATION_STATUSES.filter(Boolean).map(s => (
              <option key={s} value={s}>{RESERVATION_STATUS_CONFIG[s]?.label || s}</option>
            ))}
          </select>
        )}

        {activeTab === 'equipment' && (
          <button onClick={() => setEquipFormTarget(false)}
            className="btn-primary text-sm flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        )}

        <button onClick={activeTab === 'reservations' ? fetchReservations : fetchEquipment}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0" title="Refresh">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
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
        </div>
      ) : activeTab === 'reservations' ? (
        /* Reservations Table */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Equipment', 'User', 'Start', 'End', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">No reservations found.</td>
                  </tr>
                ) : reservations.map((r) => {
                  const cfg = RESERVATION_STATUS_CONFIG[r.status] || {};
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[160px]">{r.equipment_name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{r.lab_location}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 truncate max-w-[120px]">{r.user_name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">{r.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDt(r.start_time)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDt(r.end_time)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'PENDING' && (
                          <button onClick={() => setReviewTarget(r)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50">
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Equipment Table */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Category', 'Serial', 'Location', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">No equipment found.</td>
                  </tr>
                ) : equipment.map((eq) => {
                  const cfg = EQUIPMENT_STATUS_CONFIG[eq.status] || {};
                  return (
                    <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{eq.name}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]">{eq.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{eq.serial_number}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[140px]">{eq.lab_location}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEquipFormTarget(eq)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(eq)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Modals */}
      {reviewTarget && (
        <ReviewModal reservation={reviewTarget} onClose={() => setReviewTarget(null)} onReviewed={handleReviewed} />
      )}

      {equipFormTarget !== null && (
        <EquipmentFormModal
          equipment={equipFormTarget || null}
          onClose={() => setEquipFormTarget(null)}
          onSaved={handleEquipSaved}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Equipment</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary text-sm">Cancel</button>
              <button onClick={() => handleDeleteEquipment(deleteConfirm.id)} className="flex-1 btn-danger text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
