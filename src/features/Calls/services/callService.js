import api from "../../../services/api";

const callService = {
  getCalls: async () => {
    const { data } = await api.get("/api/calls");
    return data;
  },

  createCall: async (payload) => {
    const backendPayload = {
  client: payload.contactPerson,
  company: payload.companyName,

  contactMethod: payload.contactMethod || "Mobile",
  contactNumber: payload.contactValue,

  callType: payload.callType,
  schedule: payload.scheduledAt,
  status: payload.status,

  completedAt:
  payload.status === "Completed"
    ? payload.completedAt || null
    : null,
  assignedTo: payload.assignedTo,

  notes: payload.notes,
};

    const { data } = await api.post("/api/calls", backendPayload);
    return data;
  },

  updateCall: async (id, payload) => {
    const backendPayload = {
      client: payload.contactPerson,
      company: payload.companyName,
      contactNumber: payload.contactValue,
      contactMethod: payload.contactMethod || "Mobile",
      callType: payload.callType,
      schedule: payload.scheduledAt,
      completedAt: payload.status === "Completed" ? payload.completedAt || null : null,
      status: payload.status,
      assignedTo: payload.assignedTo || null,
      notes: payload.notes,
    };

    const { data } = await api.patch(`/api/calls/${id}`, backendPayload);
    return data;
  },

  deleteCall: async (id) => {
    const { data } = await api.delete(`/api/calls/${id}`);
    return data;
  },
};

export default callService;