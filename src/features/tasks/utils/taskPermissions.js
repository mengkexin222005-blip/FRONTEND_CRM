// taskPermissions.js
export const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return user._id || user.id || user.userId || null;
};

export const canViewTask = (task, currentUser) => {
  const currentUserId = getUserId(currentUser);
  if (!currentUserId) return false;

  const creatorId = getUserId(task?.createdBy);
  const assigneeId = getUserId(task?.assignedTo);

  return (
    (creatorId && String(currentUserId) === String(creatorId)) ||
    (assigneeId && String(currentUserId) === String(assigneeId))
  );
};

export const canFullyEditTask = (task, currentUser) => {
  if (!currentUser) return false;

  const role = currentUser?.role || "";
  if (role === "Admin" || role === "Sales Manager") return true;

  const currentUserId = getUserId(currentUser);
  if (!currentUserId) return false;

  const creatorId = getUserId(task?.createdBy);
  const assigneeId = getUserId(task?.assignedTo);

  return (
    (creatorId && String(currentUserId) === String(creatorId)) ||
    (assigneeId && String(currentUserId) === String(assigneeId))
  );
};

export const canDeleteTask = (task, currentUser) => {
  if (!currentUser) return false;
  const role = currentUser?.role || "";
  if (role === "Admin" || role === "Sales Manager") return true;

  const currentUserId = getUserId(currentUser);
  const creatorId = getUserId(task?.createdBy);

  return (
    role === "Sales Agent" &&
    task?.scope === "Personal" &&
    creatorId &&
    String(currentUserId) === String(creatorId)
  );
};

export const getTaskEditDisabledReason = (task, currentUser) => {
  if (!canFullyEditTask(task, currentUser)) {
    return "Only the task creator or assigned agent can fully edit this task.";
  }
  return "";
};
