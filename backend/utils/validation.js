/**
 * Validation utility functions
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

const validateMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

const validateNumber = (value, fieldName) => {
  if (isNaN(value) || value < 0) {
    return `${fieldName} must be a valid positive number`;
  }
  return null;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

export {
  validateEmail,
  validatePassword,
  validateMobile,
  validateRequired,
  validateNumber,
  sanitizeInput
};
