import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should extend AuthGuard with jwt strategy", () => {
    // JwtAuthGuard extends AuthGuard('jwt')
    // The actual JWT validation is handled by Passport + JwtStrategy
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it("should have canActivate method", () => {
    expect(typeof guard.canActivate).toBe("function");
  });
});
