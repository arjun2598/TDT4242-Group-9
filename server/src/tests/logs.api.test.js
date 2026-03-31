import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";

const app = require("../app");
const { db } = require("../db");

const validPayload = {
  assignmentTitle: "TDT4242 Exercise 3",
  dateOfUse: "2026-03-30",
  tool: "ChatGPT",
  purposeCategory: "Study/Tutoring",
  optionalExplanation: "Used to understand testing",
  promptQueryUsed: "How do I test Express routes?",
  outputReceived: "Testing advice",
  modifiedOutput: "Edited output",
};

function runDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

beforeEach(async () => {
  await runDb("DELETE FROM logs");
});

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /logs", () => {
  it("creates a log with valid payload", async () => {
    const res = await request(app).post("/logs").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.assignmentTitle).toBe(validPayload.assignmentTitle);
    expect(res.body.tool).toBe(validPayload.tool);
  });

  it("rejects invalid payload", async () => {
    const res = await request(app).post("/logs").send({ tool: "ChatGPT" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation error");
  });
});

it("creates a log when optional fields are omitted", async () => {
  const minimalPayload = {
    assignmentTitle: "Minimal Assignment",
    dateOfUse: "2026-03-30",
    tool: "ChatGPT",
    purposeCategory: "Study/Tutoring",
  };

  const res = await request(app).post("/logs").send(minimalPayload);

  expect(res.status).toBe(201);
  expect(res.body.assignmentTitle).toBe("Minimal Assignment");
  expect(res.body.optionalExplanation).toBeNull();
  expect(res.body.promptQueryUsed).toBeNull();
  expect(res.body.outputReceived).toBeNull();
  expect(res.body.modifiedOutput).toBeNull();
});

describe("GET /logs", () => {
  it("returns created logs", async () => {
    await request(app).post("/logs").send(validPayload);

    const res = await request(app).get("/logs");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].assignmentTitle).toBe(validPayload.assignmentTitle);
  });
});

describe("PUT /logs/:id", () => {
  it("updates an existing log", async () => {
    const createRes = await request(app).post("/logs").send(validPayload);
    const id = createRes.body.id;

    const updatedPayload = {
      ...validPayload,
      assignmentTitle: "Updated Assignment",
    };

    const updateRes = await request(app).put(`/logs/${id}`).send(updatedPayload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.assignmentTitle).toBe("Updated Assignment");

    const getRes = await request(app).get("/logs");
    expect(getRes.body[0].assignmentTitle).toBe("Updated Assignment");
  });

  it("returns 404 for non-existing id", async () => {
    const res = await request(app).put("/logs/99999").send(validPayload);
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app).put("/logs/not-a-number").send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid id");
  });
});

it("rejects invalid payload for update", async () => {
  const createRes = await request(app).post("/logs").send(validPayload);
  const id = createRes.body.id;

  const res = await request(app).put(`/logs/${id}`).send({ tool: "ChatGPT" });

  expect(res.status).toBe(400);
  expect(res.body.error).toBe("Validation error");
});

it("updates a log when optional fields are omitted", async () => {
  const createRes = await request(app).post("/logs").send(validPayload);
  const id = createRes.body.id;

  const minimalUpdate = {
    assignmentTitle: "Updated Minimal Assignment",
    dateOfUse: "2026-03-31",
    tool: "Claude",
    purposeCategory: "Drafting",
  };

  const res = await request(app).put(`/logs/${id}`).send(minimalUpdate);

  expect(res.status).toBe(200);
  expect(res.body.assignmentTitle).toBe("Updated Minimal Assignment");
  expect(res.body.optionalExplanation).toBeNull();
  expect(res.body.promptQueryUsed).toBeNull();
  expect(res.body.outputReceived).toBeNull();
  expect(res.body.modifiedOutput).toBeNull();
});

describe("DELETE /logs/:id", () => {
  it("deletes an existing log", async () => {
    const createRes = await request(app).post("/logs").send(validPayload);
    const id = createRes.body.id;

    const deleteRes = await request(app).delete(`/logs/${id}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get("/logs");
    expect(getRes.body.length).toBe(0);
  });

  it("returns 404 for non-existing id", async () => {
    const res = await request(app).delete("/logs/99999");
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid id", async () => {
    const res = await request(app).delete("/logs/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid id");
  });
});