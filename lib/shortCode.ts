/** Short-code shape shared by every route and middleware.
 *  Centralized so the regex and the reserved set never drift apart. */
export const CODE_RE = /^[A-Za-z0-9]{6,12}$/;
