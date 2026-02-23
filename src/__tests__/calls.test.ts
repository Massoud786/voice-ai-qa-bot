import request from "supertest";
import fs from "fs";
import path from "path";
import app from "../server.js";

describe("GET /calls", () => {
    const outputsDir = path.join(process.cwd(), "outputs");

    beforeAll(async () => {
        // Ensure a clean outputs folder for the test
        await fs.promises.rm(outputsDir, { recursive: true, force: true});
        await fs.promises.mkdir(outputsDir, { recursive: true});
    });
    
    afterAll(async () => {
        await fs.promises.rm(outputsDir, { recursive: true, force: true});
    });

    it("returns calls array", async () => {
        const res = await request(app).get("/calls");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("calls");
        expect(Array.isArray(res.body.calls)).toBe(true);
    });
});