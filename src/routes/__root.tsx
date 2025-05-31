import { createRoute, redirect } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";

import App from "../pages/App";
import Profile from "../pages/Profile/Profile";
import Loading from "../pages/Profile/Loading";
import useToken from "../lib/useToken";
import { logger } from "../utils/logger";
import SessionStore from "../lib/sessionStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

export const sessionStore = new SessionStore(queryClient);

export const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    try {
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Active session found, redirecting to profile");
        return redirect({
          to: "/profile",
          search: {
            user: sessionData.name,
          },
        });
      }

      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "User authenticated, creating session and redirecting to profile");
      return redirect({
        to: "/profile",
        search: {
          user: userData.name,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        logger.info("Route", "No active session, staying on login page");
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
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Using existing session data for profile");
        return { userData: sessionData };
      }

      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "Creating new session for profile");
      return {
        userData,
      };
    } catch (error) {
      logger.error("Route", "No valid session found, redirecting to login");
      sessionStore.clearSession();
      return redirect({
        to: "/",
      });
    }
  },
  component: Profile,
});

const routeTree = rootRoute.addChildren([indexRoute, ProfileRoute]);

export default routeTree;