const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const { createNotification, createNotificationForRole } = require('../utils/createNotification');
const { emitToAll } = require('../utils/socketEmitter');

// True for the DevCorps portal admin (User.portal === 'devcorpsCommunity' and
// portalRole === 'admin' — the devcorps BIC account). DevCorps manages ONLY
// Community events, never college/campus events.
const isDevCorpsAdmin = (user) =>
  user?.portal === 'devcorpsCommunity' && user?.portalRole === 'admin';


/**
 * GET EVENTS
 *
 * Examples:
 * GET /events
 * GET /events?type=college
 * GET /events?type=community
 *
 * If the user is logged in, each event also receives:
 *
 * registered: true / false
 */
const getEvents = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {
      isPublished: true,
    };

    if (type === 'college' || type === 'community') {
      filter.type = type;
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'username email role')
      .sort({ date: 1 });

    let registeredEventIds = new Set();

    // Only check registrations when the user is logged in.
    if (req.user?._id) {
      const registrations = await EventRegistration.find({
        user: req.user._id,
        status: 'registered',
      }).select('event');

      registeredEventIds = new Set(
        registrations.map((registration) =>
          registration.event.toString()
        )
      );
    }

    const formattedEvents = events.map((event) => ({
      ...event.toObject(),

      registered: registeredEventIds.has(
        event._id.toString()
      ),
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch events',
      error: error.message,
    });
  }
};


/**
 * GET SINGLE EVENT
 */
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username email role');

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    let registered = false;

    if (req.user?._id) {
      const registration = await EventRegistration.findOne({
        event: event._id,
        user: req.user._id,
        status: 'registered',
      });

      registered = !!registration;
    }

    res.status(200).json({
      ...event.toObject(),
      registered,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch event',
      error: error.message,
    });
  }
};


