/**
 * Shared auth constants. Kept free of runtime imports so that edge-runtime
 * code (middleware.ts) can use them without pulling in the database layer.
 */
export const SESSION_COOKIE = "portal_session";
