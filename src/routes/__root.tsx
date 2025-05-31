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
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      suspense: true,
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
      const cachedData = queryClient.getQueryData(["token"]);
      if (cachedData) {
        logger.info("Route", "Using cached user data, redirecting to profile");
        return redirect({
          to: "/profile",
          search: {
            user: cachedData.name,
          },
        });
      }

      const userData = await useToken();
      queryClient.setQueryData(["token"], userData);
      logger.info("Route", "User is authenticated, redirecting to profile");
      return redirect({
        to: "/profile",
        search: {
          user: userData.name,
        },
      });
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        logger.info("Route", "User is not authenticated, staying on login page");
        return {};
      }
      if (error instanceof Error && error.name === "RedirectError") {
        throw error;
      }
      logger.error("Route", `Unexpected error during authentication check: ${error}`);
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
      const cachedData = queryClient.getQueryData(["token"]);
      if (cachedData) {
        logger.info("Route", "Using cached user data for profile");
        return { userData: cachedData };
      }

      const userData = await useToken();
      queryClient.setQueryData(["token"], userData);
      logger.info("Route", "User is authenticated, allowing access to profile");
      return {
        userData,
      };
    } catch (error) {
      logger.error("Route", "User is not authenticated, redirecting to login");
      return redirect({
        to: "/",
      });
    }
  },
  component: Profile,
});

const routeTree = rootRoute.addChildren([indexRoute, ProfileRoute]);

export default routeTree;