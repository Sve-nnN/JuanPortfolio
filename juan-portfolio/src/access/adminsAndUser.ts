import type { Access } from 'payload'

import type { User } from '@/payload-types'
import { checkRole } from './checkRole'

export const adminsAndUser: Access = ({ req: { user } }) => {
    if (user) {
        if (checkRole(['admin'], user as User)) {
            return true
        }

        return {
            id: {
                equals: user.id,
            },
        }
    }

    return false
}
