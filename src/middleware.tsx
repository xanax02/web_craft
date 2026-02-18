import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import {
  byPassRoutes,
  clientAuthRoutes,
  protectedRoutes,
} from "./lib/routesPermissions";

const byPassMatcher = createRouteMatcher(byPassRoutes);
const clientAuthMatcher = createRouteMatcher(clientAuthRoutes);
const protectedMatcher = createRouteMatcher(protectedRoutes);

export default convexAuthNextjsMiddleware(
  async (req, { convexAuth }) => {
    if (byPassMatcher(req)) return;

    const isAuthenticated = await convexAuth.isAuthenticated();

    if (clientAuthMatcher(req) && isAuthenticated) {
      return nextjsMiddlewareRedirect(req, "/client");
    }

    if (protectedMatcher(req) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(req, "/auth/signin");
    }

    return;
  },
  {
    cookieConfig: { maxAge: 60 * 60 * 24 * 30 },
  },
);

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
