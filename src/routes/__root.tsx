import { createRoute, redirect } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "../pages/App";
import Profile from "../pages/Profile/Profile";
import useToken from "../lib/useToken";
import { logger } from "../utils/logger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    try {
      const userData = await useToken();
      logger.info("User is authenticated, redirecting to profile");
      return redirect({
        to: "/profile",
        search: {
          user: userData.name,
        },
      });
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        logger.info("User is not authenticated, staying on login page");
        return {};
      }
      if (error instanceof Error && error.name === "RedirectError") {
        throw error;
      }
      logger.error("[Routes]",`Unexpected error during authentication check: ${error}`);
      return {};
    }
  },
  component: App,
});

const ProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  beforeLoad: async () => {
    try {
      const userData = await useToken();
      logger.info("User is authenticated, allowing access to profile");
      return {
        userData,
      };
    } catch (error) {
      logger.error("User is not authenticated, redirecting to login");
      return redirect({
        to: "/",
      });
    }
  },
  component: Profile,
});

const routeTree = rootRoute.addChildren([indexRoute, ProfileRoute]);

export default routeTree;