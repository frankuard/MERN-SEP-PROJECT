import React, { useEffect, useState } from "react";
import {
  Calendar,
  School,
  History,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  MapPin,
  User,
  BookOpen,
  Loader2,
} from "lucide-react";

import timetableApi from "../../../api/timetableApi";
import classroomApi from "../../../api/classroomApi";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const DAY_SHORT = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

const EMPTY_PERIOD = {
  day: "Sunday",
  time: "",
  classType: "Lecture",
  moduleCode: "",
  moduleName: "",
  lecturer: "",
  group: "",
  room: "",
  order: 1,
};

const EMPTY_ROOM = {
  roomName: "",
  block: "",
  day: "Sunday",
  capacity: "",
  facilities: "",
  availableFrom: "",
  availableTo: "",
  isAvailable: true,
};

const EMPTY_CHANGE = {
  moduleCode: "",
  moduleName: "",
  classType: "Lecture",
  group: "",
  originalSchedule: "",
  newSchedule: "",
  reason: "",
  effectiveDate: "",
  publishedBy: "",
  status: "Time Changed",
  badgeColor: "amber",
};

const ManageTimetableSection = ({ t }) => {
  const [activeTab, setActiveTab] = useState("schedule");
  const [activeDay, setActiveDay] = useState("Sunday");

  const [periods, setPeriods] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [changes, setChanges] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [modal, setModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  const loadPeriods = async () => {
    try {
      const data = await timetableApi.getTimetableAdmin();
      setPeriods(data);
    } catch (error) {
      console.error("Failed to load timetable:", error);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await classroomApi.getAllVacantClassrooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to load classrooms:", error);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await classroomApi.getClassroomRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to load classroom requests:", error);
    }
  };

  const loadChanges = async () => {
    try {
      const data = await timetableApi.getScheduleChangesAdmin();
      setChanges(data);
    } catch (error) {
      console.error("Failed to load schedule changes:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);

    await Promise.all([
      loadPeriods(),
      loadRooms(),
      loadRequests(),
      loadChanges(),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // PERIOD CRUD
  // =========================================================

  const openAddPeriod = () => {
    setEditingItem(null);
    setModal({
      type: "period",
      data: { ...EMPTY_PERIOD, day: activeDay },
    });
  };

  const openEditPeriod = (period) => {
    setEditingItem(period);
    setModal({
      type: "period",
      data: { ...period },
    });
  };

  const savePeriod = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingItem) {
        await timetableApi.updatePeriod(
          editingItem._id,
          modal.data
        );
      } else {
        await timetableApi.createPeriod(modal.data);
      }

      await loadPeriods();
      setModal(null);
      setEditingItem(null);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not save class schedule"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deletePeriod = async (id) => {
    if (!window.confirm("Delete this class schedule?")) return;

    try {
      await timetableApi.deletePeriod(id);
      await loadPeriods();
    } catch (error) {
      alert("Could not delete class schedule");
    }
  };

  // =========================================================
  // VACANT CLASSROOM CRUD
  // =========================================================

  const openAddRoom = () => {
    setEditingItem(null);
    setModal({
      type: "room",
      data: { ...EMPTY_ROOM, day: activeDay },
    });
  };

  const openEditRoom = (room) => {
    setEditingItem(room);
    setModal({
      type: "room",
      data: { ...room },
    });
  };

  const saveRoom = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingItem) {
        await classroomApi.updateVacantClassroom(
          editingItem._id,
          modal.data
        );
      } else {
        await classroomApi.createVacantClassroom(modal.data);
      }

      await loadRooms();
      setModal(null);
      setEditingItem(null);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not save classroom"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm("Delete this vacant classroom?")) return;

    try {
      await classroomApi.deleteVacantClassroom(id);
      await loadRooms();
    } catch (error) {
      alert("Could not delete classroom");
    }
  };

  // =========================================================
  // SCHEDULE CHANGES CRUD
  // =========================================================

  const openAddChange = () => {
    setEditingItem(null);
    setModal({
      type: "change",
      data: { ...EMPTY_CHANGE },
    });
  };

  const openEditChange = (change) => {
    setEditingItem(change);
    setModal({
      type: "change",
      data: { ...change },
    });
  };

  const saveChange = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingItem) {
        await timetableApi.updateScheduleChange(
          editingItem._id,
          modal.data
        );
      } else {
        await timetableApi.createScheduleChange(modal.data);
      }

      await loadChanges();
      setModal(null);
      setEditingItem(null);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not save schedule change"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const deleteChange = async (id) => {
    if (!window.confirm("Delete this schedule change?")) return;

    try {
      await timetableApi.deleteScheduleChange(id);
      await loadChanges();
    } catch (error) {
      alert("Could not delete schedule change");
    }
  };

  // =========================================================
  // REQUEST APPROVAL
  // =========================================================

  const updateRequest = async (id, status) => {
    setActionLoading(true);

    try {
      await classroomApi.updateRequestStatus(id, { status });
      await loadRequests();
    } catch (error) {
      alert(`Could not ${status} request`);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // FORM CHANGE HELPER
  // =========================================================

  const updateModalField = (field, value) => {
    setModal((current) => ({
      ...current,
      data: {
        ...current.data,
        [field]: value,
      },
    }));
  };

  // =========================================================
  // FILTERED DATA
  // =========================================================

  const dayPeriods = periods.filter(
    (period) => period.day === activeDay
  );

  const dayRooms = rooms.filter(
    (room) => room.day === activeDay
  );

  // =========================================================
  // REUSABLE UI
  // =========================================================

  const DaySelector = () => (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => setActiveDay(day)}
          className="rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors sm:text-sm"
          style={{
            backgroundColor:
              activeDay === day ? t.accentPrimary : t.cardBg,
            borderColor:
              activeDay === day ? t.accentPrimary : t.border,
            color:
              activeDay === day ? t.pageBg : t.textPrimary,
          }}
        >
          {DAY_SHORT[day]}
        </button>
      ))}
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors"
      style={{
        backgroundColor:
          activeTab === id ? t.accentPrimary : "transparent",
        color:
          activeTab === id ? t.pageBg : t.textPrimary,
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );

  if (loading) {
    return (
      <div
        className="flex min-h-[250px] items-center justify-center"
        style={{ color: t.textMuted }}
      >
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: t.chipBg }}
        >
          <Calendar size={19} style={{ color: t.textPrimary }} />
        </div>

        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ color: t.textPrimary }}
          >
            Manage Timetable
          </h2>
          <p
            className="mt-0.5 text-sm font-semibold"
            style={{ color: t.textMuted }}
          >
            Manage classes, vacant classrooms and schedule changes
          </p>
        </div>
      </div>

      {/* MAIN TABS */}
      <div
        className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1"
        style={{ borderColor: t.border }}
      >
        <TabButton
          id="schedule"
          label="Class Schedule"
          icon={Calendar}
        />

        <TabButton
          id="vacant"
          label="Vacant Classrooms"
          icon={School}
        />

        <TabButton
          id="changes"
          label="Temporary Changes"
          icon={History}
        />
      </div>

      {/* =====================================================
          CLASS SCHEDULE
      ===================================================== */}
      {activeTab === "schedule" && (
        <div className="space-y-5">
          <DaySelector />

          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  className="text-base font-bold"
                  style={{ color: t.textPrimary }}
                >
                  {activeDay} Classes
                </h3>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: t.textMuted }}
                >
                  {dayPeriods.length} class
                  {dayPeriods.length !== 1 ? "es" : ""} scheduled
                </p>
              </div>

              <button
                type="button"
                onClick={openAddPeriod}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                style={{ backgroundColor: t.accentPrimary }}
              >
                <Plus size={15} />
                Add Class
              </button>
            </div>

            {dayPeriods.length === 0 ? (
              <div
                className="rounded-xl border border-dashed p-8 text-center"
                style={{
                  borderColor: t.border,
                  backgroundColor: t.pageBg,
                }}
              >
                <Calendar
                  size={22}
                  className="mx-auto mb-2"
                  style={{ color: t.textMuted }}
                />
                <p
                  className="text-sm font-bold"
                  style={{ color: t.textPrimary }}
                >
                  No classes scheduled
                </p>
                <p
                  className="mt-1 text-xs"
                  style={{ color: t.textMuted }}
                >
                  Add a class schedule for {activeDay}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {dayPeriods.map((period) => (
                  <div
                    key={period._id}
                    className="rounded-xl border p-4"
                    style={{
                      backgroundColor: t.pageBg,
                      borderColor: t.border,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="flex items-center gap-1.5 text-xs font-bold"
                        style={{ color: t.textMuted }}
                      >
                        <Clock size={13} />
                        {period.time}
                      </span>

                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditPeriod(period)}
                          className="rounded-lg p-2"
                          style={{ color: t.textPrimary }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => deletePeriod(period._id)}
                          className="rounded-lg p-2 text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p
                        className="text-[11px] font-bold uppercase"
                        style={{ color: t.textMuted }}
                      >
                        {period.moduleCode}
                        {period.group ? ` · ${period.group}` : ""}
                      </p>

                      <p
                        className="text-sm font-bold"
                        style={{ color: t.textPrimary }}
                      >
                        {period.moduleName}
                      </p>
                    </div>

                    <div
                      className="mt-3 space-y-1.5 border-t pt-3 text-xs"
                      style={{
                        borderColor: t.border,
                        color: t.textMuted,
                      }}
                    >
                      <p className="flex items-center gap-1.5">
                        <User size={12} />
                        {period.lecturer}
                      </p>

                      <p className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        {period.room}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          VACANT CLASSROOMS
      ===================================================== */}
      {activeTab === "vacant" && (
        <div className="space-y-5">
          <DaySelector />

          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  className="text-base font-bold"
                  style={{ color: t.textPrimary }}
                >
                  {activeDay} Vacant Classrooms
                </h3>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: t.textMuted }}
                >
                  Manage available classrooms for this day
                </p>
              </div>

              <button
                type="button"
                onClick={openAddRoom}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                style={{ backgroundColor: t.accentPrimary }}
              >
                <Plus size={15} />
                Add Classroom
              </button>
            </div>

            {dayRooms.length === 0 ? (
              <div
                className="rounded-xl border border-dashed p-8 text-center"
                style={{
                  borderColor: t.border,
                  backgroundColor: t.pageBg,
                }}
              >
                <School
                  size={22}
                  className="mx-auto mb-2"
                  style={{ color: t.textMuted }}
                />
                <p
                  className="text-sm font-bold"
                  style={{ color: t.textPrimary }}
                >
                  No vacant classrooms
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dayRooms.map((room) => (
                  <div
                    key={room._id}
                    className="rounded-xl border p-4"
                    style={{
                      backgroundColor: t.pageBg,
                      borderColor: t.border,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className="text-sm font-bold"
                          style={{ color: t.textPrimary }}
                        >
                          {room.roomName}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: t.textMuted }}
                        >
                          {room.block}
                        </p>
                      </div>

                      <div className="flex">
                        <button
                          onClick={() => openEditRoom(room)}
                          className="p-2"
                          style={{ color: t.textPrimary }}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => deleteRoom(room._id)}
                          className="p-2 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div
                      className="mt-3 border-t pt-3 text-xs"
                      style={{
                        borderColor: t.border,
                        color: t.textMuted,
                      }}
                    >
                      <p>
                        Available:{" "}
                        <span
                          className="font-semibold"
                          style={{ color: t.textPrimary }}
                        >
                          {room.availableFrom} – {room.availableTo}
                        </span>
                      </p>

                      <p className="mt-1">
                        Capacity: {room.capacity} seats
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REQUESTS */}
          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            <div className="mb-5">
              <h3
                className="text-base font-bold"
                style={{ color: t.textPrimary }}
              >
                Classroom Requests
              </h3>
              <p
                className="mt-0.5 text-xs"
                style={{ color: t.textMuted }}
              >
                Review student requests for vacant classrooms
              </p>
            </div>

            {requests.length === 0 ? (
              <p
                className="py-6 text-center text-sm"
                style={{ color: t.textMuted }}
              >
                No classroom requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      borderColor: t.border,
                      backgroundColor: t.pageBg,
                    }}
                  >
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: t.textPrimary }}
                      >
                        {request.requestedBy?.username || "Student"}
                      </p>

                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: t.textMuted }}
                      >
                        {request.classroom?.roomName || "Classroom"} ·{" "}
                        {request.requestedFrom} – {request.requestedTo}
                      </p>

                      <p
                        className="mt-1 text-xs"
                        style={{ color: t.textMuted }}
                      >
                        {request.purpose}
                      </p>
                    </div>

                    {request.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            updateRequest(
                              request._id,
                              "approved"
                            )
                          }
                          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white"
                          style={{ backgroundColor: "#16a34a" }}
                        >
                          <Check size={13} />
                          Approve
                        </button>

                        <button
                          disabled={actionLoading}
                          onClick={() =>
                            updateRequest(
                              request._id,
                              "rejected"
                            )
                          }
                          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-white"
                          style={{ backgroundColor: "#dc2626" }}
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className="rounded-full px-3 py-1.5 text-xs font-bold capitalize"
                        style={{
                          backgroundColor:
                            request.status === "approved"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            request.status === "approved"
                              ? "#15803d"
                              : "#dc2626",
                        }}
                      >
                        {request.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          TEMPORARY CHANGES
      ===================================================== */}
      {activeTab === "changes" && (
        <div
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            backgroundColor: t.cardBg,
            borderColor: t.border,
          }}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: t.textPrimary }}
              >
                Temporary Schedule Changes
              </h3>
              <p
                className="mt-0.5 text-xs"
                style={{ color: t.textMuted }}
              >
                Manage temporary timetable updates
              </p>
            </div>

            <button
              type="button"
              onClick={openAddChange}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
              style={{ backgroundColor: t.accentPrimary }}
            >
              <Plus size={15} />
              Add Change
            </button>
          </div>

          {changes.length === 0 ? (
            <p
              className="py-8 text-center text-sm"
              style={{ color: t.textMuted }}
            >
              No temporary changes added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {changes.map((change) => (
                <div
                  key={change._id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: t.pageBg,
                    borderColor: t.border,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-[11px] font-bold uppercase"
                        style={{ color: t.textMuted }}
                      >
                        {change.moduleCode}
                        {change.group
                          ? ` · ${change.group}`
                          : ""}
                      </p>

                      <p
                        className="text-sm font-bold"
                        style={{ color: t.textPrimary }}
                      >
                        {change.moduleName}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditChange(change)}
                        className="p-2"
                        style={{ color: t.textPrimary }}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => deleteChange(change._id)}
                        className="p-2 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="mt-3 text-xs"
                    style={{ color: t.textMuted }}
                  >
                    <span>{change.originalSchedule}</span>
                    <span className="mx-2">→</span>
                    <span
                      className="font-semibold"
                      style={{ color: t.textPrimary }}
                    >
                      {change.newSchedule}
                    </span>
                  </div>

                  {change.reason && (
                    <p
                      className="mt-2 text-xs"
                      style={{ color: t.textMuted }}
                    >
                      {change.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          MODAL
      ===================================================== */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-5 sm:p-6"
            style={{
              backgroundColor: t.cardBg,
              borderColor: t.border,
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3
                className="text-lg font-bold"
                style={{ color: t.textPrimary }}
              >
                {editingItem ? "Edit" : "Add"}{" "}
                {modal.type === "period"
                  ? "Class Schedule"
                  : modal.type === "room"
                  ? "Vacant Classroom"
                  : "Schedule Change"}
              </h3>

              <button
                onClick={() => {
                  setModal(null);
                  setEditingItem(null);
                }}
                style={{ color: t.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            {/* PERIOD FORM */}
            {modal.type === "period" && (
              <form onSubmit={savePeriod} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <Field
                    label="Day"
                    type="select"
                    value={modal.data.day}
                    onChange={(value) =>
                      updateModalField("day", value)
                    }
                    options={DAYS}
                    t={t}
                  />

                  <Field
                    label="Time"
                    value={modal.data.time}
                    onChange={(value) =>
                      updateModalField("time", value)
                    }
                    placeholder="8:00 AM – 10:00 AM"
                    t={t}
                  />

                  <Field
                    label="Class Type"
                    type="select"
                    value={modal.data.classType}
                    onChange={(value) =>
                      updateModalField("classType", value)
                    }
                    options={[
                      "Lecture",
                      "Tutorial",
                      "Workshop",
                    ]}
                    t={t}
                  />

                  <Field
                    label="Module Code"
                    value={modal.data.moduleCode}
                    onChange={(value) =>
                      updateModalField(
                        "moduleCode",
                        value
                      )
                    }
                    t={t}
                  />

                </div>

                <Field
                  label="Module Name"
                  value={modal.data.moduleName}
                  onChange={(value) =>
                    updateModalField("moduleName", value)
                  }
                  t={t}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Lecturer"
                    value={modal.data.lecturer}
                    onChange={(value) =>
                      updateModalField("lecturer", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Group / Section"
                    value={modal.data.group}
                    onChange={(value) =>
                      updateModalField("group", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Room"
                    value={modal.data.room}
                    onChange={(value) =>
                      updateModalField("room", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Order"
                    type="number"
                    value={modal.data.order}
                    onChange={(value) =>
                      updateModalField("order", value)
                    }
                    t={t}
                  />
                </div>

                <ModalActions
                  t={t}
                  loading={actionLoading}
                  onCancel={() => setModal(null)}
                />
              </form>
            )}

            {/* ROOM FORM */}
            {modal.type === "room" && (
              <form onSubmit={saveRoom} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <Field
                    label="Room Name"
                    value={modal.data.roomName}
                    onChange={(value) =>
                      updateModalField("roomName", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Block"
                    value={modal.data.block}
                    onChange={(value) =>
                      updateModalField("block", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Day"
                    type="select"
                    value={modal.data.day}
                    onChange={(value) =>
                      updateModalField("day", value)
                    }
                    options={DAYS}
                    t={t}
                  />

                  <Field
                    label="Capacity"
                    type="number"
                    value={modal.data.capacity}
                    onChange={(value) =>
                      updateModalField("capacity", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Available From"
                    value={modal.data.availableFrom}
                    onChange={(value) =>
                      updateModalField(
                        "availableFrom",
                        value
                      )
                    }
                    placeholder="2:00 PM"
                    t={t}
                  />

                  <Field
                    label="Available To"
                    value={modal.data.availableTo}
                    onChange={(value) =>
                      updateModalField("availableTo", value)
                    }
                    placeholder="5:00 PM"
                    t={t}
                  />

                </div>

                <Field
                  label="Facilities"
                  value={modal.data.facilities}
                  onChange={(value) =>
                    updateModalField("facilities", value)
                  }
                  placeholder="Projector, Whiteboard"
                  t={t}
                />

                <ModalActions
                  t={t}
                  loading={actionLoading}
                  onCancel={() => setModal(null)}
                />
              </form>
            )}

            {/* CHANGE FORM */}
            {modal.type === "change" && (
              <form onSubmit={saveChange} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <Field
                    label="Module Code"
                    value={modal.data.moduleCode}
                    onChange={(value) =>
                      updateModalField("moduleCode", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Module Name"
                    value={modal.data.moduleName}
                    onChange={(value) =>
                      updateModalField("moduleName", value)
                    }
                    t={t}
                  />

                  <Field
                    label="Class Type"
                    type="select"
                    value={modal.data.classType}
                    onChange={(value) =>
                      updateModalField("classType", value)
                    }
                    options={[
                      "Lecture",
                      "Tutorial",
                      "Workshop",
                    ]}
                    t={t}
                  />

                  <Field
                    label="Group"
                    value={modal.data.group}
                    onChange={(value) =>
                      updateModalField("group", value)
                    }
                    t={t}
                  />

                </div>

                <Field
                  label="Original Schedule"
                  value={modal.data.originalSchedule}
                  onChange={(value) =>
                    updateModalField(
                      "originalSchedule",
                      value
                    )
                  }
                  placeholder="Monday · 8:00 AM · LT-01"
                  t={t}
                />

                <Field
                  label="New Schedule"
                  value={modal.data.newSchedule}
                  onChange={(value) =>
                    updateModalField("newSchedule", value)
                  }
                  placeholder="Tuesday · 10:00 AM · LT-02"
                  t={t}
                />

                <Field
                  label="Reason"
                  value={modal.data.reason}
                  onChange={(value) =>
                    updateModalField("reason", value)
                  }
                  t={t}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Effective Date"
                    value={modal.data.effectiveDate}
                    onChange={(value) =>
                      updateModalField(
                        "effectiveDate",
                        value
                      )
                    }
                    placeholder="Aug 24, 2026"
                    t={t}
                  />

                  <Field
                    label="Status"
                    type="select"
                    value={modal.data.status}
                    onChange={(value) =>
                      updateModalField("status", value)
                    }
                    options={[
                      "Time Changed",
                      "Room Changed",
                      "Rescheduled",
                      "Cancelled",
                    ]}
                    t={t}
                  />
                </div>

                <ModalActions
                  t={t}
                  loading={actionLoading}
                  onCancel={() => setModal(null)}
                />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// =========================================================
// SMALL REUSABLE FORM COMPONENT
// =========================================================

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  options = [],
  t,
}) => (
  <label className="block">
    <span
      className="mb-1.5 block text-xs font-bold"
      style={{ color: t.textMuted }}
    >
      {label}
    </span>

    {type === "select" ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
        style={{
          backgroundColor: t.pageBg,
          borderColor: t.border,
          color: t.textPrimary,
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={label !== "Group / Section" && label !== "Facilities" && label !== "Reason"}
        className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
        style={{
          backgroundColor: t.pageBg,
          borderColor: t.border,
          color: t.textPrimary,
        }}
      />
    )}
  </label>
);


const ModalActions = ({ t, loading, onCancel }) => (
  <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: t.border }}>
    <button
      type="button"
      onClick={onCancel}
      className="rounded-xl px-4 py-2.5 text-xs font-bold"
      style={{
        backgroundColor: t.chipBg,
        color: t.textPrimary,
      }}
    >
      Cancel
    </button>

    <button
      type="submit"
      disabled={loading}
      className="rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
      style={{ backgroundColor: t.accentPrimary }}
    >
      {loading ? "Saving..." : "Save"}
    </button>
  </div>
);

export default ManageTimetableSection;