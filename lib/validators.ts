export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password) {
    return { isValid: false, message: "Password is required." };
  }

  const requirements = [
    { test: password.length >= 8 && password.length <= 16, text: "8-16 characters" },
    { test: /[A-Z]/.test(password), text: "uppercase" },
    { test: /[a-z]/.test(password), text: "lowercase" },
    { test: /[0-9]/.test(password), text: "number" },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: "special character" }
  ];

  const failedRequirements = requirements.filter(req => !req.test);

  if (failedRequirements.length > 0) {
    const requirementsList = failedRequirements.map(req => req.text).join(", ");
    return { 
      isValid: false, 
      message: `Password must have: ${requirementsList}` 
    };
  }

  return { isValid: true };
};
