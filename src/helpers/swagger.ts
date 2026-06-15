import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banka - Financial Advisory Platform API',
      version: '1.0.0',
      description: `
        Production-grade REST API for Banka, a Rwanda-based Financial Advisory Platform.

        ## System Roles
        - **Platform Admin** — Full platform access
        - **Finance Officer** — Operational management (create/manage advisors, assign subscribers)
        - **Financial Advisor** — Access only assigned subscribers
        - **Subscriber** — Access only personal information

        ## Architecture
        \`\`\`
        Controller → Application Service → Domain Service → Repository → Prisma → PostgreSQL
        \`\`\`
        All endpoints require JWT authentication unless marked as public.
      `,
      contact: {
        email: 'support@banka.rw',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ============================================================
        // Core Schemas
        // ============================================================
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string' },
            role: {
              type: 'string',
              enum: ['PLATFORM_ADMIN', 'FINANCE_OFFICER', 'FINANCIAL_ADVISOR', 'SUBSCRIBER'],
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'],
            },
            emailVerified: { type: 'boolean' },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            plan: { type: 'string', enum: ['STARTER', 'PRO', 'ADVANCED'] },
            status: { type: 'string', enum: ['ACTIVE', 'PAST_DUE', 'TRIALING', 'CANCELED', 'EXPIRED'] },
            billingInterval: { type: 'string', enum: ['MONTHLY', 'YEARLY'] },
            customerId: { type: 'string', nullable: true },
            subscriptionId: { type: 'string', nullable: true },
            startsAt: { type: 'string', format: 'date-time', nullable: true },
            endsAt: { type: 'string', format: 'date-time', nullable: true },
            cancelAtPeriodEnd: { type: 'boolean' },
            canceledAt: { type: 'string', format: 'date-time', nullable: true },
            trialStart: { type: 'string', format: 'date-time', nullable: true },
            trialEnd: { type: 'string', format: 'date-time', nullable: true },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Advisor: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            employeeCode: { type: 'string' },
            specialization: { type: 'string', nullable: true },
            bio: { type: 'string', nullable: true },
            maxClients: { type: 'integer' },
            currentClients: { type: 'integer' },
            isAvailable: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        SubscriberAssignment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            subscriberId: { type: 'string', format: 'uuid' },
            advisorId: { type: 'string', format: 'uuid' },
            assignedBy: { type: 'string', format: 'uuid' },
            assignedAt: { type: 'string', format: 'date-time' },
            endedAt: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            subscriberId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            targetAmount: { type: 'number', nullable: true },
            currentAmount: { type: 'number' },
            targetDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AdvisoryNote: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            advisorId: { type: 'string', format: 'uuid' },
            subscriberId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FinancialReport: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            subscriberId: { type: 'string', format: 'uuid' },
            advisorId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            reportType: { type: 'string', enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'] },
            fileUrl: { type: 'string', nullable: true },
            summary: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Meeting: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            advisorId: { type: 'string', format: 'uuid' },
            subscriberId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            meetingDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
            meetingLink: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string', enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER'] },
            readAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string', format: 'uuid', nullable: true },
            oldValues: { type: 'object', nullable: true },
            newValues: { type: 'object', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AnalyticsOverview: {
          type: 'object',
          properties: {
            totalSubscribers: { type: 'integer' },
            totalAdvisors: { type: 'integer' },
            activeSubscriptions: { type: 'integer' },
            revenueByPlan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  plan: { type: 'string' },
                  revenue: { type: 'number' },
                  count: { type: 'integer' },
                },
              },
            },
            monthlyRevenue: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  revenue: { type: 'number' },
                },
              },
            },
            advisorCapacity: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                utilized: { type: 'integer' },
                available: { type: 'integer' },
              },
            },
            goalCompletionRate: {
              type: 'object',
              properties: {
                completed: { type: 'integer' },
                total: { type: 'integer' },
                rate: { type: 'integer' },
              },
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
            stack: { type: 'string' },
          },
        },
        PaginatedMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrevious: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Auth endpoints (signup, signin, tokens)' },
      { name: 'Users', description: 'User management (admin only)' },
      { name: 'Subscriptions', description: 'Subscription lifecycle management' },
      { name: 'Advisors', description: 'Advisor profiles and management' },
      { name: 'Assignments', description: 'Subscriber-to-Advisor assignments' },
      { name: 'Goals', description: 'Financial goals tracking' },
      { name: 'Reports', description: 'Financial reports' },
      { name: 'Meetings', description: 'Advisor-subscriber meetings' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Analytics', description: 'Dashboard analytics (admin/finance)' },
      { name: 'Audit Logs', description: 'Compliance audit trail (admin only)' },
      { name: 'Settings', description: 'Profile and password management' },
      { name: 'Notes', description: 'Advisory notes from advisors' },
      { name: 'Paddle', description: 'Paddle API integration (products & pricing)' },
    ],
    paths: {
      // ============================================================
      // Health
      // ============================================================
      '/api/health': {
        get: {
          tags: ['Authentication'],
          summary: 'Health check',
          security: [],
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      timestamp: { type: 'string' },
                      uptime: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ============================================================
      // Authentication
      // ============================================================
      '/api/auth/signup': {
        post: {
          tags: ['Authentication'],
          summary: 'Create a new subscriber account',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'firstName', 'lastName'],
                  properties: {
                    email: { type: 'string', format: 'email', description: 'User email address' },
                    password: { type: 'string', minLength: 8, description: 'Must contain uppercase, lowercase, and number' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phoneNumber: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Account created successfully' },
            409: { description: 'Email already exists' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/api/auth/signin': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign in with email and password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Signed in successfully, returns user + tokens' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Sign out (revoke all refresh tokens)',
          responses: { 200: { description: 'Signed out successfully' } },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Request password reset',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', format: 'email' } },
                },
              },
            },
          },
          responses: { 200: { description: 'If email exists, reset link sent' } },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Reset password with token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password reset successfully' } },
        },
      },
      '/api/auth/verify-email': {
        post: {
          tags: ['Authentication'],
          summary: 'Verify authenticated user email',
          responses: { 200: { description: 'Email verified successfully' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current authenticated user info',
          responses: { 200: { description: 'Current user payload', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } } },
        },
      },

      // ============================================================
      // Users (Admin)
      // ============================================================
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (Admin/Finance)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'role', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string' } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: {
            200: { description: 'Paginated list of users' },
          },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User details' }, 404: { description: 'User not found' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    role: { type: 'string', enum: ['PLATFORM_ADMIN', 'FINANCE_OFFICER', 'FINANCIAL_ADVISOR', 'SUBSCRIBER'] },
                    status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'User updated' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Soft delete user (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'User deleted' } },
        },
      },

      // ============================================================
      // Subscriptions
      // ============================================================
      '/api/subscriptions': {
        get: {
          tags: ['Subscriptions'],
          summary: 'List all subscriptions (Admin/Finance)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'plan', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated subscriptions' } },
        },
        post: {
          tags: ['Subscriptions'],
          summary: 'Create a subscription',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plan: { type: 'string', enum: ['STARTER', 'PRO', 'ADVANCED'] },
                    billingInterval: { type: 'string', enum: ['MONTHLY', 'YEARLY'] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Subscription created' } },
        },
      },
      '/api/subscriptions/my': {
        get: {
          tags: ['Subscriptions'],
          summary: 'Get current user subscription',
          responses: { 200: { description: 'Current subscription or null' } },
        },
      },
      '/api/subscriptions/{id}': {
        get: {
          tags: ['Subscriptions'],
          summary: 'Get subscription by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Subscription details' } },
        },
        put: {
          tags: ['Subscriptions'],
          summary: 'Update subscription',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Subscription updated' } },
        },
      },
      '/api/subscriptions/{id}/cancel': {
        post: {
          tags: ['Subscriptions'],
          summary: 'Cancel subscription',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Subscription canceled' } },
        },
      },

      // ============================================================
      // Paddle — Products & Pricing (from Paddle API)
      // ============================================================
      '/api/paddle/products': {
        get: {
          tags: ['Paddle'],
          summary: 'List Paddle products with prices (Admin/Finance/Advisor)',
          description: 'Fetches products with embedded prices from Paddle. Use ?interval=month or ?interval=year to filter prices by billing cycle.',
          parameters: [
            { name: 'interval', in: 'query', schema: { type: 'string', enum: ['month', 'year'] }, description: 'Filter prices by billing interval (month or year). If omitted, returns all prices.' },
          ],
          responses: { 200: { description: 'Paddle products with prices retrieved successfully' } },
        },
      },

      // ============================================================
      // Advisors
      // ============================================================
      '/api/advisors': {
        get: {
          tags: ['Advisors'],
          summary: 'List all advisors',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'isAvailable', in: 'query', schema: { type: 'string' } },
            { name: 'specialization', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated advisors with user data' } },
        },
        post: {
          tags: ['Advisors'],
          summary: 'Create an advisor profile (Admin/Finance)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['userId', 'employeeCode'],
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    employeeCode: { type: 'string' },
                    specialization: { type: 'string' },
                    bio: { type: 'string' },
                    maxClients: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Advisor created' } },
        },
      },
      '/api/advisors/{id}': {
        get: {
          tags: ['Advisors'],
          summary: 'Get advisor by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Advisor with user data' } },
        },
        put: {
          tags: ['Advisors'],
          summary: 'Update advisor (Admin/Finance)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Advisor updated' } },
        },
        delete: {
          tags: ['Advisors'],
          summary: 'Soft delete advisor (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Advisor deleted' } },
        },
      },
      '/api/advisors/{id}/toggle-availability': {
        patch: {
          tags: ['Advisors'],
          summary: 'Toggle advisor availability (Admin/Finance)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Availability toggled' } },
        },
      },

      // ============================================================
      // Assignments
      // ============================================================
      '/api/assignments': {
        get: {
          tags: ['Assignments'],
          summary: 'List all assignments (Admin/Finance)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'isActive', in: 'query', schema: { type: 'string' } },
            { name: 'advisorId', in: 'query', schema: { type: 'string' } },
            { name: 'subscriberId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated assignments' } },
        },
      },
      '/api/assignments/assign': {
        post: {
          tags: ['Assignments'],
          summary: 'Assign subscriber to advisor (Admin/Finance)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subscriberId', 'advisorId'],
                  properties: {
                    subscriberId: { type: 'string', format: 'uuid' },
                    advisorId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Assignment created' }, 409: { description: 'Already assigned or advisor unavailable' } },
        },
      },
      '/api/assignments/active/{subscriberId}': {
        get: {
          tags: ['Assignments'],
          summary: 'Get active assignment for a subscriber',
          parameters: [{ name: 'subscriberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Active assignment or null' } },
        },
      },
      '/api/assignments/{id}/end': {
        post: {
          tags: ['Assignments'],
          summary: 'End an assignment (Admin/Finance)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Assignment ended' } },
        },
      },

      // ============================================================
      // Goals
      // ============================================================
      '/api/goals': {
        get: {
          tags: ['Goals'],
          summary: 'List all goals (Admin/Finance/Advisor)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'subscriberId', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated goals' } },
        },
        post: {
          tags: ['Goals'],
          summary: 'Create a financial goal',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    targetAmount: { type: 'number' },
                    targetDate: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Goal created' } },
        },
      },
      '/api/goals/my': {
        get: {
          tags: ['Goals'],
          summary: 'Get current user goals',
          responses: { 200: { description: 'Paginated goals for current user' } },
        },
      },
      '/api/goals/subscriber/{subscriberId}': {
        get: {
          tags: ['Goals'],
          summary: 'Get goals for a specific subscriber',
          parameters: [{ name: 'subscriberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Paginated goals' } },
        },
      },
      '/api/goals/{id}': {
        get: {
          tags: ['Goals'],
          summary: 'Get goal by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Goal details' } },
        },
        put: {
          tags: ['Goals'],
          summary: 'Update goal',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Goal updated' } },
        },
        delete: {
          tags: ['Goals'],
          summary: 'Soft delete goal',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Goal deleted' } },
        },
      },
      '/api/goals/{id}/progress': {
        patch: {
          tags: ['Goals'],
          summary: 'Update goal progress amount',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentAmount'],
                  properties: { currentAmount: { type: 'number' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Goal progress updated' } },
        },
      },

      // ============================================================
      // Reports
      // ============================================================
      '/api/reports': {
        get: {
          tags: ['Reports'],
          summary: 'List all financial reports',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'subscriberId', in: 'query', schema: { type: 'string' } },
            { name: 'reportType', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated reports' } },
        },
        post: {
          tags: ['Reports'],
          summary: 'Create a financial report',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    subscriberId: { type: 'string', format: 'uuid' },
                    advisorId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    reportType: { type: 'string', enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'] },
                    fileUrl: { type: 'string' },
                    summary: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Report created' } },
        },
      },
      '/api/reports/{id}': {
        get: {
          tags: ['Reports'],
          summary: 'Get report by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Report details' } },
        },
        put: {
          tags: ['Reports'],
          summary: 'Update report',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Report updated' } },
        },
        delete: {
          tags: ['Reports'],
          summary: 'Delete report',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Report deleted' } },
        },
      },

      // ============================================================
      // Meetings
      // ============================================================
      '/api/meetings': {
        get: {
          tags: ['Meetings'],
          summary: 'List all meetings',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'advisorId', in: 'query', schema: { type: 'string' } },
            { name: 'subscriberId', in: 'query', schema: { type: 'string' } },
            { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Paginated meetings' } },
        },
        post: {
          tags: ['Meetings'],
          summary: 'Schedule a meeting',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advisorId', 'subscriberId', 'title', 'meetingDate'],
                  properties: {
                    advisorId: { type: 'string', format: 'uuid' },
                    subscriberId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    meetingDate: { type: 'string', format: 'date-time' },
                    meetingLink: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Meeting created' } },
        },
      },
      '/api/meetings/{id}': {
        get: {
          tags: ['Meetings'],
          summary: 'Get meeting by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Meeting details' } },
        },
        put: {
          tags: ['Meetings'],
          summary: 'Update meeting',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Meeting updated' } },
        },
        delete: {
          tags: ['Meetings'],
          summary: 'Delete meeting',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Meeting deleted' } },
        },
      },
      '/api/meetings/{id}/status': {
        patch: {
          tags: ['Meetings'],
          summary: 'Update meeting status',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Meeting status updated' } },
        },
      },

      // ============================================================
      // Notifications
      // ============================================================
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'List current user notifications',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'unreadOnly', in: 'query', schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated notifications' } },
        },
      },
      '/api/notifications/unread-count': {
        get: {
          tags: ['Notifications'],
          summary: 'Get unread notification count',
          responses: { 200: { description: 'Unread count' } },
        },
      },
      '/api/notifications/{id}': {
        get: {
          tags: ['Notifications'],
          summary: 'Get notification by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notification details' } },
        },
        delete: {
          tags: ['Notifications'],
          summary: 'Delete notification',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notification deleted' } },
        },
      },
      '/api/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notification marked as read' } },
        },
      },
      '/api/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications as read',
          responses: { 200: { description: 'All notifications marked as read' } },
        },
      },

      // ============================================================
      // Analytics
      // ============================================================
      '/api/analytics/overview': {
        get: {
          tags: ['Analytics'],
          summary: 'Dashboard analytics overview (Admin/Finance)',
          responses: { 200: { description: 'Analytics overview data', content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsOverview' } } } } },
        },
      },

      // ============================================================
      // Audit Logs
      // ============================================================
      '/api/audit-logs': {
        get: {
          tags: ['Audit Logs'],
          summary: 'List audit logs (Admin only)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'userId', in: 'query', schema: { type: 'string' } },
            { name: 'action', in: 'query', schema: { type: 'string' } },
            { name: 'entityType', in: 'query', schema: { type: 'string' } },
            { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Paginated audit logs' } },
        },
      },
      '/api/audit-logs/{id}': {
        get: {
          tags: ['Audit Logs'],
          summary: 'Get audit log by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Audit log details' } },
        },
      },

      // ============================================================
      // Settings
      // ============================================================
      '/api/settings/profile': {
        get: {
          tags: ['Settings'],
          summary: 'Get current user profile',
          responses: { 200: { description: 'User profile' } },
        },
        put: {
          tags: ['Settings'],
          summary: 'Update current user profile',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phoneNumber: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Profile updated' } },
        },
      },
      '/api/settings/password': {
        put: {
          tags: ['Settings'],
          summary: 'Change current user password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Password changed' } },
        },
      },

      // ============================================================
      // Notes
      // ============================================================
      '/api/notes': {
        get: {
          tags: ['Notes'],
          summary: 'List advisory notes (Advisor/Admin)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'subscriberId', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Paginated advisory notes' } },
        },
        post: {
          tags: ['Notes'],
          summary: 'Create an advisory note (Advisor)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['advisorId', 'subscriberId', 'title', 'content'],
                  properties: {
                    advisorId: { type: 'string', format: 'uuid' },
                    subscriberId: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Note created' } },
        },
      },
      '/api/notes/{id}': {
        get: {
          tags: ['Notes'],
          summary: 'Get advisory note by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Note details' } },
        },
        put: {
          tags: ['Notes'],
          summary: 'Update advisory note (Advisor)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Note updated' } },
        },
        delete: {
          tags: ['Notes'],
          summary: 'Delete advisory note (Advisor/Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Note deleted' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
