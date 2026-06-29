import api from '../config/api';

export const createNotification = async ({
  title,
  description,
  type,
  referenceId = null,
  userId = null,
}) => {
  try {
    const res = await api.post('/notifications', {
      title,
      description,
      type,
      referenceId,
      userId,
    });

    return res.data;
  } catch (err) {
    console.error('Error creating notification:', err.response?.data || err.message || err);
    return { success: false, message: 'Failed to create notification' };
  }
};

export const getCreatedReferenceId = (response, keys = []) => {
  const containers = [response, response?.data, response?.data?.data];
  const candidateKeys = [...keys, 'referenceId', 'id'];

  for (const container of containers) {
    if (!container || typeof container !== 'object') continue;

    for (const key of candidateKeys) {
      const value = container[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }

  return null;
};
