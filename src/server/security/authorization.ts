/**
 * Turns a policy answer into an HTTP 403 (EP-04.3).
 *
 * Routes call it with a function from `@/modules/identity/domain/permissions`
 * right after authenticating and before reading any record, so a denial says
 * nothing about whether the record exists.
 */
export function authorize(allowed: boolean): void {
  if (!allowed) throw new ForbiddenError();
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden by role");
    this.name = "ForbiddenError";
  }
}
