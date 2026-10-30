import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle, Loader2, MapPin, Hash } from 'lucide-react';
import api from '../services/api';

const BookingModal = ({ equipment, onClose, onSuccess }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Compute min datetime (now + 5 minutes) in local ISO format
  const getMinDatetime = () => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  };

  const toLocalISOString = (dtLocal) => {
    // Convert local datetime-local input value to ISO string with timezone
    if (!dtLocal) return '';
    const date = new Date(dtLocal);
    return date.toISOString();
  };

  const validateForm = () => {
    const errors = {};
    const now = new Date();
    const start = startTime ? new Date(startTime) : null;
    const end = endTime ? new Date(endTime) : null;

    if (!startTime) errors.startTime = 'Start time is required.';
    else if (start <= now) errors.startTime = 'Start time must be in the future.';

    if (!endTime) errors.endTime = 'End time is required.';
    else if (end && start && end <= start) errors.endTime = 'End time must be after start time.';
    else if (end && start) {
      const hours = (end - start) / (1000 * 60 * 60);
      if (hours > 72) errors.endTime = 'Maximum booking duration is 72 hours.';
      if (hours < 0.25) errors.endTime = 'Minimum booking duration is 15 minutes.';
    }

    if (!purpose.trim()) errors.purpose = 'Purpose is required.';
    else if (purpose.trim().length < 5) errors.purpose = 'Purpose must be at least 5 characters.';
    else if (purpose.trim().length > 255) errors.purpose = 'Purpose cannot exceed 255 characters.';

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = validateForm();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await api.post('/reservations', {
        equipment_id: equipment.id,
        start_time: toLocalISOString(startTime),
        end_time: toLocalISOString(endTime),
        purpose: purpose.trim(),
      });

      onSuccess(res.data.data.reservation);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create reservation. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = () => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) return null;
    const hours = (end - start) / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    return `${hours.toFixed(1)} hours`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reserve Equipment</h2>
            <p className="text-sm text-gray-500 mt-0.5">Submit a reservation request for admin approval</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Equipment Info */}
        <div className="mx-6 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">{equipment.name}</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <MapPin className="w-3.5 h-3.5" />
              {equipment.lab_location}
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Hash className="w-3.5 h-3.5" />
              {equipment.serial_number}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Start Date & Time
                </span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                min={getMinDatetime()}
                onChange={(e) => { setStartTime(e.target.value); setValidationErrors(v => ({...v, startTime: ''})); }}
                className={`input-field text-sm ${validationErrors.startTime ? 'border-red-400 focus:ring-red-500' : ''}`}
              />
              {validationErrors.startTime && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> End Date & Time
                </span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                min={startTime || getMinDatetime()}
                onChange={(e) => { setEndTime(e.target.value); setValidationErrors(v => ({...v, endTime: ''})); }}
                className={`input-field text-sm ${validationErrors.endTime ? 'border-red-400 focus:ring-red-500' : ''}`}
              />
              {validationErrors.endTime && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.endTime}</p>
              )}
            </div>
          </div>

          {getDuration() && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              Duration: <strong>{getDuration()}</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Purpose / Reason for Reservation
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => { setPurpose(e.target.value); setValidationErrors(v => ({...v, purpose: ''})); }}
              placeholder="Describe the purpose of this reservation (e.g., 'ECE 301 Lab Assignment 3 – Signal Analysis')"
              className={`input-field text-sm resize-none ${validationErrors.purpose ? 'border-red-400 focus:ring-red-500' : ''}`}
            />
            <div className="flex items-center justify-between mt-1">
              {validationErrors.purpose
                ? <p className="text-xs text-red-500">{validationErrors.purpose}</p>
                : <span />
              }
              <p className="text-xs text-gray-400">{purpose.length}/255</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Calendar className="w-4 h-4" /> Submit Request</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
