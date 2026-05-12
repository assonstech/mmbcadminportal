import api from '../config/api';

export const getAllNewsletters = async () => {
  try {
    const res = await api.get('/newsletters');
    return res.data;
  } catch (err) {
    console.error('Error fetching newsletters:', err);
    return {
      success: false,
      message: 'Failed to fetch newsletters',
      data: [],
    };
  }
};
export const getAdminNewsletters = async (page = 1, pageSize = 5, search = '') => {
  try {
    const res = await api.get('/newsletters/admin', {
      params: { page, pageSize, search },
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching admin newsletters:', err);
    return {
      success: false,
      message: 'Failed to fetch newsletters',
      data: [],
      pagination: {
        page: 1,
        pageSize,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }
};

export const getNewsletterById = async (id) => {
  try {
    const res = await api.get(`/newsletters/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error fetching newsletter ${id}:`, err);
    return {
      success: false,
      message: 'Failed to fetch newsletter',
      data: null,
    };
  }
};

export const createNewsletter = async (formData) => {
  try {
    const payload = new FormData();
    payload.append('title', formData.title || '');
    payload.append('fullDescription', formData.fullDescription || '');
    payload.append('readMinutes', formData.readMinutes || '');
    payload.append('publishedAt', formData.publishedAt || '');

    if (formData.imageUrl) {
      payload.append('imageUrl', formData.imageUrl);
    }

    if (formData.pdfUrl) {
      payload.append('pdfUrl', formData.pdfUrl);
    }

    const res = await api.post('/newsletters', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  } catch (err) {
    console.error('Error creating newsletter:', err);
    return {
      success: false,
      message: 'Failed to create newsletter',
      data: null,
    };
  }
};

export const updateNewsletter = async (id, formData) => {
  try {
    const payload = new FormData();
    payload.append('title', formData.title || '');
    payload.append('fullDescription', formData.fullDescription || '');
    payload.append('readMinutes', formData.readMinutes || '');
    payload.append('publishedAt', formData.publishedAt || '');

    if (formData.imageUrl) {
      payload.append('imageUrl', formData.imageUrl);
    }

    if (formData.pdfUrl) {
      payload.append('pdfUrl', formData.pdfUrl);
    }

    const res = await api.put(`/newsletters/${id}`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  } catch (err) {
    console.error(`Error updating newsletter ${id}:`, err);
    return {
      success: false,
      message: 'Failed to update newsletter',
      data: null,
    };
  }
};

export const deleteNewsletter = async (id) => {
  try {
    const res = await api.delete(`/newsletters/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error deleting newsletter ${id}:`, err);
    return {
      success: false,
      message: 'Failed to delete newsletter',
      data: null,
    };
  }
};
export const removeNewsletterPdf = async (id) => {
  try {
    const res = await api.delete(`/newsletters/${id}/pdf`);
    return res.data;
  } catch (err) {
    console.error(`Error removing newsletter PDF ${id}:`, err);
    return {
      success: false,
      message: 'Failed to remove newsletter PDF',
      data: null,
    };
  }
};