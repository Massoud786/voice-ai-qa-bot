import request from "supertest";
import app from "../server.js";

describe("GET /health", () => {
    it("returns ok:true", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual(
            expect.objectContaining({
                ok: true,
                service: expect.any(String),
            })
        );
    });
});