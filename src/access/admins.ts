import type { AccessArgs, FieldAccess } from 'payload'

import type { User } from '@/payload-types'
import { checkRole } from './checkRole'

type isAuthenticated = (args: AccessArgs<User>) => boolean

export const admins: isAuthenticated = ({ req: { user } }) => {
    return checkRole(['admin'], user as User | undefined)
}

export const adminsField: FieldAccess = ({ req: { user } }) => {
    return checkRole(['admin'], user as User | undefined)
}