/**
 * CREATE EVENT
 */
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      date,
      startTime,
      endTime,
      venue,
      eventImage,
      organizer,
      registrationEnabled,
      capacity,
      isPublished,
    } = req.body;

    if (
      !title ||
      !description ||
      !type ||
      !category ||
      !date ||
      !startTime ||
      !venue ||
      !organizer?.name
    ) {
      return res.status(400).json({
        message: 'Please provide all required event fields',
      });
    }

    // DevCorps can only create Community events — any college/campus type in
    // the payload is forced back to 'community' (the frontend hides the type
    // selector for DevCorps, this is the backend guard).
    const effectiveType = isDevCorpsAdmin(req.user) ? 'community' : type;

    const event = await Event.create({
      title,
      description,
      type: effectiveType,
      category,
      date,
      startTime,
      endTime: endTime || '',
      venue,
      eventImage: eventImage || '',
      organizer,

      registrationEnabled:
        registrationEnabled !== undefined
          ? registrationEnabled
          : true,

      capacity:
        capacity !== undefined && capacity !== null
          ? capacity
          : null,

      status: req.body.status || 'upcoming',

      isPublished:
        isPublished !== undefined
          ? isPublished
          : true,

      createdBy: req.user._id,
    });

    // Broadcast real-time update to all connected clients
    emitToAll('event:created', { event: await Event.findById(event._id).populate('createdBy', 'username email role') });

    if (event.isPublished) {
      const typeLabel = event.type === 'college' ? 'College' : 'Community';
      createNotificationForRole('student', {
        type: 'event',
        title: 'New Event Added',
        message: `${typeLabel} event: ${event.title} — ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        link: 'events',
      });
    }

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create event',
      error: error.message,
    });
  }
};


/**
 * UPDATE EVENT
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // DevCorps may only edit/publish/update Community events — college
    // events are off-limits and can never be touched from the DevCorps
    // Manage Events panel.
    if (isDevCorpsAdmin(req.user) && event.type !== 'community') {
      return res.status(403).json({
        message: 'DevCorps can only manage Community events',
      });
    }

    if (isDevCorpsAdmin(req.user) && req.body.type !== undefined) {
      // Never let DevCorps flip a Community event into a college event.
      delete req.body.type;
    }

    // Snapshot the fields that drive specific notifications BEFORE the update
    const prevStatus = event.status;
    const prevType   = event.type;
    const prevPublished = event.isPublished;

    Object.assign(event, req.body);

    await event.save();

    // Broadcast real-time update to all connected clients
    emitToAll('event:updated', { event: await Event.findById(event._id).populate('createdBy', 'username email role') });

    // Only send notifications for published events visible to students
    if (event.isPublished) {
      const typeLabel = event.type === 'college' ? 'College' : 'Community';
      const dateStr   = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // ── Status changed ───────────────────────────────────────────────────
      if (req.body.status !== undefined && event.status !== prevStatus) {
        switch (event.status) {
          case 'ongoing':
            // Notify all students — event is happening now
            createNotificationForRole('student', {
              type: 'event',
              title: `${event.title} is now Ongoing`,
              message: `${typeLabel} event "${event.title}" has started. Venue: ${event.venue}.`,
              link: 'events',
            });
            break;

          case 'completed':
            // Notify only registered students — relevant to them specifically
            EventRegistration.find({ event: event._id, status: 'registered' })
              .select('user')
              .then((regs) => {
                regs.forEach((reg) => {
                  createNotification(reg.user, {
                    type: 'event',
                    title: `${event.title} has Completed`,
                    message: `The event "${event.title}" you registered for has been marked as completed.`,
                    link: 'events',
                  });
                });
              })
              .catch(() => {});
            break;

          case 'cancelled':
            // Notify only registered students — they need to know their plans changed
            EventRegistration.find({ event: event._id, status: 'registered' })
              .select('user')
              .then((regs) => {
                regs.forEach((reg) => {
                  createNotification(reg.user, {
                    type: 'event',
                    title: `${event.title} has been Cancelled`,
                    message: `The event "${event.title}" you registered for has been cancelled.`,
                    link: 'events',
                  });
                });
              })
              .catch(() => {});
            break;

          case 'upcoming':
          default:
            // Status reset to upcoming (e.g. un-cancelling) — notify all students
            createNotificationForRole('student', {
              type: 'event',
              title: `${event.title} is Upcoming`,
              message: `${typeLabel} event "${event.title}" is scheduled for ${dateStr}.`,
              link: 'events',
            });
            break;
        }
      }

      // ── Type changed (college ↔ community) ──────────────────────────────
      else if (req.body.type !== undefined && event.type !== prevType) {
        createNotificationForRole('student', {
          type: 'event',
          title: `Event Type Updated — ${event.title}`,
          message: `"${event.title}" is now a ${typeLabel} event (${dateStr}).`,
          link: 'events',
        });
      }

      // ── Event just published (was draft, now live) ───────────────────────
      else if (!prevPublished && event.isPublished) {
        createNotificationForRole('student', {
          type: 'event',
          title: 'New Event Added',
          message: `${typeLabel} event: ${event.title} — ${dateStr}`,
          link: 'events',
        });
      }

      // ── Generic detail update (title, date, venue, etc.) ────────────────
      else if (req.body.status === undefined && req.body.type === undefined) {
        createNotificationForRole('student', {
          type: 'event',
          title: 'Event Updated',
          message: `"${event.title}" details have been updated — ${dateStr} at ${event.venue}.`,
          link: 'events',
        });
      }
    }

    res.status(200).json({
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update event',
      error: error.message,
    });
  }
};


/**
 * DELETE EVENT
 */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    // DevCorps may only delete events owned by the communities.
    if (isDevCorpsAdmin(req.user) && event.type !== 'community') {
      return res.status(403).json({
        message: 'DevCorps can only manage Community events',
      });
    }

    await event.deleteOne();

    await EventRegistration.deleteMany({
      event: event._id,
    });

    // Broadcast real-time deletion to all connected clients
    emitToAll('event:deleted', { _id: event._id });

    res.status(200).json({
      message: 'Event deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete event',
      error: error.message,
    });
  }
};


/**
 * REGISTER FOR EVENT
 *
 * POST /events/:id/register
 *
 * Registration is persistent.
 */
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    if (!event.isPublished) {
      return res.status(400).json({
        message: 'This event is not published',
      });
    }

    if (!event.registrationEnabled) {
      return res.status(400).json({
        message: 'Registration is closed for this event',
      });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({
        message: 'This event has been cancelled',
      });
    }

    const userId = req.user._id;

    // Check whether this user already has a registration.
    const existingRegistration =
      await EventRegistration.findOne({
        event: event._id,
        user: userId,
      });

    // Already registered.
    if (
      existingRegistration &&
      existingRegistration.status === 'registered'
    ) {
      return res.status(200).json({
        success: true,
        registered: true,
        message: 'You are already registered for this event',
        registration: existingRegistration,
      });
    }

    // Check capacity.
    if (event.capacity !== null) {
      const registrationCount =
        await EventRegistration.countDocuments({
          event: event._id,
          status: 'registered',
        });

      if (registrationCount >= event.capacity) {
        return res.status(400).json({
          success: false,
          registered: false,
          message: 'This event is full',
        });
      }
    }

    let registration;

    // Reuse cancelled registration if it exists.
    if (existingRegistration) {
      existingRegistration.status = 'registered';
      existingRegistration.registeredAt = new Date();

      registration = await existingRegistration.save();
    } else {
      registration = await EventRegistration.create({
        event: event._id,
        user: userId,
        status: 'registered',
      });
    }

    res.status(201).json({
      success: true,
      registered: true,
      message: 'Successfully registered for event',
      registration,
    });
  } catch (error) {
    // Handle duplicate registration race condition.
    if (error.code === 11000) {
      const registration = await EventRegistration.findOne({
        event: req.params.id,
        user: req.user._id,
      });
      return res.status(200).json({
        success: true,
        registered: true,
        message: 'You are already registered for this event',
        registration,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message,
    });
  }
};


/**
 * GET MY REGISTRATIONS
 *
 * GET /events/my-registrations
 */
const getMyRegistrations = async (req, res) => {
  try {
    const registrations =
      await EventRegistration.find({
        user: req.user._id,
        status: 'registered',
      })
        .populate('event')
        .sort({ createdAt: -1 });

    res.status(200).json(registrations);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch registrations',
      error: error.message,
    });
  }
};


/**
 * CANCEL REGISTRATION
 *
 * This endpoint is kept for future/admin use.
 *
 * The frontend will NOT expose a cancel button,
 * so normal users remain registered.
 */
const cancelRegistration = async (req, res) => {
  try {
    const registration =
      await EventRegistration.findOne({
        event: req.params.id,
        user: req.user._id,
        status: 'registered',
      });

    if (!registration) {
      return res.status(404).json({
        message: 'Registration not found',
      });
    }

    registration.status = 'cancelled';

    await registration.save();

    res.status(200).json({
      success: true,
      registered: false,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to cancel registration',
      error: error.message,
    });
  }
};

/**
 * GET ALL EVENTS (ADMIN)
 *
 * GET /events/admin/all
 *
 * Unlike getEvents, this ignores isPublished so admins can see
 * and manage drafts too.
 */
const getAllEventsAdmin = async (req, res) => {
  try {
    // DevCorps Manage Events is scoped to Community events only — college/
    // campus events never appear in its list or become manageable. Regular
    // campus admins/teachers keep the full list exactly as before.
    const filter = isDevCorpsAdmin(req.user) ? { type: 'community' } : {};

    const events = await Event.find(filter)
      .populate('createdBy', 'username email role')
      .sort({ date: 1 });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch events',
      error: error.message,
    });
  }
};


/**
 * GET EVENT REGISTRANTS (ADMIN)
 *
 * GET /events/:id/registrations
 *
 * Returns the list of students currently registered for this event.
 */
const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('title date');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await EventRegistration.find({
      event: req.params.id,
      status: 'registered',
    })
      .populate('user', 'username email department semester')
      .sort({ registeredAt: 1 });

    res.status(200).json({
      event: { _id: event._id, title: event.title, date: event.date },
      count: registrations.length,
      registrants: registrations.map((r) => ({
        registrationId: r._id,
        registeredAt: r.registeredAt,
        student: r.user,
      })),
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    res.status(500).json({
      message: 'Failed to fetch event registrations',
      error: error.message,
    });
  }
};


module.exports = {
  getEvents,
  getEventById,
  getAllEventsAdmin,
  getEventRegistrations,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
};