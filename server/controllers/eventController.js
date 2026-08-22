const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');

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

    const event = await Event.create({
      title,
      description,
      type,
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

      isPublished:
        isPublished !== undefined
          ? isPublished
          : true,

      createdBy: req.user._id,
    });

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

    Object.assign(event, req.body);

    await event.save();

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
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    await EventRegistration.deleteMany({
      event: event._id,
    });

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
    const events = await Event.find({})
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


module.exports = {
  getEvents,
  getEventById,
  getAllEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
};