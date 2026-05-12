import api from "../config/api";

export const getAllMemberDirectories = async () => {
  try {
    const res = await api.get("/member-directories");
    return res.data;
  } catch (error) {
    console.error("Error fetching member directories:", error);
    return { success: false, data: [] };
  }
};

export const getMemberDirectoryById = async (id) => {
  try {
    const res = await api.get(`/member-directories/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching member directory detail:", error);
    return { success: false, data: null };
  }
};

export const createMemberDirectory = async (payload) => {
  try {
    const formData = new FormData();
    formData.append("name", payload.name || "");
    formData.append("subtitle", payload.subtitle || "");
    formData.append("description", payload.description || "");
    formData.append("website", payload.website || "");

    if (payload.logoUrl) {
      formData.append("logoUrl", payload.logoUrl);
    }

    (payload.memberIds || []).forEach((id) => {
      formData.append("memberIds[]", id);
    });

    const res = await api.post("/member-directories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error("Error creating member directory:", error);
    return { success: false };
  }
};

export const updateMemberDirectory = async (id, payload) => {
  try {
    const formData = new FormData();
    formData.append("name", payload.name || "");
    formData.append("subtitle", payload.subtitle || "");
    formData.append("description", payload.description || "");
    formData.append("website", payload.website || "");

    if (payload.logoUrl) {
      formData.append("logoUrl", payload.logoUrl);
    }

    (payload.memberIds || []).forEach((id) => {
      formData.append("memberIds[]", id);
    });

    const res = await api.put(`/member-directories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.error("Error updating member directory:", error);
    return { success: false };
  }
};

export const deleteMemberDirectory = async (id) => {
  try {
    const res = await api.delete(`/member-directories/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting member directory:", error);
    return { success: false };
  }
};