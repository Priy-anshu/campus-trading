import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendSuccess, sendError, sendValidationError, sendUnauthorized } from '../utils/response.js';
import { validateEmail, validatePassword, validateMobile, validateRequired, sanitizeInput } from '../utils/validation.js';
import authService from '../services/authService.js';

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, mobileNumber, dateOfBirth, gender } = req.body;

      // Validation
      const errors = [];
      
      const nameError = validateRequired(name, 'Name');
      if (nameError) errors.push(nameError);
      
      const emailError = validateRequired(email, 'Email');
      if (emailError) errors.push(emailError);
      else if (!validateEmail(email)) errors.push('Invalid email format');
      
      const passwordError = validateRequired(password, 'Password');
      if (passwordError) errors.push(passwordError);
      else if (!validatePassword(password)) errors.push('Password must be at least 6 characters');

      if (mobileNumber && !validateMobile(mobileNumber)) {
        errors.push('Invalid mobile number format');
      }

      if (errors.length > 0) {
        return sendValidationError(res, errors);
      }

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email).toLowerCase(),
        password,
        mobileNumber: mobileNumber ? sanitizeInput(mobileNumber) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender: gender ? sanitizeInput(gender) : undefined
      };

      const result = await authService.register(sanitizedData);
      
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      console.error('Registration error:', error);
      return sendError(res, error.message, 400, error);
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      const errors = [];
      
      const emailError = validateRequired(email, 'Email');
      if (emailError) errors.push(emailError);
      
      const passwordError = validateRequired(password, 'Password');
      if (passwordError) errors.push(passwordError);

      if (errors.length > 0) {
        return sendValidationError(res, errors);
      }

      const result = await authService.login(email.toLowerCase(), password);
      
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      console.error('Login error:', error);
      return sendError(res, error.message, 401, error);
    }
  }

  static async getUser(req, res) {
    try {
      const userId = req.user.id;
      const user = await authService.getUserById(userId);
      
      return sendSuccess(res, user, 'User data retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      return sendError(res, error.message, 500, error);
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Validation
      const errors = [];
      
      const currentPasswordError = validateRequired(currentPassword, 'Current password');
      if (currentPasswordError) errors.push(currentPasswordError);
      
      const newPasswordError = validateRequired(newPassword, 'New password');
      if (newPasswordError) errors.push(newPasswordError);
      else if (!validatePassword(newPassword)) errors.push('New password must be at least 6 characters');

      if (errors.length > 0) {
        return sendValidationError(res, errors);
      }

      await authService.changePassword(userId, currentPassword, newPassword);
      
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      return sendError(res, error.message, 400, error);
    }
  }
}

export default AuthController;
