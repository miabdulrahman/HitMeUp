const assert = require("node:assert/strict");
const { test } = require("node:test");
const { logout, setAuthCookies } = require("../controllers/authController");

test("auth cookies are available to all API routes and remove legacy scoped cookies", () => {
  const cookies = [];
  const clearedCookies = [];
  const response = {
    cookie: (name, value, options) => cookies.push({ name, value, options }),
    clearCookie: (name, options) => clearedCookies.push({ name, options })
  };

  setAuthCookies(response, "session-token");

  assert.equal(cookies.length, 2);
  assert.deepEqual(
    cookies.map(({ name, options }) => [name, options.path, options.httpOnly]),
    [
      ["hitmeup_session", "/", true],
      ["hitmeup_csrf", "/", false]
    ]
  );
  assert.deepEqual(
    clearedCookies.map(({ name, options }) => [name, options.path]),
    [
      ["hitmeup_session", "/api/auth"],
      ["hitmeup_csrf", "/api/auth"]
    ]
  );
});

test("logout clears cookies at both current and legacy paths", () => {
  const clearedCookies = [];
  const response = {
    clearCookie: (name, options) => clearedCookies.push({ name, options }),
    status: (statusCode) => ({
      send: () => statusCode
    })
  };

  logout({}, response);

  assert.deepEqual(
    clearedCookies.map(({ name, options }) => [name, options.path]),
    [
      ["hitmeup_session", "/"],
      ["hitmeup_csrf", "/"],
      ["hitmeup_session", "/api/auth"],
      ["hitmeup_csrf", "/api/auth"]
    ]
  );
});
