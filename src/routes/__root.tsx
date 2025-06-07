import { createRoute, redirect, notFound } from "@tanstack/react-router";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";

import App from "../pages/App";
import Wizard from "../pages/Wizard/Wizard";
import InstallOrg from "../pages/InstallOrg/InstallOrg";
import PageLoader from "../components/Loading/PageLoader";
import ErrorBoundary from "../components/Error/ErrorBoundary";
import SessionMonitor from "../components/Session/SessionMonitor";
import useToken from "../lib/useToken";
import { logger } from "../utils/logger";
import SessionStore from "../lib/sessionStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Log errors silently
        logger.error("QueryClient", `Query failed (attempt ${failureCount + 1}):`, error?.message);
        
        // Don't retry on 401 errors
        if (error?.response?.status === 401) {
          return false;
        }
        
        // Reduced retries - max 2 attempts
        return failureCount < 2;
      },
      retryDelay: () => 2000, // 2 second delay
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Disabled to reduce calls
      refetchOnReconnect: true,
      refetchOnMount: false, // Disabled - rely on session store
      refetchInterval: false, // Disabled
      // Silent error handling - never throw errors to UI
      throwOnError: false,
    },
    mutations: {
      // Silent error handling for mutations too
      throwOnError: false,
      retry: (failureCount, error: any) => {
        // Don't retry mutations on 401 errors
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2; // Reduced to 2 retries for mutations
      },
      retryDelay: () => 2000, // 2 second delay for mutation retries
    },
  },
});

export const sessionStore = new SessionStore(queryClient);

export const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<PageLoader message="Loading..." />}>
          <Outlet />
          <SessionMonitor />
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  ),
  notFoundComponent: () => {
    // Redirect any unknown routes to login page
    logger.warn("Route", "Unknown route accessed, redirecting to login");
    window.location.href = '/';
    return <PageLoader message="Redirecting..." />;
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    try {
      logger.info("Route", "Checking authentication status for index route");
      
      // First check session store - no API call needed
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Active session found, checking organization status");
        
        // Check if we have cached org data
        const cachedOrgData = sessionStore.read('orgData');
        if (cachedOrgData) {
          if (cachedOrgData.total > 0) {
            logger.info("Route", "Cached org data found, redirecting to wizard");
            return redirect({ to: "/wizard", search: { user: sessionData.name } });
          } else {
            logger.info("Route", "No cached org data, redirecting to install org");
            return redirect({ to: "/installOrg", search: { user: sessionData.name } });
          }
        } else {
          // No cached org data, redirect to install org to fetch it
          logger.info("Route", "No cached org data, redirecting to install org");
          return redirect({ to: "/installOrg", search: { user: sessionData.name } });
        }
      }

      // Only make API call if no valid session exists
      logger.info("Route", "No active session, attempting server authentication");
      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "User authenticated, redirecting to install org to check organization");
      
      return redirect({
        to: "/installOrg",
        search: {
          user: userData.name,
        },
      });
    } catch (error) {
      // Handle all errors silently - log but don't show to user
      if (error instanceof Error && error.message.includes("401")) {
        logger.info("Route", "No active session, staying on login page");
      } else if (error instanceof Error && error.name === "RedirectError") {
        throw error; // Allow redirects to work
      } else {
        logger.error("Route", `Authentication check failed: ${error}`);
        // Clear any corrupted session data
        sessionStore.clearSession();
      }
      return {}; // Always return successfully to show login page
    }
  },
  component: App,
});

const InstallOrgRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/installOrg",
  beforeLoad: async () => {
    try {
      logger.info("Route", "Checking authentication status for install org route");
      
      // First check session store - no API call needed
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Using existing session data for install org");
        return { userData: sessionData };
      }

      // Only make API call if no valid session exists
      logger.info("Route", "No active session, attempting server authentication");
      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "Creating new session for install org");
      return {
        userData,
      };
    } catch (error) {
      // Handle errors silently - redirect to login without showing error
      logger.error("Route", "Authentication failed for install org, redirecting to login");
      sessionStore.clearSession();
      return redirect({
        to: "/",
      });
    }
  },
  component: InstallOrg,
});

const WizardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wizard",
  beforeLoad: async () => {
    try {
      logger.info("Route", "Checking authentication status for wizard route");
      
      // First check session store - no API call needed
      if (sessionStore.hasActiveSession()) {
        const sessionData = sessionStore.getSession()!;
        logger.info("Route", "Using existing session data for wizard");
        
        // Check if we have org data and it's valid
        const cachedOrgData = sessionStore.read('orgData');
        if (cachedOrgData && cachedOrgData.total > 0) {
          logger.info("Route", "Valid org data found, proceeding to wizard");
          return { userData: sessionData };
        } else {
          logger.info("Route", "No valid org data, redirecting to install org");
          return redirect({ to: "/installOrg" });
        }
      }

      // Only make API call if no valid session exists
      logger.info("Route", "No active session, attempting server authentication");
      const userData = await useToken();
      sessionStore.setSession(userData);
      logger.info("Route", "Creating new session, redirecting to install org to check organization");
      return redirect({ to: "/installOrg" });
    } catch (error) {
      // Handle errors silently - redirect to login without showing error
      logger.error("Route", "Authentication failed for wizard, redirecting to login");
      sessionStore.clearSession();
      return redirect({
        to: "/",
      });
    }
  },
  component: Wizard,
});

// Catch-all route for any undefined paths - redirect to login
const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$",
  beforeLoad: () => {
    logger.warn("Route", "Catch-all route triggered, redirecting to login");
    return redirect({ to: "/" });
  },
  component: () => <PageLoader message="Redirecting..." />,
});

const routeTree = rootRoute.addChildren([
  indexRoute, 
  InstallOrgRoute, 
  WizardRoute,
  catchAllRoute
]);

export default routeTree;