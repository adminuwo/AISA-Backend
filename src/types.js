// Message Type (JSDoc for IntelliSense)
export const MessageRole = {
  USER: "user",
  MODEL: "model",
};

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {"user" | "model"} role
 * @property {string} content
 * @property {number} timestamp
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} id
 * @property {string} title
 * @property {Message[]} messages
 * @property {string=} agentId
 * @property {number} lastModified
 */

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} avatar
 * @property {"productivity" | "creative" | "coding" | "lifestyle"} category
 * @property {boolean} installed
 * @property {string} instructions
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} avatar
 */

// AppRoute Enum
export const AppRoute = {
  LANDING: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  E_Verification: "/verification",
  DASHBOARD: "/dashboard",
  SETTINGS: "/dashboard/settings",
  PROFILE: "/dashboard/profile",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
  PRIVACY_POLICY: "/privacy-policy",
  TERMS_OF_SERVICE: "/terms-of-service",
  COOKIE_POLICY: "/cookie-policy",
};

// API Base URL
const API = 'http://127.0.0.1:8080/api';

const apis = {
  resetPassword: `${API}/auth/reset-password`,
  user: `${API}/user`,
  profile: `${API}/user/profile`,
  getPayments: `${API}/user/payments`,
  notifications: `${API}/notifications`,
  agents: `${API}/agents`,
  buyAgent: `${API}/agents/buy`,
  getUserAgents: `${API}/agents/get_my_agents`,
  getMyAgents: `${API}/agents/me`,
  chatAgent: `${API}/chat`,
  support: `${API}/support`,
  resetPasswordEmail: `${API}/auth/reset-password-email`,
  feedback: `${API}/feedback`,
  synthesizeVoice: `${API}/voice/synthesize`,
  payment: `${API}/payment`,
  createOrder: `${API}/payment/create-order`,
  verifyPayment: `${API}/payment/verify-payment`,
  getPaymentHistory: `${API}/payment/history`,
  logIn: `${API}/auth/login`,
  signUp: `${API}/auth/signup`,
  forgotPassword: `${API}/auth/forgot-password`,
  emailVerificationApi: `${API}/auth/verify-email`,
  resendCode: `${API}/auth/resend-code`,
};

export { API, apis };
