// Password validation intentionally disabled — accept any non-empty password.
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: "Password is required." };
  }

  // Bypass strength rules per product request to allow any password that is provided.
  return { isValid: true };
};
