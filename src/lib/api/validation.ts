import { ValidationError } from './errors'

// Basic validation types
export type ValidationRule<T = any> = {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: T[]
  custom?: (value: any) => boolean | string
}

export type ValidationSchema = {
  [key: string]: ValidationRule
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// URL validation regex
const URL_REGEX = /^https?:\/\/.+\..+$/

// Argentina phone number regex
const ARGENTINA_PHONE_REGEX = /^(\+54)?[0-9]{10,11}$/

// Validate a single field
function validateField(fieldName: string, value: any, rule: ValidationRule): string[] {
  const errors: string[] = []

  // Required validation
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`)
    return errors // Don't continue if required field is missing
  }

  // Skip other validations if field is not provided and not required
  if (value === undefined || value === null || value === '') {
    return errors
  }

  // Type validation
  if (rule.type) {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${fieldName} must be a string`)
        }
        break
      case 'number':
        if (typeof value !== 'number' && !Number.isFinite(Number(value))) {
          errors.push(`${fieldName} must be a number`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${fieldName} must be a boolean`)
        }
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${fieldName} must be an object`)
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`)
        }
        break
      case 'email':
        if (typeof value === 'string' && !EMAIL_REGEX.test(value)) {
          errors.push(`${fieldName} must be a valid email address`)
        }
        break
      case 'url':
        if (typeof value === 'string' && !URL_REGEX.test(value)) {
          errors.push(`${fieldName} must be a valid URL`)
        }
        break
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${fieldName} must be at least ${rule.minLength} characters`)
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`)
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`${fieldName} must be at least ${rule.min}`)
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`${fieldName} must be no more than ${rule.max}`)
    }
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    errors.push(`${fieldName} format is invalid`)
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`${fieldName} must be one of: ${rule.enum.join(', ')}`)
  }

  // Custom validation
  if (rule.custom) {
    const result = rule.custom(value)
    if (result !== true) {
      errors.push(typeof result === 'string' ? result : `${fieldName} is invalid`)
    }
  }

  return errors
}

// Validate request body
export function validateRequestBody(body: any, schema: ValidationSchema): void {
  const errors: string[] = []

  for (const [fieldName, rule] of Object.entries(schema)) {
    const fieldErrors = validateField(fieldName, body?.[fieldName], rule)
    errors.push(...fieldErrors)
  }

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`)
  }
}

// Validate query parameters
export function validateQueryParams(searchParams: URLSearchParams, schema: ValidationSchema): void {
  const errors: string[] = []

  for (const [fieldName, rule] of Object.entries(schema)) {
    let value: any = searchParams.get(fieldName)
    
    // Convert string values to appropriate types
    if (value !== null && rule.type) {
      switch (rule.type) {
        case 'number':
          value = Number(value)
          break
        case 'boolean':
          value = value === 'true'
          break
      }
    }

    const fieldErrors = validateField(fieldName, value, rule)
    errors.push(...fieldErrors)
  }

  if (errors.length > 0) {
    throw new ValidationError(`Query parameter validation failed: ${errors.join(', ')}`)
  }
}

// Common validation schemas
export const commonSchemas = {
  // User registration
  userRegistration: {
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 8 },
    firstName: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
    lastName: { required: true, type: 'string' as const, minLength: 1, maxLength: 50 },
    phone: { 
      type: 'string' as const, 
      pattern: ARGENTINA_PHONE_REGEX,
      custom: (value: string) => !value || ARGENTINA_PHONE_REGEX.test(value) || 'Phone number must be a valid Argentina number'
    }
  },

  // User login
  userLogin: {
    email: { required: true, type: 'email' as const },
    password: { required: true, type: 'string' as const, minLength: 1 }
  },

  // Contact form
  contactForm: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    subject: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    message: { required: true, type: 'string' as const, minLength: 10, maxLength: 1000 }
  },

  // Newsletter subscription
  newsletter: {
    email: { required: true, type: 'email' as const },
    name: { type: 'string' as const, maxLength: 100 }
  },

  // Checkout request
  checkout: {
    items: { required: true, type: 'array' as const },
    payer_info: { required: true, type: 'object' as const }
  },

  // Pagination
  pagination: {
    page: { type: 'number' as const, min: 1 },
    limit: { type: 'number' as const, min: 1, max: 100 },
    sort: { type: 'string' as const, enum: ['asc', 'desc'] }
  }
}

// Helper to sanitize input data
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data.trim()
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput)
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return data
}

// Request body parser and validator
export async function parseAndValidateBody(
  request: Request, 
  schema: ValidationSchema
): Promise<any> {
  try {
    const body = await request.json()
    const sanitizedBody = sanitizeInput(body)
    validateRequestBody(sanitizedBody, schema)
    return sanitizedBody
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body')
    }
    throw error
  }
} 