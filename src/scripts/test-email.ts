import { getPayload } from 'payload'
import configPromise from '../payload.config'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../.env') })

async function testEmail() {
  try {
    console.log('Iniciando prueba de email con Resend...')
    const payload = await getPayload({ config: configPromise })

    const to = process.env.EMAIL_FROM || 'test@example.com'

    console.log(`Enviando email a: ${to}`)

    await payload.sendEmail({
      to,
      subject: 'Prueba de Resend - Juan Portfolio',
      html: '<h1>¡Funciona!</h1><p>Este es un email de prueba desde el sistema de contacto.</p>',
    })

    console.log('✅ Email enviado con éxito.')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error al enviar el email:', error)
    process.exit(1)
  }
}

testEmail()
