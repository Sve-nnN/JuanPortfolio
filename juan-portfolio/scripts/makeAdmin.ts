import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const makeAdmin = async () => {
    const email = 'juancarlosanguloabud@gmail.com'
    console.log(`🔍 Finding user: ${email}...`)

    try {
        const payloadConfig = await config
        const payload = await getPayload({ config: payloadConfig })

        const users = await payload.find({
            collection: 'users',
            where: {
                email: {
                    equals: email,
                },
            },
        })

        if (users.totalDocs === 0) {
            console.error(`❌ User not found: ${email}`)
            process.exit(1)
        }

        const user = users.docs[0]
        console.log(`👤 Found user: ${user.name} (${user.id})`)
        console.log(`current role: ${user.role}`)

        if (user.role === 'admin') {
            console.log('✅ User is already an admin.')
            process.exit(0)
        }

        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                role: 'admin',
            },
        })

        console.log(`✅ Successfully promoted ${user.name} to admin!`)
        process.exit(0)
    } catch (error) {
        console.error('❌ Error promoting user:', error)
        process.exit(1)
    }
}

makeAdmin()
