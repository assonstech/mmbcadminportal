import api from '../config/api';

export const getAllSeasonalPromotions = async () => {
    try {
        const res = await api.get('/seasonal-promotions');
        return res.data;
    } catch (err) {
        console.error('Error fetching seasonal promotions:', err);
        return {
            success: false,
            message: 'Failed to fetch seasonal promotions',
            data: [],
        };
    }
};

export const getActiveSeasonalPromotions = async () => {
    try {
        const res = await api.get('/seasonal-promotions/active');
        return res.data;
    } catch (err) {
        console.error('Error fetching active seasonal promotions:', err);
        return {
            success: false,
            message: 'Failed to fetch active seasonal promotions',
            data: [],
        };
    }
};

export const getSeasonalPromotionById = async (id) => {
    try {
        const res = await api.get(`/seasonal-promotions/${id}`);
        return res.data;
    } catch (err) {
        console.error(`Error fetching seasonal promotion ${id}:`, err);
        return {
            success: false,
            message: 'Failed to fetch seasonal promotion',
            data: null,
        };
    }
};

export const createSeasonalPromotion = async (formData) => {
    try {
        const payload = new FormData();
        payload.append('title', formData.title || '');
        payload.append('shortDescription', formData.shortDescription || '');
        payload.append('fullDescription', formData.fullDescription || '');
        payload.append('startDate', formData.startDate || '');
        payload.append('endDate', formData.endDate || '');
        payload.append('isActive', formData.isActive ? 'true' : 'false');

        if (formData.imageUrl) {
            payload.append('imageUrl', formData.imageUrl);
        }

        if (formData.pdfUrl) {
            payload.append('pdfUrl', formData.pdfUrl);
        }

        const res = await api.post('/seasonal-promotions', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return res.data;
    } catch (err) {
        console.error('Error creating seasonal promotion:', err);
        return {
            success: false,
            message: 'Failed to create seasonal promotion',
            data: null,
        };
    }
};

export const updateSeasonalPromotion = async (id, formData) => {
    try {
        const payload = new FormData();
        payload.append('title', formData.title || '');
        payload.append('shortDescription', formData.shortDescription || '');
        payload.append('fullDescription', formData.fullDescription || '');
        payload.append('startDate', formData.startDate || '');
        payload.append('endDate', formData.endDate || '');
        payload.append('isActive', formData.isActive ? 'true' : 'false');

        if (formData.imageUrl) {
            payload.append('imageUrl', formData.imageUrl);
        }

        if (formData.pdfUrl) {
            payload.append('pdfUrl', formData.pdfUrl);
        }

        const res = await api.put(`/seasonal-promotions/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return res.data;
    } catch (err) {
        console.error(`Error updating seasonal promotion ${id}:`, err);
        return {
            success: false,
            message: 'Failed to update seasonal promotion',
            data: null,
        };
    }
};

export const deleteSeasonalPromotion = async (id) => {
    try {
        const res = await api.delete(`/seasonal-promotions/${id}`);
        return res.data;
    } catch (err) {
        console.error(`Error deleting seasonal promotion ${id}:`, err);
        return {
            success: false,
            message: 'Failed to delete seasonal promotion',
            data: null,
        };
    }
};