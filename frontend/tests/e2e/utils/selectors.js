/**
 * Centralized data-testid selectors for E2E tests.
 * Single source of truth — prevents duplicated/fragile selectors across specs.
 */

export const AUTH = {
  // Login
  LOGIN_FORM: '[data-testid="login-form"]',
  LOGIN_EMAIL: '[data-testid="login-email-input"]',
  LOGIN_PASSWORD: '[data-testid="login-password-input"]',
  LOGIN_SUBMIT: '[data-testid="login-submit-btn"]',
  LOGIN_ERROR: '[data-testid="login-error-msg"]',
  GOOGLE_LOGIN: '[data-testid="google-login-btn"]',

  // Signup
  SIGNUP_FORM: '[data-testid="signup-form"]',
  SIGNUP_NAME: '[data-testid="signup-name-input"]',
  SIGNUP_EMAIL: '[data-testid="signup-email-input"]',
  SIGNUP_PASSWORD: '[data-testid="signup-password-input"]',
  SIGNUP_SUBMIT: '[data-testid="signup-submit-btn"]',
  SIGNUP_ERROR: '[data-testid="signup-error-msg"]',
  GOOGLE_SIGNUP: '[data-testid="google-signup-btn"]',

  // Role Selection
  ROLE_CARD_CLIENT: '[data-testid="role-card-client"]',
  ROLE_CARD_KONSULTAN: '[data-testid="role-card-konsultan"]',
  ROLE_CONTINUE: '[data-testid="role-continue-btn"]',
};

export const EXPLORE = {
  SEARCH_INPUT: '[data-testid="explore-search-input"]',
  CONSULTANT_CARD: '[data-testid="consultant-card"]',
  EMPTY_STATE: '[data-testid="explore-empty-state"]',
};

export const CONSULTATION = {
  DETAIL_HERO: '[data-testid="consultant-detail-hero"]',
  PRICE_CARD: '[data-testid="consultant-price-card"]',
  SCHEDULE_PICKER: '[data-testid="schedule-picker"]',
  CONSULTATION_FORM: '[data-testid="consultation-form"]',
  BOOKING_SUBMIT: '[data-testid="booking-submit-btn"]',
  SUCCESS_VIEW: '[data-testid="booking-success-view"]',
};

export const PROFILE = {
  AVATAR_UPLOAD: '[data-testid="profile-avatar-upload"]',
  FORM: '[data-testid="profile-form"]',
  SAVE_BTN: '[data-testid="profile-save-btn"]',
};

export const SCHEDULE = {
  AVAILABILITY_TOGGLE: '[data-testid="availability-toggle-section"]',
  MONTHLY_CALENDAR: '[data-testid="monthly-calendar"]',
  ADD_SLOT_MODAL: '[data-testid="add-slot-modal"]',
  SAVE_BTN: '[data-testid="schedule-save-btn"]',
};

export const PAYMENT = {
  PAGE: '[data-testid="payment-page"]',
  PAY_BTN: '[data-testid="payment-pay-btn"]',
};

export const AI_CHAT = {
  PAGE: '[data-testid="ai-chat-page"]',
  MESSAGES: '[data-testid="ai-chat-messages"]',
  INPUT: '[data-testid="ai-chat-input"]',
  AI_MESSAGE: '[data-testid="ai-message"]',
  USER_MESSAGE: '[data-testid="user-message"]',
};

export const ADMIN = {
  DASHBOARD: '[data-testid="admin-dashboard"]',
};
