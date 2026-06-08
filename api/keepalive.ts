import https from 'https'

function httpsGet(url: string, headers: Record<string, string>): Promise<number> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const req = https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers }, (res) => {
      res.resume()
      resolve(res.statusCode ?? 0)
    })
    req.on('error', reject)
  })
}

export default async function handler(req: any, res: any) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars' })
    }

    const statusCode = await httpsGet(
      `${supabaseUrl}/rest/v1/categorie?select=id&limit=1`,
      { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    )

    if (statusCode < 200 || statusCode >= 300) {
      console.error(`[keepalive] Supabase ping FAILED: ${statusCode}`)
      return res.status(500).json({ ok: false, error: `Supabase responded with ${statusCode}` })
    }

    const timestamp = new Date().toISOString()
    console.log(`[keepalive] Supabase ping OK at ${timestamp}`)
    return res.status(200).json({ ok: true, timestamp })
  } catch (e: any) {
    console.error('[keepalive] error:', e?.message)
    return res.status(500).json({ ok: false, error: e?.message || 'Unknown error' })
  }
}
