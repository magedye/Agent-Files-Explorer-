import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { handleApiRequest } from "../server/api.js";
import { registry, resolveSafePath, SecurityError, AGHR_ROOT, AGHR_1_2_0_ROOT } from "../server/security.js";

function makeMockRequest({ url, method = "GET", headers = {} }) {
  const req = {
    url,
    method,
    headers: { host: "localhost:5180", ...headers },
  };

  let statusCode = 200;
  let responseHeaders = {};
  let bodyChunks = [];
  let finished = false;

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code) {
      statusCode = code;
    },
    setHeader(key, value) {
      responseHeaders[key.toLowerCase()] = value;
    },
    getHeader(key) {
      return responseHeaders[key.toLowerCase()];
    },
    end(data) {
      if (data) bodyChunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      finished = true;
    },
  };

  return {
    req,
    res,
    getJSON() {
      const raw = Buffer.concat(bodyChunks).toString("utf8");
      return JSON.parse(raw);
    },
    getStatusCode() {
      return statusCode;
    },
    getHeaders() {
      return responseHeaders;
    },
  };
}

test("M1 Security: Approved Roots Listing", () => {
  const roots = registry.listRoots();
  assert.ok(roots.length >= 3, "Expected at least 3 approved roots");
  const rootIds = roots.map((r) => r.id);
  assert.ok(rootIds.includes("aghr"), "Authoritative AGHR root must be registered");
  assert.ok(rootIds.includes("aghr_1_1_0"), "Full 1.1.0 reference must be registered");
  assert.ok(rootIds.includes("aghr_minimal_1_1_0"), "Minimal 1.1.0 reference must be registered");
  assert.ok(rootIds.includes("aghr_1_2_0"), "Updated 1.2.0 reference must be registered");
  assert.equal(roots.find((root) => root.id === "aghr_1_2_0").readOnly, true);
  assert.deepEqual(roots.filter((root) => root.isDefault).map((root) => root.id), ["aghr_1_2_0"]);
  assert.equal(AGHR_ROOT, AGHR_1_2_0_ROOT, "Evaluation must use the current default reference");
  assert.ok(!rootIds.some((id) => id.startsWith("data-")), "Removed data projects must not remain registered");
});

test("M1 Security: Reject Path Traversal via rootId + rel", () => {
  assert.throws(
    () => resolveSafePath({ rootId: "aghr", relPath: "../../../package.json" }),
    (err) => err instanceof SecurityError && err.status === 403
  );

  assert.throws(
    () => resolveSafePath({ rootId: "aghr", relPath: "..\\..\\package.json" }),
    (err) => err instanceof SecurityError && err.status === 403
  );
});

test("M1 Security: Reject Null Byte Injection", () => {
  assert.throws(
    () => resolveSafePath({ rootId: "aghr", relPath: "README.md\0.txt" }),
    (err) => err instanceof SecurityError && err.status === 400
  );
});

test("M1 Security: Reject Absolute Path in relPath", () => {
  assert.throws(
    () => resolveSafePath({ rootId: "aghr", relPath: "C:/Windows/win.ini" }),
    (err) => err instanceof SecurityError && err.status === 400
  );
});

test("M1 Security: Reject Arbitrary Client Path outside Approved Roots", () => {
  assert.throws(
    () => resolveSafePath({ clientPath: "C:/Windows/System32" }),
    (err) => err instanceof SecurityError && err.status === 403
  );
});

test("M1 Security: Reject Protected Files (.git, .env)", () => {
  assert.throws(
    () => resolveSafePath({ rootId: "aghr", relPath: ".git/config" }),
    (err) => err instanceof SecurityError && err.status === 403
  );
  assert.throws(
    () => resolveSafePath({ rootId: "aghr", relPath: ".env" }),
    (err) => err instanceof SecurityError && err.status === 403
  );
});

test("M1 API Endpoint: GET /api/roots returns approved roots safely", () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/roots" });
  handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.roots));
  assert.ok(data.roots.some((r) => r.id === "aghr"));
});

test("M1 API Endpoint: GET /api/tree with traversal attempt returns 403", () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/tree?dir=" + encodeURIComponent("C:/Windows"),
  });
  handleApiRequest(req, res);
  assert.equal(getStatusCode(), 403);
  const data = getJSON();
  assert.ok(data.error);
  assert.ok(!data.error.includes("C:\\Windows"), "Error must not leak system path");
});

test("M1 API Endpoint: GET /api/file within approved root succeeds", () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/file?rootId=aghr&rel=PACKAGE_STATUS.json",
  });
  handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.name, "PACKAGE_STATUS.json");
  assert.equal(data.kind, "text");
  assert.ok(data.content.includes("Agent Governance and Harness Reference"));
});

test("M1 API Endpoint: GET /api/file requesting protected file returns 403", () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/file?rootId=aghr&rel=.env",
  });
  handleApiRequest(req, res);
  assert.equal(getStatusCode(), 403);
  const data = getJSON();
  assert.ok(data.error);
});
