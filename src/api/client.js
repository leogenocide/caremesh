/**
 * CareMesh Unified API Client
 * Connects React frontend to Express/SQLite backend
 */

const API_BASE = '/api';

const buildQuery = (params = {}) => {
  if (typeof params === 'string') return params ? `?${params}` : '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, v);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('caremesh_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('caremesh_token', token);
    } else {
      localStorage.removeItem('caremesh_token');
    }
  }

  getToken() {
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || errorData.error || `HTTP error ${response.status}: ${response.statusText}`);
        err.status = response.status;
        err.error = errorData.error;
        err.reason = errorData.reason;
        err.retryAfterSeconds = errorData.retryAfterSeconds;
        err.resetAt = errorData.resetAt;
        throw err;
      }

      return await response.json();
    } catch (err) {
      console.warn(`[ApiClient] Request to ${url} failed:`, err.message);
      throw err;
    }
  }

  // Bootstrap
  async bootstrap() {
    return this.request('/bootstrap');
  }

  // Auth
  auth = {
    login: async (credentials) => {
      const res = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      if (res.token) this.setToken(res.token);
      return res;
    },
    register: async (userData) => {
      const res = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      if (res.token) this.setToken(res.token);
      return res;
    },
    me: async () => this.request('/auth/me'),
    switchUser: async () => {
      throw new Error('Account switching is disabled in production. Please sign in with your account credentials.');
    },
    googleLogin: async (googleData) => {
      const res = await this.request('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleData)
      });
      if (res.token) this.setToken(res.token);
      return res;
    },
    changePassword: async (passwords) => {
      return this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwords)
      });
    },
    forgotPassword: async (email) => {
      return this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    resetPassword: async (resetData) => {
      const res = await this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetData)
      });
      if (res.token) this.setToken(res.token);
      return res;
    },
    resetPasswordWithGoogle: async (googleResetData) => {
      const res = await this.request('/auth/reset-password-with-google', {
        method: 'POST',
        body: JSON.stringify(googleResetData)
      });
      if (res.token) this.setToken(res.token);
      return res;
    }
  };

  // Users
  users = {
    getAll: async () => this.request('/users'),
    getById: async (id) => this.request(`/users/${id}`),
    update: async (id, data) => this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    togglePublicModerator: async (id, data = {}) => this.request(`/admin/users/${id}/toggle-public-moderator`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    restrict: async (id, data = {}) => this.request(`/users/${id}/restrict`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    unrestrict: async (id, data = {}) => this.request(`/users/${id}/unrestrict`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/users/${id}`, {
      method: 'DELETE'
    })
  };

  // Observations
  observations = {
    getAll: async (params = {}) => this.request(`/observations${buildQuery(params)}`),
    getById: async (id) => this.request(`/observations/${id}`),
    create: async (data) => this.request('/observations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => this.request(`/observations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/observations/${id}`, {
      method: 'DELETE'
    }),
    addRelation: async (id, targetObservationId, relationType) => this.request(`/observations/${id}/relations`, {
      method: 'POST',
      body: JSON.stringify({ targetObservationId, relationType })
    })
  };

  // Claims
  claims = {
    getAll: async () => this.request('/claims'),
    getById: async (id) => this.request(`/claims/${id}`),
    create: async (data) => this.request('/claims', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateStatus: async (id, status, assessmentNotes) => this.request(`/claims/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, assessmentNotes })
    })
  };

  // Evidence
  evidence = {
    getAll: async () => this.request('/evidence'),
    getById: async (id) => this.request(`/evidence/${id}`),
    create: async (data) => this.request('/evidence', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/evidence/${id}`, {
      method: 'DELETE'
    })
  };

  // Disputes
  disputes = {
    getAll: async () => this.request('/disputes'),
    create: async (data) => this.request('/disputes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateStatus: async (id, status) => this.request(`/disputes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    addResponse: async (id, data) => this.request(`/disputes/${id}/responses`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/disputes/${id}`, {
      method: 'DELETE'
    }),
    deleteResponse: async (id, responseId) => this.request(`/disputes/${id}/responses/${responseId}`, {
      method: 'DELETE'
    })
  };

  // Safety Reports
  safety = {
    getAll: async (params = {}) => this.request(`/safety${buildQuery(params)}`),
    create: async (data) => this.request('/safety', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    addUpdate: async (id, note) => this.request(`/safety/${id}/updates`, {
      method: 'POST',
      body: JSON.stringify({ note })
    }),
    delete: async (id) => this.request(`/safety/${id}`, {
      method: 'DELETE'
    })
  };

  // Long-Term Plans
  plans = {
    getAll: async () => this.request('/plans'),
    getById: async (id) => this.request(`/plans/${id}`),
    create: async (data) => this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateStage: async (id, lifecycleStage, overallStatus) => this.request(`/plans/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ lifecycleStage, overallStatus })
    }),
    addFeedback: async (id, feedbackData) => this.request(`/plans/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    }),
    createRevision: async (id, revisionData) => this.request(`/plans/${id}/revisions`, {
      method: 'POST',
      body: JSON.stringify(revisionData)
    }),
    toggleMilestone: async (id, milestoneId) => this.request(`/plans/${id}/milestones/${milestoneId}/toggle`, {
      method: 'POST'
    }),
    logDecision: async (id, decisionData) => this.request(`/plans/${id}/decisions`, {
      method: 'POST',
      body: JSON.stringify(decisionData)
    }),
    logOutcome: async (id, outcomeData) => this.request(`/plans/${id}/outcome`, {
      method: 'POST',
      body: JSON.stringify(outcomeData)
    }),
    delete: async (id) => this.request(`/plans/${id}`, {
      method: 'DELETE'
    }),
    deleteDecision: async (id, decisionId) => this.request(`/plans/${id}/decisions/${decisionId}`, {
      method: 'DELETE'
    }),
    deleteMilestone: async (id, milestoneId) => this.request(`/plans/${id}/milestones/${milestoneId}`, {
      method: 'DELETE'
    })
  };

  // Projects / Events
  projects = {
    getAll: async (params = {}) => this.request(`/projects${buildQuery(params)}`),
    getById: async (id) => this.request(`/projects/${id}`),
    create: async (data) => this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    join: async (id, userId) => this.request(`/projects/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),
    sendMessage: async (id, text, senderId) => this.request(`/projects/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, senderId })
    }),
    update: async (id, data) => this.request(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/projects/${id}`, {
      method: 'DELETE'
    })
  };

  // Help Requests
  requests = {
    getAll: async (params = {}) => this.request(`/requests${buildQuery(params)}`),
    getById: async (id) => this.request(`/requests/${id}`),
    create: async (data) => this.request('/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => this.request(`/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/requests/${id}`, {
      method: 'DELETE'
    }),
    respond: async (id, role, userId) => this.request(`/requests/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ role, userId })
    })
  };

  // Resources
  resources = {
    getAll: async (params = {}) => this.request(`/resources${buildQuery(params)}`),
    getById: async (id) => this.request(`/resources/${id}`),
    create: async (data) => this.request('/resources', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => this.request(`/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/resources/${id}`, {
      method: 'DELETE'
    }),
    requestUse: async (id, data) => this.request(`/resources/${id}/request-use`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getLoans: async (id) => this.request(`/resources/${id}/loans`),
    updateLoanStatus: async (assignmentId, status, details = {}) => this.request(`/resources/assignments/${assignmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...details })
    })
  };

  // Transparent Matcher & Assignments
  matcher = {
    getEvaluations: async () => this.request('/matcher/evaluations'),
    evaluatePair: async (requestId, resourceId) => this.request(`/matcher/evaluate/${requestId}/${resourceId}`),
    getAssignments: async () => this.request('/matcher/assignments'),
    createAssignment: async (data) => this.request('/matcher/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    endorseMatch: async (matchId) => this.request('/matcher/endorse', {
      method: 'POST',
      body: JSON.stringify({ matchId })
    })
  };

  // Institutional Learning
  learning = {
    search: async (q = '', category = '') => this.request(`/learning/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
    getLessons: async () => this.request('/learning/lessons'),
    getGuidance: async () => this.request('/learning/guidance')
  };

  // Communities & Posts
  communities = {
    getAll: async () => this.request('/communities'),
    getById: async (id) => this.request(`/communities/${id}`),
    create: async (data) => this.request('/communities', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: async (id, data) => this.request(`/communities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: async (id) => this.request(`/communities/${id}`, {
      method: 'DELETE'
    }),
    addMedia: async (id, mediaData) => this.request(`/communities/${id}/media`, {
      method: 'POST',
      body: JSON.stringify(mediaData)
    }),
    join: async (id, userId) => this.request(`/communities/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),
    getPosts: async (communityIdOrParams) => {
      const params = typeof communityIdOrParams === 'string'
        ? { communityId: communityIdOrParams }
        : (communityIdOrParams || {});
      return this.request(`/communities/feed/posts${buildQuery(params)}`);
    },
    createPost: async (postData) => this.request('/communities/feed/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    }),
    editPost: async (id, data) => this.request(`/communities/feed/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    deletePost: async (id) => this.request(`/communities/feed/posts/${id}`, {
      method: 'DELETE'
    }),
    endorsePost: async (id, userId) => this.request(`/communities/feed/posts/${id}/endorse`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),
    addComment: async (id, text, authorId) => this.request(`/communities/feed/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text, authorId })
    }),
    editComment: async (postId, commentId, text) => this.request(`/communities/feed/posts/${postId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text })
    }),
    deleteComment: async (postId, commentId) => this.request(`/communities/feed/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE'
    }),
    votePoll: async (id, optionId, userId) => this.request(`/communities/feed/posts/${id}/poll/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId, userId })
    }),
    kickMember: async (communityId, userId) => this.request(`/communities/${communityId}/members/${userId}`, {
      method: 'DELETE'
    }),
    restrictPostUser: async (postId, targetUserId) => this.request(`/communities/feed/posts/${postId}/kick-user`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    }),
    getElections: async (communityId) => this.request(`/communities/${communityId}/elections`),
    nominateModerator: async (communityId, candidateId) => this.request(`/communities/${communityId}/elections/nominate`, {
      method: 'POST',
      body: JSON.stringify({ candidateId })
    }),
    voteModerator: async (communityId, electionId, vote = 'for') => this.request(`/communities/${communityId}/elections/${electionId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote })
    }),
    appointModerator: async (communityId, electionId) => this.request(`/communities/${communityId}/elections/${electionId}/appoint`, {
      method: 'POST'
    }),
    getModerationVault: async (communityId, params = {}) => this.request(`/communities/${communityId}/moderation/vault${buildQuery(params)}`),
    getModerationAuditLogs: async (communityId, params = {}) => this.request(`/communities/${communityId}/moderation/audit-logs${buildQuery(params)}`)
  };

  // Moderation Reports (Posts, Profile Pictures, Public Records)
  reports = {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports${query ? `?${query}` : ''}`);
    },
    create: async (data) => this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    resolve: async (id, action, notes = '') => this.request(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, notes })
    })
  };

  // Member Readiness & Availability Checker
  readiness = {
    getAll: async (params = {}) => {
      if (typeof params === 'string') return this.request(`/readiness?communityId=${params}`);
      return this.request(`/readiness${buildQuery(params)}`);
    },
    getById: async (id) => this.request(`/readiness/${id}`),
    create: async (data) => this.request('/readiness', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    respond: async (id, data) => this.request(`/readiness/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    close: async (id) => this.request(`/readiness/${id}/close`, {
      method: 'POST'
    })
  };

  // Notifications
  notifications = {
    getAll: async () => this.request('/notifications'),
    markRead: async (id) => this.request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: async () => this.request('/notifications/read-all', { method: 'POST' })
  };

  // Conversations & Direct Messages
  conversations = {
    getAll: async () => this.request('/conversations'),
    getById: async (id) => this.request(`/conversations/${id}`),
    sendMessage: async (id, text, senderId) => this.request(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, senderId })
    })
  };

  // System Administrator Governance
  admin = {
    getStats: async () => this.request('/admin/stats'),
    getUsers: async (params = {}) => this.request(`/admin/users${buildQuery(params)}`),
    getUserReports: async (userId) => this.request(`/admin/users/${userId}/reports`),
    togglePublicModerator: async (userId, data = {}) => this.request(`/admin/users/${userId}/toggle-public-moderator`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getAuditLogs: async (params = {}) => this.request(`/admin/audit-logs${buildQuery(params)}`),
    getVault: async (params = {}) => this.request(`/admin/vault${buildQuery(params)}`),
    quarantineEntity: async (data = {}) => this.request('/admin/vault/quarantine', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    restoreVaultItem: async (itemId, data = {}) => this.request(`/admin/vault/${itemId}/restore`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    restoreVaultPost: async (postId, data = {}) => this.request(`/admin/vault/${postId}/restore`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    purgeVaultItem: async (itemId, data = {}) => this.request(`/admin/vault/${itemId}/purge`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    purgeVaultPost: async (postId, data = {}) => this.request(`/admin/vault/${postId}/purge`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getAntiSpamTelemetry: async () => this.request('/admin/antispam/telemetry'),
    resetAntiSpamClient: async (clientId, reason = '') => this.request('/admin/antispam/reset-client', {
      method: 'POST',
      body: JSON.stringify({ clientId, reason })
    })
  };
}

export const api = new ApiClient();
export default api;
