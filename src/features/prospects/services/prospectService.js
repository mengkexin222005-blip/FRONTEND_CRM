import api from "../../../services/api";

const prospectService = {
  getProspects: async () => {
    const { data } = await api.get("/api/prospects");
    return data;
  },

  createProspect: async (payload) => {
    const { data } = await api.post("/api/prospects", payload);
    return data;
  },

  updateProspect: async (id, payload) => {
    const { data } = await api.patch(`/api/prospects/${id}`, payload);
    return data;
  },

  deleteProspect: async (id) => {
    const { data } = await api.delete(`/api/prospects/${id}`);
    return data;
  },

  markAsContacted: async (id) => {
    const { data } = await api.patch(`/api/prospects/${id}/contacted`);
    return data;
  },
};

export default prospectService;