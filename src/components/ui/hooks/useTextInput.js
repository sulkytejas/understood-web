import { useState, useCallback } from 'react';

/**
 * Custom hook for managing TextInput state and validation
 * @param {Object} initialValues - Initial values for the form fields
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} - Form state and handlers
 */
export const useTextInput = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback(
    (field, value) => {
      const rules = validationRules[field];
      if (!rules) return null;

      for (const rule of rules) {
        const error = rule(value);
        if (error) return error;
      }
      return null;
    },
    [validationRules],
  );

  const handleChange = useCallback(
    (field) => (event) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));

      // Validate on change if field was touched
      if (touched[field]) {
        const error = validate(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validate],
  );

  const handleBlur = useCallback(
    (field) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validate(field, values[field]);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [values, validate],
  );

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validate(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {},
      ),
    );

    return isValid;
  }, [validationRules, values, validate]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field, error) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.keys(errors).every((key) => !errors[key]),
  };
};

// Common validation rules
export const validators = {
  required:
    (message = 'This field is required') =>
    (value) =>
      !value ? message : null,

  email:
    (message = 'Invalid email address') =>
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value && !emailRegex.test(value) ? message : null;
    },

  minLength: (min, message) => (value) =>
    value && value.length < min
      ? message || `Minimum ${min} characters required`
      : null,

  maxLength: (max, message) => (value) =>
    value && value.length > max
      ? message || `Maximum ${max} characters allowed`
      : null,

  pattern:
    (regex, message = 'Invalid format') =>
    (value) =>
      value && !regex.test(value) ? message : null,

  numeric:
    (message = 'Only numbers allowed') =>
    (value) =>
      value && !/^\d+$/.test(value) ? message : null,

  phone:
    (message = 'Invalid phone number') =>
    (value) => {
      const phoneRegex = /^[\d\s()+-]+$/;
      return value && !phoneRegex.test(value) ? message : null;
    },

  match: (fieldName, message) => (value, allValues) =>
    value !== allValues[fieldName]
      ? message || `Must match ${fieldName}`
      : null,
};
