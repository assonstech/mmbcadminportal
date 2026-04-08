import api from '../config/api';

export const getAllMouPartners = async () => {
  try {
    const res = await api.get('/mou-partners');
    return res.data;
  } catch (err) {
    console.error('Error fetching mou partners:', err);
    return {
      success: false,
      message: 'Failed to fetch mou partners',
      data: [],
    };
  }
};

export const getMouPartnerById = async (id) => {
  try {
    const res = await api.get(`/mou-partners/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error fetching mou partner ${id}:`, err);
    return {
      success: false,
      message: 'Failed to fetch mou partner',
      data: null,
    };
  }
};

export const createMouPartner = async (formData) => {
  try {
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('category', formData.category);
    payload.append('websiteLink', formData.websiteLink);

    if (formData.iconUrl) {
      payload.append('iconUrl', formData.iconUrl);
    }

    const res = await api.post('/mou-partners', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  } catch (err) {
    console.error('Error creating mou partner:', err);
    return {
      success: false,
      message: 'Failed to create mou partner',
      data: null,
    };
  }
};

export const updateMouPartner = async (id, formData) => {
  try {
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('category', formData.category);
    payload.append('websiteLink', formData.websiteLink);

    if (formData.iconUrl) {
      payload.append('iconUrl', formData.iconUrl);
    }

    const res = await api.put(`/mou-partners/${id}`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  } catch (err) {
    console.error(`Error updating mou partner ${id}:`, err);
    return {
      success: false,
      message: 'Failed to update mou partner',
      data: null,
    };
  }
};

export const deleteMouPartner = async (id) => {
  try {
    const res = await api.delete(`/mou-partners/hard/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error deleting mou partner ${id}:`, err);
    return {
      success: false,
      message: 'Failed to delete mou partner',
      data: null,
    };
  }
};