export default async function handler(req: any, res: any) {
  // Vercel Cron invia automaticamente Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars' })
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/categorie?select=id&limit=1`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  })

  if (!response.ok) {
    console.error(`[keepalive] Supabase ping FAILED: ${response.status}`)
    return res.status(500).json({ ok: false, error: `Supabase responded with ${response.status}` })
  }

  const timestamp = new Date().toISOString()
  console.log(`[keepalive] Supabase ping OK at ${timestamp}`)
  return res.status(200).json({ ok: true, timestamp })
}
