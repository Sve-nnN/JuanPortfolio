/**
 * @file Defines the 'authenticatedOrPublished' access control function.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Access } from 'payload'

/**
 * Grants access to authenticated users or to published documents.
 * If the user is authenticated, it returns true.
 * If the user is not authenticated, it returns a query constraint to only allow documents with status 'published'.
 * @type {Access}
 * @param {object} args - The access arguments.
 * @param {object} args.req - The request object.
 * @param {object} args.req.user - The user object.
 * @returns {boolean|object} Returns true for authenticated users, or a query constraint for anonymous users.
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}