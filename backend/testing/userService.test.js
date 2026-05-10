const userService = require("../services/userService");
const userStore = require("../store/userStore");

describe("userService", () => {
  beforeEach(() => {
    userStore.clear();
  });

  test("createUser stores a new user and returns public info", () => {
    const result = userService.createUser({
      username: "TestUser",
      email: "test@example.com",
      password: "Secret123!",
    });

    expect(result).toMatchObject({
      username: "TestUser",
      email: "test@example.com",
    });
    expect(result.id).toBeDefined();
    expect(userStore.getByUsername("TestUser")).toBeDefined();
    expect(userStore.getByEmail("test@example.com")).toBeDefined();
  });

  test("createUser rejects missing required fields", () => {
    expect(() => userService.createUser({ email: "test@example.com", password: "123" }))
      .toThrow("Username is required.");

    expect(() => userService.createUser({ username: "TestUser", password: "123" }))
      .toThrow("Email is required.");

    expect(() => userService.createUser({ username: "TestUser", email: "not-an-email", password: "123" }))
      .toThrow("Email must be valid.");

    expect(() => userService.createUser({ username: "TestUser", email: "test@example.com" }))
      .toThrow("Password is required.");
  });

  test("createUser rejects duplicate username or email", () => {
    userService.createUser({
      username: "TestUser",
      email: "test@example.com",
      password: "Secret123!",
    });

    expect(() => userService.createUser({
      username: "TestUser",
      email: "other@example.com",
      password: "Secret123!",
    })).toThrow("Username is already taken.");

    expect(() => userService.createUser({
      username: "OtherUser",
      email: "test@example.com",
      password: "Secret123!",
    })).toThrow("Email is already registered.");
  });
});
