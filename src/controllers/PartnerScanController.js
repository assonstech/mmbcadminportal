import api from '../config/api';

export const getPartnerScanLogs = async ({
  page = 1,
  limit = 10,
  partnerId = '',
  partnerType = '',
  search = '',
} = {}) => {
  try {
    const params = { page, limit, search };

    if (partnerId) params.partnerId = partnerId;
    if (partnerType) params.partnerType = partnerType;

    const res = await api.get('/partner-scans/admin/all', { params });
    return res.data;
  } catch (err) {
    console.error('Error fetching partner scan logs:', err.response?.data || err.message || err);
    return {
      success: false,
      message: 'Failed to fetch partner scan logs',
      data: {
        scans: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      },
    };
  }
};
