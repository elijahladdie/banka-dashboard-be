export const MESSAGES = {
  // ── Generic ──────────────────────────────────────
  SUCCESS: 'Success',
  ROUTE_NOT_FOUND: 'Route not found',

  // ── Auth ─────────────────────────────────────────
  AUTH: {
    ACCOUNT_CREATED: 'Account created successfully.',
    REGISTRATION_COMPLETED: 'Registration completed successfully.',
    PENDING_REGISTRATION_CHECK: 'Pending registration check completed.',
    SIGNED_IN: 'Signed in successfully.',
    FORGOT_PASSWORD: 'If the email exists, a reset link has been sent.',
    PASSWORD_RESET: 'Password has been reset successfully.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    USER_PROFILE: 'User profile retrieved.',
    NO_TOKEN: 'No token provided.',
    INVALID_TOKEN: 'Invalid or expired token.',
    AUTH_REQUIRED: 'Authentication required.',
    INSUFFICIENT_PERMISSIONS: 'Insufficient role permissions.',
    TOO_MANY_ATTEMPTS: 'Too many authentication attempts. Please try again later.',
    EMAIL_EXISTS: 'A user with this email already exists.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_DEACTIVATED: 'This account has been deactivated.',
    ACCOUNT_SUSPENDED: 'This account has been suspended.',
    ACCOUNT_INACTIVE: 'This account is inactive.',
    COMPLETE_REGISTRATION_FIRST: 'Please complete your registration first.',
    REGISTRATION_ALREADY_COMPLETED: 'Registration is already completed.',
    INVALID_TOKEN_SHORT: 'Invalid token.',
  },

  // ── Users ────────────────────────────────────────
  USERS: {
    RETRIEVED: 'Users retrieved successfully.',
    RETRIEVED_SINGLE: 'User retrieved successfully.',
    CREATED: 'User created successfully.',
    UPDATED: 'User updated successfully.',
    DELETED: 'User deleted successfully.',
    NOT_FOUND: 'User',
  },

  // ── Advisors ─────────────────────────────────────
  ADVISORS: {
    RETRIEVED: 'Advisors retrieved successfully.',
    RETRIEVED_SINGLE: 'Advisor retrieved successfully.',
    CREATED: 'Advisor created successfully.',
    UPDATED: 'Advisor updated successfully.',
    DELETED: 'Advisor deleted successfully.',
    AVAILABLE: 'Advisor is now available.',
    UNAVAILABLE: 'Advisor is now unavailable.',
    NOT_FOUND: 'No advisor found',
    ADVISOR_NOT_FOUND: 'Advisor not found',
    EMPLOYEE_CODE_EXISTS: 'Employee code already exists.',
    ALREADY_ADVISOR: 'User is already registered as an advisor.',
    NOT_AVAILABLE: 'Advisor is not available for assignments.',
    MAX_CAPACITY: 'Advisor has reached maximum client capacity.',
  },

  // ── Assignments ──────────────────────────────────
  ASSIGNMENTS: {
    RETRIEVED: 'Assignments retrieved successfully.',
    ASSIGNED: 'Client assigned to advisor successfully.',
    ENDED: 'Assignment ended successfully.',
    ACTIVE_FOUND: 'Active assignment found.',
    NO_ACTIVE: 'No active assignment.',
    NOT_FOUND: 'Assignment',
    CLIENT_NOT_FOUND: 'Client not found',
    NOT_A_CLIENT: 'User is not a client.',
    ALREADY_ASSIGNED: 'Client already has an active advisor assignment.',
    ALREADY_ENDED: 'Assignment is already ended.',
  },

  // ── Goals ────────────────────────────────────────
  GOALS: {
    RETRIEVED: 'Goals retrieved successfully.',
    RETRIEVED_SINGLE: 'Goal retrieved successfully.',
    CREATED: 'Goal created successfully.',
    UPDATED: 'Goal updated successfully.',
    PROGRESS_UPDATED: 'Goal progress updated successfully.',
    DELETED: 'Goal deleted successfully.',
    NOT_FOUND: 'Goal',
  },

  // ── Meetings ─────────────────────────────────────
  MEETINGS: {
    RETRIEVED: 'Meetings retrieved successfully.',
    RETRIEVED_SINGLE: 'Meeting retrieved successfully.',
    CREATED: 'Meeting created successfully.',
    UPDATED: 'Meeting updated successfully.',
    STATUS_UPDATED: 'Meeting status updated successfully.',
    DELETED: 'Meeting deleted successfully.',
    NOT_FOUND: 'Meeting',
  },

  // ── Notes ────────────────────────────────────────
  NOTES: {
    RETRIEVED: 'Notes retrieved successfully.',
    RETRIEVED_SINGLE: 'Note retrieved successfully.',
    CREATED: 'Note created successfully.',
    UPDATED: 'Note updated successfully.',
    DELETED: 'Note deleted successfully.',
    NOT_FOUND: 'Advisory note',
  },

  // ── Notifications ────────────────────────────────
  NOTIFICATIONS: {
    RETRIEVED: 'Notifications retrieved successfully.',
    RETRIEVED_SINGLE: 'Notification retrieved successfully.',
    MARKED_READ: 'Notification marked as read.',
    ALL_MARKED_READ: 'All notifications marked as read.',
    UNREAD_COUNT: 'Unread count retrieved.',
    NOT_FOUND: 'Notification',
  },

  // ── Service Requests ─────────────────────────────
  SERVICE_REQUESTS: {
    RETRIEVED: 'Service requests retrieved successfully.',
    RETRIEVED_SINGLE: 'Service request retrieved successfully.',
    CREATED: 'Service request created successfully.',
    UPDATED: 'Service request updated successfully.',
    MEETING_LINKED: 'Meeting linked to service request successfully.',
    NOT_FOUND: 'Service request',
  },

  // ── Subscriptions ────────────────────────────────
  SUBSCRIPTIONS: {
    RETRIEVED: 'Subscriptions retrieved successfully.',
    RETRIEVED_SINGLE: 'Subscription retrieved successfully.',
    CREATED: 'Subscription created successfully.',
    UPDATED: 'Subscription updated successfully.',
    CANCELED: 'Subscription canceled successfully.',
    NOT_FOUND: 'No subscription found.',
    NOT_FOUND_SINGLE: 'Subscription',
  },

  // ── Paddle ───────────────────────────────────────
  PADDLE: {
    PRODUCTS_RETRIEVED: 'Paddle products retrieved successfully.',
    WEBHOOK_RECEIVED: 'Webhook received successfully.',
    TRANSACTIONS_RETRIEVED: 'Transactions retrieved successfully.',
    FETCH_PRODUCTS_FAILED: 'Failed to fetch products from Paddle',
    FETCH_TRANSACTIONS_FAILED: 'Failed to fetch transactions from Paddle',
    UPDATE_FAILED: 'Failed to update subscription',
    AUTH_FAILED: 'Paddle API authentication failed. Check your API key.',
    FORBIDDEN: 'Paddle API permission denied. Check your API key permissions.',
    RATE_LIMITED: 'Paddle API rate limit exceeded. Please try again later.',
  },

  // ── Profile / Settings ───────────────────────────
  SETTINGS: {
    PROFILE_RETRIEVED: 'Profile retrieved successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    PASSWORD_CHANGED: 'Password changed successfully.',
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect.',
    USER_NOT_FOUND: 'User',
  },

  // ── Analytics ────────────────────────────────────
  ANALYTICS: {
    OVERVIEW_RETRIEVED: 'Analytics overview retrieved successfully.',
  },
} as const;
