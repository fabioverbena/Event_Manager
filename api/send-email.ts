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

const parseJsonBody = async (req: any): Promise<any> => {
  if (typeof req.body === 'object' && req.body !== null) return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body)
  return {}
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  try {
    await requireAuth(req)

    const body = await parseJsonBody(req)
    const { to, subject, text, attachmentBase64, attachmentFilename } = body || {}

    if (!to || !subject || !text || !attachmentBase64 || !attachmentFilename) {
      res.status(400).json({
        ok: false,
        error: 'Missing required fields: to, subject, text, attachmentBase64, attachmentFilename',
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

    const attachmentBuffer = Buffer.from(String(attachmentBase64), 'base64')

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
