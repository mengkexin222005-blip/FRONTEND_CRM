const isFormData = (value) => value instanceof FormData;

export const getTaskFormValue = (formData, key, fallback = "") => {
  if (isFormData(formData)) {
    const value = formData.get(key);
    return value === null ? fallback : value;
  }

  return formData?.[key] ?? fallback;
};

export const buildTaskPayload = (formData, options = {}) => {
  const includeStatus = options.includeStatus !== false;
  const payload = {
    subject: getTaskFormValue(formData, "subject", formData?.subject || ""),
    description: getTaskFormValue(formData, "description", formData?.description || ""),
    taskType: getTaskFormValue(formData, "taskType", formData?.taskType || "Other"),
    priority: getTaskFormValue(formData, "priority", formData?.priority || "Medium"),
    scope: getTaskFormValue(formData, "scope", formData?.scope || "Personal"),
    dueDate: getTaskFormValue(formData, "dueDate", formData?.dueDate || null),
    dueTime: getTaskFormValue(formData, "dueTime", formData?.dueTime || ""),
    link: getTaskFormValue(formData, "link", formData?.link || ""),
    linkName: getTaskFormValue(formData, "linkName", formData?.linkName || ""),
    links: Array.isArray(formData?.links) ? formData.links : [],
    reminderAt: getTaskFormValue(formData, "reminderAt", formData?.reminderAt || null),
    repeat: getTaskFormValue(formData, "repeat", formData?.repeat || "None"),
    relatedToType: getTaskFormValue(formData, "relatedToType", formData?.relatedToType || null),
    relatedTo: getTaskFormValue(formData, "relatedTo", formData?.relatedTo || null),
  };

  if (includeStatus) {
    payload.status = getTaskFormValue(formData, "status", formData?.status || "Pending");
  }

  if (formData?.assignedTo !== undefined || formData?.get?.("assignedTo") !== undefined) {
    payload.assignedTo = getTaskFormValue(formData, "assignedTo", formData?.assignedTo || null);
  }

  if (formData?.status !== undefined || formData?.get?.("status") !== undefined) {
    payload.status = getTaskFormValue(formData, "status", formData?.status || "Pending");
  }

  return payload;
};
