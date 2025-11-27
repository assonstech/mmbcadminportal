import api from '../config/api';

export const getAllEvents = async () => {
  try {
    const res = await api.get('/events');
    return res.data;
  } catch (err) {
    console.error('Error fetching events:', err);
    return [];
  }
};

export const createEvent = async (formData) => {
  try {
    // ✅ Only include fields your API expects
    const postBody = {
      eventTitle: formData.eventTitle,
      eventDate: formData.eventDate,
      eventRule: formData.eventRule,
      eventDescription: formData.eventDescription,
      eventImage: formData.eventImage,
      feeType: formData.feeType,
      eventFee: parseFloat(formData.eventFee) || 0,
      eventType: formData.eventType,
      eventLocation: formData.eventLocation,
      createdBy: formData.createdBy || 'admin',
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    const res = await api.post('/events', postBody);
    return res.data;
  } catch (err) {
    console.error('Error creating event:', err);
    return [];
  }
};

export const updateEvent = async (id, formData) => {
  try {
    // ✅ Send only allowed fields to update
    const postBody = {
      eventTitle: formData.eventTitle,
      eventDate: formData.eventDate,
      eventRule: formData.eventRule,
      eventDescription: formData.eventDescription,
      eventImage: formData.eventImage,
      feeType: formData.feeType,
      eventFee: parseFloat(formData.eventFee) || 0,
      eventType: formData.eventType,
      eventLocation: formData.eventLocation,
      updatedBy: formData.updatedBy || 'admin',
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    const res = await api.put(`/events/${id}`, postBody);
    return res.data;
  } catch (err) {
    console.error('Error updating event:', err);
    return [];
  }
};

export const deleteEvent = async (id) => {
  try {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting event:', err);
    return [];
  }
};

export const getEventDetail = async (eventId) => {
  try {
    const res = await api.get(`/events/all/${eventId}`);
    // Expected response:
    // {
    //   success: true,
    //   message: "Fetched all registrations successfully",
    //   data: [ ... ]
    // }
    return res.data;
  } catch (err) {
    console.error(`Error fetching event detail for ID ${eventId}:`, err);
    return { success: false, message: 'Failed to fetch event detail', data: [] };
  }
};

export const updateRegistrationPaidStatus = async (registrationId, isPaid) => {
  try {
    // Send registrationId and isPaid in POST body
    const res = await api.post('/events/updatePaidStatus', {
      registrationId,
      isPaid,
    });

    // Expected response:
    // {
    //   success: true,
    //   message: "Updated registration paid status",
    //   data: { registrationId, isPaid }
    // }

    return res.data;
  } catch (err) {
    console.error(`Error updating paid status for ID ${registrationId}:`, err);
    return { success: false, message: 'Failed to update paid status', data: null };
  }
};

