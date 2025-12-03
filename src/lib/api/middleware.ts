import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { RateLimitError, AuthenticationError, AuthorizationError } from './errors'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string  // Custom key generator
  skipSuccessfulRequests?: boolean  // Don't count successful requests
  skipFailedRequests?: boolean  // Don't count failed requests
}

// Default rate limit configurations
export const rateLimitConfigs = {
  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  
  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  
  // Contact form (prevent spam)
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  
  // Payment endpoints (very restrictive)
  payment: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
  }
}

// Rate limiting middleware
export function withRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    const key = config.keyGenerator 
      ? config.keyGenerator(request)
      : getClientIdentifier(request)
    
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    // Get current count for this key
    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      // First request in window or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
    } else if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
      )
    } else {
      // Increment count
      current.count++
      rateLimitStore.set(key, current)
    }
    
    const response = await handler()
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - (current?.count || 1)).toString())
    response.headers.set('X-RateLimit-Reset', ((current?.resetTime || now + config.windowMs) / 1000).toString())
    
    return response
  }
}

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for reverse proxies)
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const clientIp = xForwardedFor?.split(',')[0] || xRealIp || request.ip || 'unknown'
  
  // For authenticated requests, also include user agent for more specificity
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return `${clientIp}:${userAgent.substring(0, 50)}`
}

// Authentication middleware
export async function requireAuth(request: NextRequest): Promise<{ userId: string; user: any }> {
  const authorization = request.headers.get('authorization')
  
  if (!authorization?.startsWith('Bearer ')) {
    throw new AuthenticationError('Authorization header required')
  }
  
  const token = authorization.slice(7)
  
  try {
    const supabase = createServiceRoleClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token')
    }
    
    return { userId: user.id, user }
  } catch (error) {
    throw new AuthenticationError('Authentication failed')
  }
}

// Role-based authorization middleware using admin_users table
export async function requireRole(userId: string, requiredRole: string = 'admin'): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    // Check if user is in admin_users table
    const { data: isAdmin, error: adminError } = await (supabase as any)
      .rpc('is_admin', { user_id: userId })
    
    if (adminError) {
      console.error('Error checking admin status:', adminError)
      throw new AuthorizationError('Unable to verify admin status')
    }
    
    if (!isAdmin) {
      throw new AuthorizationError('Insufficient permissions - admin access required')
    }
    
    // If specific role is required, check that too
    if (requiredRole !== 'admin') {
      const { data: userRole, error: roleError } = await (supabase as any)
        .rpc('get_admin_role', { user_id: userId })
      
      if (roleError) {
        console.error('Error getting admin role:', roleError)
        throw new AuthorizationError('Unable to verify admin role')
      }
      
      // Simplified role system - only 'admin' role
      if (userRole !== 'admin') {
        throw new AuthorizationError('Admin role required')
      }
      
      // Check if required role is also admin
      if (requiredRole && requiredRole !== 'admin') {
        throw new AuthorizationError(`Invalid role requirement - only 'admin' role exists`)
      }
    }
    
    console.log(`Admin access verified for user ${userId} with role check: ${requiredRole}`)
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error
    }
    console.error('Unexpected error in role check:', error)
    throw new AuthorizationError('Authentication system error')
  }
}

// Log admin activity for audit trail
export async function logAdminActivity(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    
    await (supabase as any).rpc('log_admin_activity', {
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId || null,
      p_details: details ? JSON.stringify(details) : null
    })
  } catch (error) {
    console.error('Error logging admin activity:', error)
    // Don't throw here - logging failures shouldn't break the main operation
  }
}

// Security headers middleware
export function withSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (basic)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: http:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://www.mercadopago.com"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

// CORS middleware
export function withCORS(
  response: NextResponse, 
  origin?: string,
  methods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
): NextResponse {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://daluzconsciente.com',
    'https://www.daluzconsciente.com'
  ].filter(Boolean)
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
  
  return response
}

// Request logging middleware
export function logRequest(request: NextRequest, startTime: number = Date.now()) {
  const method = request.method
  const url = request.url
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const clientIp = getClientIdentifier(request).split(':')[0]
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${clientIp} - ${userAgent}`)
  
  // Return a function to log the response
  return (response: NextResponse) => {
    const duration = Date.now() - startTime
    const status = response.status
    
    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - ${status} - ${duration}ms`
    )
  }
}

// Middleware composer to chain multiple middlewares
export function composeMiddleware<T extends any[]>(
  ...middlewares: Array<(request: NextRequest, handler: () => Promise<NextResponse>) => Promise<NextResponse>>
) {
  return async (request: NextRequest, baseHandler: () => Promise<NextResponse>) => {
    let handler = baseHandler
    
    // Apply middlewares in reverse order
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const middleware = middlewares[i]
      const currentHandler = handler
      handler = () => middleware(request, currentHandler)
    }
    
    return handler()
  }
}

// Request ID middleware
export function withRequestId(response: NextResponse): NextResponse {
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)
  return response
}

// Health check bypass (skip rate limiting for health checks)
export function isHealthCheck(request: NextRequest): boolean {
  const url = new URL(request.url)
  return url.pathname === '/api/health' || url.pathname === '/health'
} 