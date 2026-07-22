import api from "./api";

const unwrap = (response) =>
  response?.data ?? response;

export const login = async (
  emailOrPayload,
  password,
) => {
  const payload =
    typeof emailOrPayload === "object" &&
    emailOrPayload !== null
      ? emailOrPayload
      : {
          email: emailOrPayload,
          password,
        };

  const response = await api.post(
    "/api/auth/login",
    payload,
  );

  return unwrap(response);
};

export const refreshToken = async () => {
  const response = await api.post(
    "/api/auth/refresh",
  );

  return unwrap(response);
};

export const logout = async () => {
  const response = await api.post(
    "/api/auth/logout",
  );

  return unwrap(response);
};

export const forgotPassword = async (
  emailOrPayload,
) => {
  const payload =
    typeof emailOrPayload === "object" &&
    emailOrPayload !== null
      ? emailOrPayload
      : {
          email: emailOrPayload,
        };

  const response = await api.post(
    "/api/auth/forgot-password",
    payload,
  );

  return unwrap(response);
};

export const resetPassword = async (
  tokenOrPayload,
  newPassword,
) => {
  const payload =
    typeof tokenOrPayload === "object" &&
    tokenOrPayload !== null
      ? tokenOrPayload
      : {
          token: tokenOrPayload,
          newPassword,
        };

  const response = await api.post(
    "/api/auth/reset-password",
    payload,
  );

  return unwrap(response);
};