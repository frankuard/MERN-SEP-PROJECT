import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Calendar, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import uploadApi from '../../../api/uploadApi';

const CreateCourseworkModal = ({
  t,
  isOpen,
  onClose,
  onSubmit,
  assignedClasses = [],
  editingCoursework = null,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    moduleCode: '',
    moduleName: '',
    targetGroup: '',
    dueDate: '',
    totalMarks: 100,
    attachments: [],
  });

  const [availableGroups, setAvailableGroups] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCoursework) {
      setFormData({
        title: editingCoursework.title || '',
        description: editingCoursework.description || '',
        moduleCode: editingCoursework.moduleCode || '',
        moduleName: editingCoursework.moduleName || '',
        targetGroup: editingCoursework.targetGroup || '',
        dueDate: editingCoursework.dueDate
          ? new Date(editingCoursework.dueDate).toISOString().slice(0, 16)
          : '',
        totalMarks: editingCoursework.totalMarks || 100,
        attachments: editingCoursework.attachments || [],
      });

      const matchedClass = assignedClasses.find(
        (c) => c.moduleCode === editingCoursework.moduleCode
      );
      setAvailableGroups(matchedClass ? matchedClass.groups : [editingCoursework.targetGroup]);
    } else {
      // Default to first assigned module if available
      if (assignedClasses.length > 0) {
        const first = assignedClasses[0];
        setFormData({
          title: '',
          description: '',
          moduleCode: first.moduleCode,
          moduleName: first.moduleName,
          targetGroup: first.groups[0] || '',
          dueDate: '',
          totalMarks: 100,
          attachments: [],
        });
        setAvailableGroups(first.groups || []);
      } else {
        setFormData({
          title: '',
          description: '',
          moduleCode: '',
          moduleName: '',
          targetGroup: '',
          dueDate: '',
          totalMarks: 100,
          attachments: [],
        });
        setAvailableGroups([]);
      }
    }
  }, [editingCoursework, assignedClasses, isOpen]);

  if (!isOpen) return null;

  const handleModuleChange = (e) => {
    const selectedCode = e.target.value;
    const selected = assignedClasses.find((c) => c.moduleCode === selectedCode);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        moduleCode: selected.moduleCode,
        moduleName: selected.moduleName,
        targetGroup: selected.groups[0] || '',
      }));
      setAvailableGroups(selected.groups || []);
    } else {
      setFormData((prev) => ({ ...prev, moduleCode: selectedCode, targetGroup: '' }));
      setAvailableGroups([]);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const res = await uploadApi.uploadDocument(file, 'coursework');
      const newAttachment = {
        name: res.name || file.name,
        url: res.url,
        fileType: file.type || 'application/octet-stream',
        size: file.size,
      };
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment],
      }));
      toast.success(`Attached ${file.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Please enter a coursework title');
    if (!formData.description.trim()) return toast.error('Please enter description/instructions');
    if (!formData.moduleCode) return toast.error('Please select a module');
    if (!formData.targetGroup) return toast.error('Please select a target group');
    if (!formData.dueDate) return toast.error('Please select a due date');

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coursework');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border shadow-2xl transition-all"
        style={{
          backgroundColor: t.cardBg,
          borderColor: t.border,
          color: t.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-5"
          style={{ borderColor: t.border }}
        >
          <div>
            <h3 className="text-lg font-bold sm:text-xl">
              {editingCoursework ? 'Edit Coursework' : 'Assign New Coursework'}
            </h3>
            <p className="text-xs font-medium" style={{ color: t.textMuted }}>
              Restricted to your assigned timetable modules and cohort groups
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: t.pageBg, color: t.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {assignedClasses.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl p-4 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertCircle size={18} className="shrink-0" />
              <span>No timetable modules currently assigned to your account.</span>
            </div>
          )}

          {/* Module & Group Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
                Module (Your Assigned Modules) *
              </label>
              <select
                value={formData.moduleCode}
                onChange={handleModuleChange}
                disabled={!!editingCoursework || assignedClasses.length === 0}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium focus:outline-none"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
              >
                {assignedClasses.map((c) => (
                  <option key={c.moduleCode} value={c.moduleCode}>
                    {c.moduleCode} - {c.moduleName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
                Target Cohort Group *
              </label>
              <select
                value={formData.targetGroup}
                onChange={(e) => setFormData((p) => ({ ...p, targetGroup: e.target.value }))}
                disabled={!!editingCoursework || availableGroups.length === 0}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium focus:outline-none"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
              >
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px]" style={{ color: t.textMuted }}>
                Only groups you teach for this module
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
              Coursework Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Assessment 1: Algorithm Complexity Analysis"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium focus:outline-none"
              style={{
                backgroundColor: t.pageBg,
                borderColor: t.border,
                color: t.textPrimary,
              }}
              required
            />
          </div>

          {/* Due Date & Marks */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
                Due Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium focus:outline-none"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
                Total Marks
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.totalMarks}
                onChange={(e) => setFormData((p) => ({ ...p, totalMarks: e.target.value }))}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium focus:outline-none"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
              Instructions & Problem Description *
            </label>
            <textarea
              rows={5}
              placeholder="Detail the coursework requirements, evaluation criteria, and expected deliverables..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full rounded-xl border p-3.5 text-sm font-medium focus:outline-none"
              style={{
                backgroundColor: t.pageBg,
                borderColor: t.border,
                color: t.textPrimary,
              }}
              required
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>
                Reference Materials / Brief Attachments
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-opacity hover:opacity-80 border"
                style={{
                  backgroundColor: t.pageBg,
                  borderColor: t.border,
                  color: t.textPrimary,
                }}
              >
                {uploadingFile ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                <span>Upload Document</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>
            </div>

            {formData.attachments.length > 0 ? (
              <div className="space-y-2">
                {formData.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border p-2.5 text-xs"
                    style={{ backgroundColor: t.pageBg, borderColor: t.border }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={15} style={{ color: t.accentEmerald }} />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-semibold underline hover:opacity-80"
                      >
                        {att.name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="ml-2 text-rose-500 hover:opacity-80"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs italic" style={{ color: t.textMuted }}>
                No reference files attached yet (optional).
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: t.border }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ backgroundColor: t.pageBg, color: t.textMuted }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || assignedClasses.length === 0}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: t.textPrimary,
                color: t.cardBg,
              }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>{editingCoursework ? 'Update Coursework' : 'Publish Coursework'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseworkModal;
