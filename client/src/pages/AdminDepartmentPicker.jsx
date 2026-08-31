import React from 'react';
import { useNavigate } from 'react-router-dom';

const DEPARTMENTS = [
  { key: 'super', label: 'Super Admin', desc: 'Full access to every section' },
  { key: 'canteen', label: 'Canteen Admin', desc: 'Manage Canteen' },
  { key: 'ssd', label: 'SSD Admin', desc: 'SSD, Attendance & Campus Help' },
  { key: 'rte', label: 'RTE Admin', desc: 'Manage Timetable' },
  { key: 'resources', label: 'Resources Admin', desc: 'Resources & Lost and Found' },
];

const AdminDepartmentPicker = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-extrabold text-white">Admin Panels</h1>
        <p className="mt-1 text-sm text-neutral-400">Select a department to sign in to.</p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.key}
              type="button"
              onClick={() => navigate(`/admin/dept/${dept.key}`)}
              className="flex min-h-40 flex-col justify-between gap-4 rounded-2xl border border-neutral-700 bg-neutral-900 p-7 text-left transition-all duration-150 hover:border-white hover:bg-neutral-800 hover:-translate-y-0.5"
            >
              <div>
                <p className="text-lg font-bold text-white">{dept.label}</p>
                <p className="mt-1.5 text-sm text-neutral-400">{dept.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDepartmentPicker;