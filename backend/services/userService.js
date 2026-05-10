const crypto = require("crypto");
const users = require("../store/userStore");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class DuplicateError extends Error {
  constructor(message) {
    super(message);
    this.name = "DuplicateError";
  }
}

function normalizeValue(value) {
  return String(value || "").trim();
}

function normalizeUsername(username) {
  return normalizeValue(username);
}

function normalizeEmail(email) {
  return normalizeValue(email).toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
}

function createUser({ username, email, password }) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = normalizeValue(password);

  if (!normalizedUsername) {
    throw new ValidationError("Username is required.");
  }

  if (!normalizedEmail) {
    throw new ValidationError("Email is required.");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new ValidationError("Email must be valid.");
  }

  if (!normalizedPassword) {
    throw new ValidationError("Password is required.");
  }

  if (users.getByUsername(normalizedUsername)) {
    throw new DuplicateError("Username is already taken.");
  }

  if (users.getByEmail(normalizedEmail)) {
    throw new DuplicateError("Email is already registered.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(normalizedPassword, salt);
  const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  const createdAt = new Date().toISOString();

  const user = {
    id,
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    salt,
    createdAt,
  };

  users.add(user);

  return {
    id,
    username: normalizedUsername,
    email: normalizedEmail,
    createdAt,
  };
}

module.exports = {
  createUser,
  ValidationError,
  DuplicateError,
};
