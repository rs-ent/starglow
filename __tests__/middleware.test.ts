import { NextRequest } from "next/server";
import { middleware } from "../middleware";

// NextResponse를 모킹
jest.mock("next/server", () => ({
    NextResponse: {
        next: jest.fn(() => ({ headers: { set: jest.fn() } })),
        redirect: jest.fn((url) => ({ url })),
    },
}));

describe("middleware", () => {
    it("should redirect docs.starglow.io to starglow.io/docs", async () => {
        const request = {
            headers: { get: jest.fn(() => "docs.starglow.io") },
            nextUrl: { hostname: "docs.starglow.io", pathname: "/" },
            url: "https://docs.starglow.io/",
        } as unknown as NextRequest;

        await middleware(request);

        // NextResponse.redirect가 호출되었는지 확인
        const { NextResponse } = require("next/server");
        expect(NextResponse.redirect).toHaveBeenCalledWith(
            "https://starglow.io/docs",
            301
        );
    });

    it("should redirect /user to /user/mystar", async () => {
        const request = {
            headers: { get: jest.fn(() => "starglow.io") },
            nextUrl: { hostname: "starglow.io", pathname: "/user" },
            url: "https://starglow.io/user",
        } as unknown as NextRequest;

        await middleware(request);

        const { NextResponse } = require("next/server");
        expect(NextResponse.redirect).toHaveBeenCalled();
    });
});
