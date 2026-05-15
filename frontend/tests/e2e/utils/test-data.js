/**
 * Centralized test data for E2E tests.
 * Uses env vars for real credentials, generates random data for sign-up flows.
 */

/** Generate a unique email to prevent collision in signup tests */
export function generateUniqueEmail(prefix = 'e2e-test') {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${ts}-${rand}@test.langkahlegal.id`;
}

/** Valid test accounts (from .env.e2e) */
export const ACCOUNTS = {
  client: {
    email: process.env.E2E_CLIENT_EMAIL || 'client@test.com',
    password: process.env.E2E_CLIENT_PASSWORD || 'testpass123',
  },
  consultant: {
    email: process.env.E2E_CONSULTANT_EMAIL || 'consultant@test.com',
    password: process.env.E2E_CONSULTANT_PASSWORD || 'testpass123',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'testpass123',
  },
};

/** Invalid credentials for negative tests */
export const INVALID = {
  wrongPassword: {
    email: ACCOUNTS.client.email,
    password: 'wrong-password-xyz-123',
  },
  nonExistentEmail: {
    email: 'nonexistent-user-abc@nowhere.com',
    password: 'password123',
  },
  emptyEmail: { email: '', password: 'password123' },
  emptyPassword: { email: ACCOUNTS.client.email, password: '' },
};

/** Edge-case strings */
export const EDGE_CASES = {
  longString: 'A'.repeat(500),
  specialChars: '!@#$%^&*()_+-=[]{}|;:",.<>?/`~',
  xssAttempt: '<script>alert("xss")</script>',
  sqlInjection: "'; DROP TABLE users; --",
  unicodeEmoji: '测试 テスト 🚀🔥💻',
};

/** Sample consultation form data */
export const CONSULTATION_FORM = {
  validDescription: 'Saya memerlukan konsultasi terkait masalah hukum perdata tentang sengketa tanah warisan keluarga.',
  shortDescription: 'Help',
};

/** Dashboard URLs by role */
export const DASHBOARD_URLS = {
  client: '/dashboard/client',
  consultant: '/dashboard/consultant',
  admin: '/dashboard/admin',
};
