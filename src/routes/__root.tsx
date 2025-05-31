import { createRoute, redirect } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "../pages/App";
import Profile from "../pages/Profile/Profile";
import useToken from "../lib/useToken";
import { logger } from "../utils/logger";

const queryClient = new QueryClient();

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
      await useToken();
      logger.info("User is authenticated, redirecting to profile");
      throw redirect({
        to: "/profile"
      });
    } catch (error) {
      logger.info("User is not authenticated, staying on login page");
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
      await useToken();
      logger.info("User is authenticated, allowing access to profile");
      return {};
    } catch (error) {
      logger.error("User is not authenticated, redirecting to login");
      throw redirect({
        to: "/"
      });
    }
  },
  component: Profile,
});

const routeTree = rootRoute.addChildren([indexRoute, ProfileRoute]);

export default routeTree;