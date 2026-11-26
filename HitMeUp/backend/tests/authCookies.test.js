const assert = require("node:assert/strict");
const { test } = require("node:test");
const { setAuthCookies } = require("../controllers/authController");

test("auth cookies are available to all API routes", () => {
  const cookies = [];
  const response = {
    cookie: (name, value, options) => cookies.push({ name, value, options })
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
});
