import nodemailer from 'nodemailer'
import admin from 'firebase-admin'

const getFirebaseAdminApp = () => {
  if (admin.apps.length > 0) return admin.app()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)')
  }

  privateKey = privateKey.replace(/\\n/g, '\n')

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

const requireAuth = async (req: any) => {
  const header = req.headers.authorization || ''
  const match = header.match(/^Bearer (.+)$/)
  if (!match) throw new Error('Missing Authorization Bearer token')

  const token = match[1]
  const app = getFirebaseAdminApp()
  const decoded = await app.auth().verifyIdToken(token)
  return decoded
}

const decodeHeaderValue = (value: unknown) => {
  const normalized = Array.isArray(value) ? value[0] : value
  if (typeof normalized !== 'string') return ''
  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

const readBinaryBody = async (req: any): Promise<Buffer> => {
  if (Buffer.isBuffer(req.body)) return req.body
  if (req.body instanceof Uint8Array) return Buffer.from(req.body)
  if (typeof req.body === 'string') return Buffer.from(req.body, 'binary')

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    await requireAuth(req)

    const to = decodeHeaderValue(req.headers['x-email-to'])
    const subject = decodeHeaderValue(req.headers['x-email-subject'])
    const text = decodeHeaderValue(req.headers['x-email-text'])
    const attachmentFilename = decodeHeaderValue(req.headers['x-attachment-filename'])
    const attachmentBuffer = await readBinaryBody(req)

    if (!to || !subject || !text || !attachmentFilename || attachmentBuffer.length === 0) {
      res.status(400).json({
        ok: false,
        error: 'Missing required fields: x-email-to, x-email-subject, x-email-text, x-attachment-filename or empty PDF body',
      })
      return
    }

    const host = process.env.SMTP_HOST
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || user

    if (!host || !port || !user || !pass || !from) {
      res.status(500).json({ ok: false, error: 'Missing SMTP env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)' })
      return
    }

    const secure = port === 465

    console.log('[send-email] smtp config', {
      host,
      port,
      secure,
      user,
      from,
      passLen: String(pass).length,
    })

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    try {
      await transporter.verify()
      console.log('[send-email] smtp verify OK')
    } catch (verifyErr: any) {
      console.error('[send-email] smtp verify FAILED', {
        message: verifyErr?.message,
        code: verifyErr?.code,
        response: verifyErr?.response,
        responseCode: verifyErr?.responseCode,
        command: verifyErr?.command,
      })
      throw verifyErr
    }

    const fixedBcc = 'fiordacqua@gmail.com'

    await transporter.sendMail({
      from,
      to,
      bcc: fixedBcc,
      subject,
      text,
      attachments: [
        {
          filename: String(attachmentFilename),
          content: attachmentBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e?.message || 'Unknown error',
      details: {
        code: e?.code,
        responseCode: e?.responseCode,
        command: e?.command,
      },
    })
  }
}
