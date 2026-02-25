export const byPassRoutes = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/convex/(.*)",
  "/api/inngest/(.*)",
  "/api/polar/webhook",
];

export const clientAuthRoutes = ["/auth/signin", "/auth/signup"];

export const protectedRoutes = ["/client/(.*)"];
