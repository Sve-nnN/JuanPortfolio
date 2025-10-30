/**
 * @file Defines the 'anyone' access control function.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import type { Access } from 'payload'

/**
 * Grants access to anyone, regardless of authentication status.
 * @type {Access}
 * @returns {boolean} Always returns true.
 */
export const anyone: Access = () => true