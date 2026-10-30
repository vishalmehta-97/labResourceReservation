import React from 'react';
import { MapPin, Tag, Hash, CircleDot, Calendar } from 'lucide-react';

const statusConfig = {
  AVAILABLE: { label: 'Available', class: 'bg-green-100 text-green-700 border-green-200' },
  MAINTENANCE: { label: 'Maintenance', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  RETIRED: { label: 'Retired', class: 'bg-red-100 text-red-700 border-red-200' },
};

const categoryColors = {
  Electronics: 'bg-blue-50 text-blue-700',
  Microcontroller: 'bg-purple-50 text-purple-700',
  'Single Board Computer': 'bg-indigo-50 text-indigo-700',
  Measurement: 'bg-cyan-50 text-cyan-700',
  'Workshop Tool': 'bg-orange-50 text-orange-700',
  'Signal Generator': 'bg-teal-50 text-teal-700',
  '3D Printing': 'bg-pink-50 text-pink-700',
  Networking: 'bg-green-50 text-green-700',
  'Power Equipment': 'bg-yellow-50 text-yellow-700',
  'Digital Design': 'bg-violet-50 text-violet-700',
};

const EquipmentCard = ({ equipment, onReserve }) => {
  const status = statusConfig[equipment.status] || statusConfig.AVAILABLE;
  const catColor = categoryColors[equipment.category] || 'bg-gray-50 text-gray-700';
  const isAvailable = equipment.status === 'AVAILABLE';

  return (
    <div className="card hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-base font-semibold text-gray-900 leading-snug flex-1">
            {equipment.name}
          </h3>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${status.class}`}>
            <CircleDot className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {equipment.description && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
            {equipment.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{equipment.lab_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Hash className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
              {equipment.serial_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400 shrink-0" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${catColor}`}>
              {equipment.category}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <button
          onClick={() => onReserve(equipment)}
          disabled={!isAvailable}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isAvailable
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {isAvailable ? 'Reserve Now' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default EquipmentCard;
