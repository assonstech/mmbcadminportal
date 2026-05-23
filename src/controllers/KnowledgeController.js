import api from '../config/api';

// Get all knowledge posts
export const getAllKnowledge = async (page = 1, limit = 10, search = '') => {
  try {
    const res = await api.get('/knowledge', {
      params: { page, limit, search },
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching knowledge:', err);
    return {
      success: false,
      data: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }
};

// Create a new knowledge post
export const createKnowledge = async (formData) => {
  try {
    const payload = new FormData();
    payload.append('content', formData.content || '');
    payload.append('createdBy', formData.createdBy || 'admin');

    if (formData.image instanceof File) {
      payload.append('image', formData.image);
    }

    if (formData.pdfUrl instanceof File) {
      payload.append('pdfUrl', formData.pdfUrl);
    }

    const res = await api.post('/knowledge', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    console.error('Error creating knowledge:', err);
    return { success: false };
  }
};

// Update existing knowledge post
export const updateKnowledge = async (id, formData) => {
  try {
    const payload = new FormData();
    payload.append('content', formData.content || '');
    payload.append('createdBy', formData.createdBy || 'admin');

    if (formData.image instanceof File) {
      payload.append('image', formData.image);
    }

    if (formData.pdfUrl instanceof File) {
      payload.append('pdfUrl', formData.pdfUrl);
    }

    const res = await api.put(`/knowledge/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (err) {
    console.error('Error updating knowledge:', err);
    return { success: false };
  }
};

// Delete a knowledge post
export const deleteKnowledge = async (id) => {
  try {
    const res = await api.delete(`/knowledge/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting knowledge:', err);
    return { success: false };
  }
};

export const removeKnowledgePdf = async (id) => {
  try {
    const res = await api.delete(`/knowledge/${id}/pdf`);
    return res.data;
  } catch (err) {
    console.error('Error removing knowledge PDF:', err);
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to remove PDF',
    };
  }
};
