import React from 'react';
import { School } from 'lucide-react';
import { CLASSROOM_POOL } from '../../data/studentDashboardData';

const VacantClassesSection = ({
  t,
  classPermissions,
  onTakePermission,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="text-emerald-600" size={24} />
          <h2 className="text-2xl font-bold" style={{ color: t.textPrimary }}>
            Vacant Classrooms
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('dashboard')}
          className="rounded-xl border px-3.5 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CLASSROOM_POOL.map((room) => {
          const status = classPermissions[room.id] || 'vacant';
          return (
            <div
              key={room.id}
              className="flex flex-col justify-between rounded-2xl border p-5 shadow-xs"
              style={{ backgroundColor: t.cardBg || '#ffffff', borderColor: t.border }}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
                      {room.name}
                    </h3>
                    <p className="text-xs" style={{ color: t.textMuted }}>
                      {room.block}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      status === 'vacant'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'pending'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {status === 'vacant' ? 'Vacant' : status === 'pending' ? 'Pending' : 'Approved'}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 border-t pt-3 text-xs" style={{ borderColor: t.border, color: t.textMuted }}>
                  <p>Capacity: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.capacity} seats</span></p>
                  <p>Amenities: <span className="font-semibold" style={{ color: t.textPrimary }}>{room.facilities}</span></p>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => onTakePermission(room.id)}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all ${
                    status === 'vacant'
                      ? 'bg-[#2f4336] hover:bg-[#25362b]'
                      : status === 'pending'
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {status === 'vacant' ? 'Take Permission' : status === 'pending' ? 'Permission Pending' : 'Approved (Release)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VacantClassesSection;
