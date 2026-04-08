/**
 * @file Defines the 'authenticated' access control function.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

/**
 * @typedef {function(AccessArgs<User>): boolean} isAuthenticated
 */
type isAuthenticated = (args: AccessArgs<User>) => boolean

/**
 * Grants access only to authenticated users.
 * @type {isAuthenticated}
 * @param {AccessArgs<User>} args - The access arguments.
 * @returns {boolean} Returns true if the user is authenticated, false otherwise.
 */
export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}