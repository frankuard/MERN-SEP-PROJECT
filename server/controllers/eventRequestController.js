const EventRequest = require('../models/EventRequest');
const Event = require('../models/Event');
const { emitToAll } = require('../utils/socketEmitter');

/**
 * GET MY EVENT REQUESTS (community member)
 *
 * GET /events/requests/mine
 *
 * Returns the requests the logged-in community member has submitted, newest
 * first, so they can track pending/approved/rejected status.
 */
const getMyEventRequests = async (req, res) => {
  try {
    const requests = await EventRequest.find({ requestedBy: req.user._id })
      .populate('requestedBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch event requests',
      error: error.message,
    });
  }
};

/**
 * GET ALL EVENT REQUESTS (DevCorps admin)
 *
 * GET /events/requests?status=pending
 *
 * Returns every community event request so DevCorps can review them. An
 * optional ?status= filter (pending | approved | rejected) narrows the list.
 */
const getAllEventRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await EventRequest.find(filter)
      .populate('requestedBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch event requests',
      error: error.message,
    });
  }
};

/**
 * CREATE EVENT REQUEST (community member)
 *
 * POST /events/requests
 *
 * Validates the same required fields as a real Event, then stores it as a
 * pending request. The organizer is wired to the submitting community so the
 * approved event lands on the board with the correct organizer.
 */
const createEventRequest = async (req, res) => {
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
      organizerName,
      organizerLogo,
    } = req.body;

    if (
      !title ||
      !description ||
      !type ||
      !category ||
      !date ||
      !startTime ||
      !venue
    ) {
      return res.status(400).json({
        message: 'Please provide all required event fields',
      });
    }

    const organizer = {
      name: (organizerName || '').trim() || req.user.username,
      logo: (organizerLogo || '').trim() || '',
    };

    const request = await EventRequest.create({
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
      requestedBy: req.user._id,
    });

    const populated = await EventRequest.findById(request._id).populate(
      'requestedBy',
      'username email'
    );

    res.status(201).json({
      message: 'Event request submitted for approval',
      request: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to submit event request',
      error: error.message,
    });
  }
};

/**
 * RESPOND TO EVENT REQUEST (DevCorps admin)
 *
 * PATCH /events/requests/:id   body: { status: 'approved' | 'rejected', reviewNote? }
 *
 * Approving turns the request into a real Event (published to the board with
 * the request's organizer) and emits the live event:created update.
 * Rejecting simply flips the status so the submitting community sees it.
 */
const respondToEventRequest = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "status must be 'approved' or 'rejected'",
      });
    }

    const request = await EventRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'This request has already been reviewed',
      });
    }

    request.status = status;
    if (reviewNote) request.reviewNote = reviewNote;
    await request.save();

    if (status === 'approved') {
      const event = await Event.create({
        title: request.title,
        description: request.description,
        type: request.type,
        category: request.category,
        date: request.date,
        startTime: request.startTime,
        endTime: request.endTime || '',
        venue: request.venue,
        eventImage: request.eventImage || '',
        organizer: request.organizer || { name: request.requestedBy?.username },
        registrationEnabled: true,
        capacity: null,
        status: 'upcoming',
        isPublished: true,
        createdBy: req.user._id,
      });

      // Live update so the shared Event Board shows the approved event
      // immediately, exactly like a manually-created event.
      emitToAll('event:created', {
        event: await Event.findById(event._id).populate(
          'createdBy',
          'username email role'
        ),
      });
    }

    const populated = await EventRequest.findById(request._id).populate(
      'requestedBy',
      'username email'
    );

    res.status(200).json({
      message: status === 'approved'
        ? 'Event request approved and published'
        : 'Event request rejected',
      request: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to respond to event request',
      error: error.message,
    });
  }
};

module.exports = {
  getMyEventRequests,
  getAllEventRequests,
  createEventRequest,
  respondToEventRequest,
};
