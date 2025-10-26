import nodemailer from 'nodemailer'
import type { EmailTransport } from 'payload/config'
import { Resend } from 'resend'

// Minimal Resend-backed Nodemailer transport for Payload
// Env vars used:
// - RESEND_SECRET (required)
// - EMAIL_FROM (optional, used by payload.email.fromAddress)
// - EMAIL_FROM_NAME (optional)

type TransportArgs = Parameters<typeof nodemailer.createTransport>[0]

type ResendError = {
  name: string
  message: string
  statusCode?: number
}

function isResendError(err: unknown): err is ResendError {
  return Boolean(err && typeof err === 'object' && 'message' in err && 'name' in err)
}

export function createResendTransport({ apiKey }: { apiKey: string }): EmailTransport {
  const resend = new Resend(apiKey)

  const transportConfig: TransportArgs = {
    name: 'resend-transport',
    version: '1.0.0',
    send: async (mail, callback) => {
      try {
        const { from, to, subject, html, text, cc, bcc, replyTo } = mail.data

        if (!to) return callback(new Error('No "to" address provided'), null)

        let fromToUse: string
        if (typeof from === 'string') {
          fromToUse = from
        } else if (from && typeof from === 'object' && 'name' in from && 'address' in from) {
          fromToUse = `${(from as { name: string; address: string }).name} <${(from as { name: string; address: string }).address}>`
        } else {
          const fromName = process.env.EMAIL_FROM_NAME || 'Website'
          const fromAddress = process.env.EMAIL_FROM || 'no-reply@example.com'
          fromToUse = `${fromName} <${fromAddress}>`
        }

        const cleanTo = Array.isArray(to)
          ? to.map((t) => (typeof t === 'string' ? t : t.address))
          : [typeof to === 'string' ? to : to.address]

        const cleanCC = cc
          ? Array.isArray(cc)
            ? cc.map((t) => (typeof t === 'string' ? t : t.address))
            : [typeof cc === 'string' ? cc : cc.address]
          : undefined

        const cleanBCC = bcc
          ? Array.isArray(bcc)
            ? bcc.map((t) => (typeof t === 'string' ? t : t.address))
            : [typeof bcc === 'string' ? bcc : bcc.address]
          : undefined

        const replyToUse = replyTo
          ? typeof replyTo === 'string'
            ? replyTo
            : `${(replyTo as { name?: string }).name || ''} <${(replyTo as { address: string }).address}>`
          : undefined

        // Prefer html body; fallback to text
        const bodyHtml = (html || text) as string | undefined

        // Resend SDK supports .emails.send in latest versions
        // Fallback to sendEmail if needed
        const sender: any = (resend as any).emails || resend
        const sendMethod = sender.send || sender.sendEmail

        const result = await sendMethod.call(sender, {
          from: fromToUse,
          to: cleanTo,
          cc: cleanCC,
          bcc: cleanBCC,
          reply_to: replyToUse,
          subject: subject || '<No subject>',
          html: bodyHtml,
          text: text as string | undefined,
        })

        if (result && result.error) {
          return callback(new Error('Error sending email', { cause: result.error }), null)
        }

        return callback(null, result || { accepted: cleanTo })
      } catch (err) {
        if (isResendError(err)) {
          return callback(new Error(`Error sending email: ${err.statusCode || ''} ${err.name}: ${err.message}`), null)
        }
        if (err instanceof Error) {
          return callback(new Error(`Unexpected error sending email: ${err.message}`), null)
        }
        return callback(new Error('Unexpected error sending email'), null)
      }
    },
  }

  return {
    fromAddress: process.env.EMAIL_FROM || 'no-reply@example.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Website',
    transport: nodemailer.createTransport(transportConfig),
  }
}
