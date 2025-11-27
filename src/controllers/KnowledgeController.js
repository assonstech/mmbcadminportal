import api from '../config/api';

// Get all knowledge posts
export const getAllKnowledge = async () => {
  try {
    const res = await api.get('/knowledge');
    return res.data;
  } catch (err) {
    console.error('Error fetching knowledge:', err);
    return { success: false, data: [] };
  }
};

// Create a new knowledge post
export const createKnowledge = async (formData) => {
  try {
    const postBody = {
      content: formData.content,
      image: formData.image,
      createdBy: formData.createdBy || 'admin',
    };

    const res = await api.post('/knowledge', postBody);
    return res.data;
  } catch (err) {
    console.error('Error creating knowledge:', err);
    return { success: false };
  }
};

// Update existing knowledge post
export const updateKnowledge = async (id, formData) => {
  try {
    const postBody = {
      content: formData.content,
      image: formData.image,
      createdBy: formData.createdBy,
      updatedBy: formData.updatedBy || 'admin',
    };

    const res = await api.put(`/knowledge/${id}`, postBody);
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
