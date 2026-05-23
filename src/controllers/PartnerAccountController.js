import api from '../config/api';

export const getPartnerAccounts = async (page = 1, limit = 10, search = '') => {
  try {
    const res = await api.get('/partner-accounts', {
      params: { page, limit, search },
    });
    return res.data;
  } catch (err) {
    console.error('Error fetching partner accounts:', err);
    return {
      success: false,
      message: 'Failed to fetch partner accounts',
      data: {
        accounts: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      },
    };
  }
};

export const createPartnerAccount = async (payload) => {
  try {
    const res = await api.post('/partner-accounts', payload);
    return res.data;
  } catch (err) {
    console.error('Error creating partner account:', err.response?.data || err.message || err);
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to create partner account',
    };
  }
};

export const updatePartnerAccount = async (partnerId, payload) => {
  try {
    const res = await api.put(`/partner-accounts/${partnerId}`, payload);
    return res.data;
  } catch (err) {
    console.error('Error updating partner account:', err.response?.data || err.message || err);
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to update partner account',
    };
  }
};

export const deletePartnerAccount = async (partnerId) => {
  try {
    const res = await api.delete(`/partner-accounts/${partnerId}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting partner account:', err.response?.data || err.message || err);
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to delete partner account',
    };
  }
};
