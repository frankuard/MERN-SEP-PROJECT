import { useState, useEffect, useCallback } from 'react';
import {
  Building2, MessageSquare, Search, Plus, Pencil, Trash2,
  Phone, Mail, ChevronDown, ChevronUp, FileText, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import campusHelpApi from '../../../api/campusHelpApi';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';

const ACCENT = { blue: '#5b7c99', green: '#5c8a72' };

const formatDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TabButton = ({ active, onClick, children, count }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all duration-200"
    style={{
      backgroundColor: active ? ACCENT.green : 'transparent',
      color: active ? '#ffffff' : undefined,
    }}
  >
    {children}
    {typeof count === 'number' && (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-extrabold"
        style={{
          backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${ACCENT.green}14`,
          color: active ? '#ffffff' : ACCENT.green,
        }}
      >
        {count}
      </span>
    )}
  </button>
);

// ---------------- Department form modal (Add / Edit) ----------------
const DepartmentFormModal = ({ isOpen, onClose, t, onSave, editingDept, saving }) => {
  const [form, setForm] = useState({ key: '', title: '', phone: '', email: '' });

  useEffect(() => {
    if (editingDept) {
      setForm({
        key: editingDept.key,
        title: editingDept.title,
        phone: editingDept.phone,
        email: editingDept.email,
      });
    } else {
      setForm({ key: '', title: '', phone: '', email: '' });
    }
  }, [editingDept, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.key.trim() || !form.title.trim() || !form.phone.trim() || !form.email.trim()) {
      toast.error('All fields are required');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ backgroundColor: t.cardBg, borderColor: t.border }}
      >
        <h3 className="text-lg font-bold" style={{ color: t.textPrimary }}>
          {editingDept ? 'Edit Department' : 'Add Department'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Key (unique id, e.g. "ssd")</label>
            <input
              type="text"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              disabled={!!editingDept}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none disabled:opacity-50"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>
          <div>
            <label className="block font-bold" style={{ color: t.textPrimary }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-xl border px-3.5 py-2.5 outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer rounded-xl border px-4 py-2.5 font-bold transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
              style={{ borderColor: t.border, color: t.textPrimary }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-xl px-5 py-2.5 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: ACCENT.green }}
            >
              {saving ? 'Saving...' : editingDept ? 'Save Changes' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------- Department card ----------------
const DepartmentCard = ({ dept, t, onEdit, onDelete }) => (
  <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
          <Building2 size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-extrabold" style={{ color: t.textPrimary }}>{dept.title}</h3>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(dept)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ borderColor: t.border, color: t.textPrimary }}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(dept)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
          style={{ borderColor: '#fecaca', color: '#dc2626' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm" style={{ color: t.textPrimary }}>
        <Phone size={14} style={{ color: ACCENT.green }} />
        <span className="font-bold" style={{ color: t.textMuted }}>Phone:</span>
        {dept.phone}
      </div>
      <div className="flex items-center gap-2 text-sm" style={{ color: t.textPrimary }}>
        <Mail size={14} style={{ color: ACCENT.blue }} />
        <span className="font-bold" style={{ color: t.textMuted }}>Email:</span>
        {dept.email}
      </div>
    </div>
  </div>
);

// ---------------- Help request log card ----------------
const HelpRequestLogCard = ({ req, t, onDelete, expanded, onToggle }) => (
  <div className="rounded-2xl border p-5" style={{ backgroundColor: t.cardBg, borderColor: t.border }}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold" style={{ color: t.textPrimary }}>{req.request}</p>
        <p className="mt-1 text-xs font-semibold" style={{ color: t.textMuted }}>
          by {req.requesterName} · {req.requesterSem} · {formatDate(req.createdAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(req)}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
        style={{ borderColor: '#fecaca', color: '#dc2626' }}
      >
        <Trash2 size={13} />
      </button>
    </div>

    {req.attachments?.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {req.attachments.map((att) => (
          
           <a key={att.url}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.name}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: t.border, color: t.textMuted }}
          >
            <FileText size={11} />
            {att.name}
            <Download size={10} />
          </a>
        ))}
      </div>
    )}

    <button
      type="button"
      onClick={onToggle}
      className="mt-4 flex w-full cursor-pointer items-center justify-between border-t pt-3 text-xs font-bold"
      style={{ borderColor: t.border, color: t.textPrimary }}
    >
      <span className="flex items-center gap-1.5">
        <MessageSquare size={14} />
        {req.responses?.length || 0} responses
      </span>
      {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
    </button>

    {expanded && (
      <div className="mt-3 space-y-2.5">
        {(!req.responses || req.responses.length === 0) && (
          <p className="text-xs font-semibold" style={{ color: t.textMuted }}>No responses yet.</p>
        )}
        {req.responses?.map((r) => (
          <div
            key={r._id}
            className="rounded-xl border p-3"
            style={{ borderColor: t.border, backgroundColor: t.pageBg }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold" style={{ color: t.textPrimary }}>{r.userName}</span>
              <span className="text-[11px] font-semibold" style={{ color: t.textMuted }}>{formatDate(r.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm" style={{ color: t.textPrimary }}>{r.message}</p>
            {r.attachments?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.attachments.map((att) => (
                  
                  <a  key={att.url}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={att.name}
                    className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: t.border, color: t.textMuted }}
                  >
                    <FileText size={11} />
                    {att.name}
                    <Download size={10} />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const ManageCampusHelpSection = ({ t }) => {
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'requests'
  const [departments, setDepartments] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [savingDept, setSavingDept] = useState(false);

  const [deleteDeptTarget, setDeleteDeptTarget] = useState(null);
  const [deleteReqTarget, setDeleteReqTarget] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptData, reqData] = await Promise.all([
        campusHelpApi.getDepartments(),
        campusHelpApi.getHelpRequests(),
      ]);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setHelpRequests(Array.isArray(reqData) ? reqData : []);
    } catch {
      toast.error('Failed to load Campus Help data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveDept = async (form) => {
    setSavingDept(true);
    try {
      if (editingDept) {
        const updated = await campusHelpApi.updateDepartment(editingDept._id, form);
        setDepartments((prev) => prev.map((d) => (d._id === editingDept._id ? updated : d)));
        toast.success('Department updated');
      } else {
        const created = await campusHelpApi.createDepartment(form);
        setDepartments((prev) => [...prev, created]);
        toast.success('Department added');
      }
      setShowDeptForm(false);
      setEditingDept(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save department');
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDeptConfirm = async () => {
    if (!deleteDeptTarget) return;
    setProcessingId(deleteDeptTarget._id);
    try {
      await campusHelpApi.deleteDepartment(deleteDeptTarget._id);
      setDepartments((prev) => prev.filter((d) => d._id !== deleteDeptTarget._id));
      toast.success('Department deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    } finally {
      setProcessingId(null);
      setDeleteDeptTarget(null);
    }
  };

  const handleDeleteReqConfirm = async () => {
    if (!deleteReqTarget) return;
    setProcessingId(deleteReqTarget._id);
    try {
      await campusHelpApi.deleteHelpRequest(deleteReqTarget._id);
      setHelpRequests((prev) => prev.filter((r) => r._id !== deleteReqTarget._id));
      toast.success('Request deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete request');
    } finally {
      setProcessingId(null);
      setDeleteReqTarget(null);
    }
  };

  const filteredRequests = helpRequests.filter((r) =>
    r.request.toLowerCase().includes(searchInput.toLowerCase()) ||
    r.requesterName?.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
          <MessageSquare size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.textPrimary }}>Manage Campus Help</h2>
      </div>

      <div className="rounded-[28px] p-5 sm:p-6" style={{ backgroundColor: t.cardBg, boxShadow: t.shadowCard }}>
        <div className="flex flex-wrap items-center gap-1 rounded-full border p-1" style={{ borderColor: t.border }}>
          <TabButton active={activeTab === 'departments'} onClick={() => setActiveTab('departments')} count={departments.length}>
            Contact Info
          </TabButton>
          <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} count={helpRequests.length}>
            Peer Help Log
          </TabButton>
        </div>

        {activeTab === 'requests' && (
          <div className="relative mt-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
            <input
              type="text"
              placeholder="Search by request text or requester..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none"
              style={{ backgroundColor: t.pageBg, borderColor: t.border, color: t.textPrimary }}
            />
          </div>
        )}
      </div>

      {activeTab === 'departments' && (
        <>
          <button
            type="button"
            onClick={() => { setEditingDept(null); setShowDeptForm(true); }}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            Add Department
          </button>

          {loading && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading...
            </div>
          )}

          {!loading && departments.length === 0 && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              No departments yet. Add one to get started.
            </div>
          )}

          {!loading && departments.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {departments.map((dept) => (
                <DepartmentCard
                  key={dept._id}
                  dept={dept}
                  t={t}
                  onEdit={(d) => { setEditingDept(d); setShowDeptForm(true); }}
                  onDelete={setDeleteDeptTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'requests' && (
        <>
          {loading && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              Loading...
            </div>
          )}

          {!loading && filteredRequests.length === 0 && (
            <div className="rounded-2xl border p-8 text-center text-sm" style={{ backgroundColor: t.cardBg, borderColor: t.border, color: t.textMuted }}>
              No peer help requests found.
            </div>
          )}

          {!loading && filteredRequests.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredRequests.map((req) => (
                <HelpRequestLogCard
                  key={req._id}
                  req={req}
                  t={t}
                  onDelete={setDeleteReqTarget}
                  expanded={expandedId === req._id}
                  onToggle={() => setExpandedId((prev) => (prev === req._id ? null : req._id))}
                />
              ))}
            </div>
          )}
        </>
      )}

      <DepartmentFormModal
        isOpen={showDeptForm}
        onClose={() => { setShowDeptForm(false); setEditingDept(null); }}
        t={t}
        onSave={handleSaveDept}
        editingDept={editingDept}
        saving={savingDept}
      />

      {deleteDeptTarget && (
        <ConfirmDeleteModal
          title="Delete this department?"
          message={`This will remove "${deleteDeptTarget.title}" from the contact info list. This cannot be undone.`}
          confirmLabel="Delete"
          onCancel={() => setDeleteDeptTarget(null)}
          onConfirm={handleDeleteDeptConfirm}
          deleting={processingId === deleteDeptTarget._id}
          t={t}
        />
      )}

      {deleteReqTarget && (
        <ConfirmDeleteModal
          title="Delete this request?"
          message="This will permanently remove this peer help request and all its responses. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setDeleteReqTarget(null)}
          onConfirm={handleDeleteReqConfirm}
          deleting={processingId === deleteReqTarget._id}
          t={t}
        />
      )}
    </div>
  );
};

export default ManageCampusHelpSection;