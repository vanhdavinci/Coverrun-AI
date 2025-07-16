const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Create verifier outside the function to reuse
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID,
});

/**
 * Verify Cognito JWT token and return user information
 * @param {string} token - JWT token from Cognito
 * @returns {Promise<Object|null>} User object or null if invalid
 */
exports.verifyToken = async (token) => {
  try {
    if (!token) {
      return null;
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');

    // Verify the token
    const payload = await verifier.verify(cleanToken);

    // Return user information
    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username || payload['cognito:username'],
      groups: payload['cognito:groups'] || [],
      emailVerified: payload.email_verified === 'true',
      tokenExp: payload.exp
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {Object} event - Lambda event object
 * @returns {string|null} Token or null if not found
 */
exports.extractToken = (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) {
    return null;
  }

  // Check if it's a Bearer token
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Return as is if no Bearer prefix
  return authHeader;
};

/**
 * Middleware function to require authentication
 * @param {Function} handler - Lambda handler function
 * @returns {Function} Wrapped handler with auth check
 */
exports.requireAuth = (handler) => {
  return async (event, context) => {
    const token = exports.extractToken(event);
    const user = await exports.verifyToken(token);

    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid authentication token required'
        })
      };
    }

    // Add user to event for handler to use
    event.user = user;
    return handler(event, context);
  };
};

/**
 * Optional auth middleware - doesn't fail if no token
 * @param {Function} handler - Lambda handler function
 * @returns {Function} Wrapped handler with optional auth
 */
exports.optionalAuth = (handler) => {
  return async (event, context) => {
    const token = exports.extractToken(event);
    const user = await exports.verifyToken(token);

    // Add user to event (null if no valid token)
    event.user = user;
    return handler(event, context);
  };
};

/**
 * Check if user has required permissions
 * @param {Object} user - User object from verifyToken
 * @param {Array} requiredGroups - Array of required group names
 * @returns {boolean} True if user has required permissions
 */
exports.hasPermission = (user, requiredGroups) => {
  if (!user || !user.groups) {
    return false;
  }

  return requiredGroups.some(group => user.groups.includes(group));
};

/**
 * Middleware to require specific permissions
 * @param {Function} handler - Lambda handler function
 * @param {Array} requiredGroups - Array of required group names
 * @returns {Function} Wrapped handler with permission check
 */
exports.requirePermission = (handler, requiredGroups) => {
  return async (event, context) => {
    const token = exports.extractToken(event);
    const user = await exports.verifyToken(token);

    if (!user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Valid authentication token required'
        })
      };
    }

    if (!exports.hasPermission(user, requiredGroups)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        })
      };
    }

    event.user = user;
    return handler(event, context);
  };
}; 