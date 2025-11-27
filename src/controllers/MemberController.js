import api from '../config/api';

export const getMembers = async () => {
  try {
    const res = await api.get('/members');
    return res.data.success ? res.data.data : [];
  } catch (err) {
    console.error('Error fetching members:', err);
    return [];
  }
};
export const getECMembers = async () => {
  try {
    const res = await api.get('/members/ec');
    return res.data.success ? res.data.data : [];
  } catch (err) {
    console.error('Error fetching ECmembers:', err);
    return [];
  }
};

export const getMemberTypes = async () => {
  try {
    const res = await api.get('/member-types');
    return res.data.success ? res.data.data : [];
  } catch (err) {
    console.error('Error fetching member types:', err);
    return [];
  }
};

export const getNrcTypes = async () => {
  try {
    const res = await api.get('/nrc/types');
    return res.data.success ? res.data.data : [];
  } catch (err) {
    console.error('Error fetching NRC types:', err);
    return [];
  }
};

export const getTownshipsByCode = async (code) => {
  try {
    const res = await api.get(`/nrc/townships/${code}`);
    return res.data.success ? res.data.data : [];
  } catch (err) {
    console.error('Error fetching townships:', err);
    return [];
  }
};
export const createMember = async (postBody) => {
  try {
    const res = await api.post("/members", postBody)
    return res.data
  } catch (err) {
    console.log(err)
  }
}
export const deleteMember = async (memberId) => {
  try {
    const res = await api.delete(`/members/${memberId}`)
    return res.data
  } catch (err) {
    console.log(err)
  }
}
export const updateMember = async (memberId, postBody) => {
  try {
    const res = await api.put(`/members/${memberId}`, postBody);
    return res.data;
  } catch (err) {
    console.error(err);
  }
};


export const updateParentMemberId = async (memberId, parentMemberId) => {
  try {
    const res = await api.put(`/members/update-parent/${memberId}`, {
      parentMemberId: parentMemberId
    });
    return res.data;
  } catch (err) {
    console.error(err);
  }
};

export const deleteImage = async (filename) => {
  console.log("filename", filename)
  if (!filename) return;

  try {
    const res = await api.delete("/member-upload", {
      data: { filename }  // Axios requires "data" for DELETE body
    });

    return res.data;
  } catch (err) {
    console.error("Error deleting image:", err);
  }
};

export const changeCeo = async (newCeoId) => {
  try {
    const res = await api.post('/members/change-ceo', { newCeoId });
    return res.data;
  } catch (err) {
    console.error("Error changing CEO:", err);
    return { success: false, error: err.message };
  }
};

export const sendOTP = async (email) => {
  try {
    const res = await api.post('/otp/send', {
      email: email
    });
    return res;
  } catch (err) {
    console.log('sendOTP API error:', err?.response?.data || err.message || err);
    return { success: false, message: err.message || "Network error" };
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const res = await api.post('/otp/verify', {
      email: email,
      otp: otp
    });
    return res;
  } catch (err) {
    console.log('verifyOTP API error:', err?.response?.data || err.message || err);
    return { success: false, message: err.message || "Network error" };
  }
};

export const sendNotification = async (title, message) => {
  try {
    const res = await api.post('/onesignal', {
      title,
      message
    });
    return res.data;
  } catch (err) {
    console.error('OneSignal API error:', err.response?.data || err.message || err);
    return { success: false, message: err.message || "Network error" };
  }
};

export const checkMember = async (email) => {
  try {
    const res = await api.get(`/members/exists`, {
      params: { email }
    });

    return res.data;   // { exists: true/false }
  } catch (err) {
    console.error('check member API error:', err.response?.data || err.message || err);
    return { success: false, message: err.message || "Network error" };
  }
};
