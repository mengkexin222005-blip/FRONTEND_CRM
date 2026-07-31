export const isUserInactive = (user) => {
  if (!user?.status) return false;
  return user.status.toLowerCase() !== "active";
};

export const getUserState = (user) => {
  if (!user) return null;

  // Inactive
  if (isUserInactive(user)) {
    return {
      tone: "gray",
      icon: "inactive",
      message: "This user is inactive.",
    };
  }

  return null;
};