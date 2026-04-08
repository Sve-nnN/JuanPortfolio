'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function sendContactEmail(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string

  if (!name || !email || !message) {
    return { error: 'Por favor, rellena todos los campos.' }
  }

  // Turnstile Verification
  const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY

  if (turnstileSecret && turnstileToken) {
    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(
          turnstileToken,
        )}`,
      })

      const outcome = await response.json()
      if (!outcome.success) {
        return { error: 'Error en la verificación de seguridad (Captcha).' }
      }
    } catch (err) {
      console.error('Error verifying Turnstile:', err)
      // We might want to allow submission if CF is down? Or block?
      // For now, let's block if we have a secret configured.
      return { error: 'Error en el servicio de verificación.' }
    }
  } else if (turnstileSecret && !turnstileToken) {
    return { error: 'Falta validación de seguridad.' }
  }

  try {
    const payload = await getPayload({ config: configPromise })

    await payload.sendEmail({
      to: process.env.EMAIL_FROM || 'original-email@example.com', // Enviar a ti mismo
      subject: `Nuevo mensaje de contacto: ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
          <h2 style="color: #2563eb;">Nuevo mensaje de contacto</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mensaje:</strong></p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
          <hr style="margin-top: 20px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #666;">Este correo fue enviado desde el formulario de contacto de Juan Tech.</p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending contact email:', error)
    return { error: 'Hubo un error al enviar el email. Inténtalo de nuevo más tarde.' }
  }
}
