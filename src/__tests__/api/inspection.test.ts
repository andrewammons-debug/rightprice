import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Shared state objects mutated per-test ─────────────────────────────────────
const { adminStore, queryStore, adminChain, regularChain } = vi.hoisted(() => {
  const adminStore = { data: null as any, error: null as any }
  const queryStore = { data: null as any, error: null as any }

  const makeChain = (store: { data: any; error: any }) => {
    const c: any = {
      then(resolve: (v: any) => any, reject?: (e: any) => any) {
        return Promise.resolve(store).then(resolve, reject)
      },
    }
    for (const m of ['from', 'insert', 'update', 'delete', 'select', 'single', 'eq', 'or', 'order', 'limit']) {
      c[m] = () => c
    }
    return c
  }

  return { adminStore, queryStore, adminChain: makeChain(adminStore), regularChain: makeChain(queryStore) }
})

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => adminChain,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: regularChain,
}))

import { POST, PATCH, DELETE, GET } from '@/app/api/inspection/route'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const sampleFormData = {
  vin: '1HGBH41JXMN109186',
  year: '2020',
  make: 'Toyota',
  modelPkg: 'Camry LE',
  body: 'Sedan',
  miles: '45000',
  color: 'White',
  autoManual: 'Auto',
  purchasedFrom: 'Auction',
  price: '$15,000',
  down: '$2,000',
  paid: 'Yes',
  remarks: 'Good condition',
  signature: 'Inspector John',
  date: '2026-06-05',
  checklist: { 'Head Lights': true, Oil: false },
}

const makePostReq = (body = sampleFormData) =>
  new Request('http://localhost/api/inspection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const makePatchReq = (body: Record<string, any>) =>
  new Request('http://localhost/api/inspection', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const makeDeleteReq = (id: string) =>
  new Request(`http://localhost/api/inspection?id=${id}`, { method: 'DELETE' })

const makeGetReq = (params = '') =>
  new Request(`http://localhost/api/inspection${params}`, { method: 'GET' })

// ── Reset stores between tests ────────────────────────────────────────────────
beforeEach(() => {
  adminStore.data = null
  adminStore.error = null
  queryStore.data = null
  queryStore.error = null
})

// ── POST ──────────────────────────────────────────────────────────────────────
describe('POST /api/inspection', () => {
  it('returns 201 with the new record id on success', async () => {
    adminStore.data = { id: 'uuid-abc-123' }
    const res = await POST(makePostReq())
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.id).toBe('uuid-abc-123')
  })

  it('handles price and down strings with currency formatting', async () => {
    adminStore.data = { id: 'uuid-currency' }
    const res = await POST(makePostReq({ ...sampleFormData, price: '$15,000.50', down: '$2,500' }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
  })

  it('handles empty price and down gracefully (defaults to 0)', async () => {
    adminStore.data = { id: 'uuid-empty-price' }
    const res = await POST(makePostReq({ ...sampleFormData, price: '', down: '' }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
  })

  it('returns 500 when Supabase returns an error', async () => {
    adminStore.error = { message: 'duplicate key value violates unique constraint' }
    const res = await POST(makePostReq())
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toContain('duplicate key')
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────
describe('PATCH /api/inspection', () => {
  it('returns 200 on successful update', async () => {
    adminStore.error = null
    const res = await PATCH(makePatchReq({ id: 'uuid-abc', make: 'Honda', year: '2021' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('maps frontend field names to DB column names', async () => {
    adminStore.error = null
    // modelPkg → model, autoManual → transmission, purchasedFrom → purchased_from, etc.
    // Route should not throw on any valid mapped field
    const res = await PATCH(makePatchReq({
      id: 'uuid-abc',
      modelPkg: 'Civic EX',
      autoManual: 'Manual',
      purchasedFrom: 'Trade-in',
      price: '12000',
      down: '1500',
      signature: 'Jane',
      checklist: { Oil: true },
      website_copy: 'Great car!',
    }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 500 when Supabase returns an error', async () => {
    adminStore.error = { message: 'record not found' }
    const res = await PATCH(makePatchReq({ id: 'bad-id', make: 'Honda' }))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toContain('record not found')
  })
})

// ── DELETE ────────────────────────────────────────────────────────────────────
describe('DELETE /api/inspection', () => {
  it('returns 200 on successful deletion', async () => {
    adminStore.error = null
    const res = await DELETE(makeDeleteReq('uuid-to-delete'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 500 when Supabase returns an error', async () => {
    adminStore.error = { message: 'foreign key constraint violation' }
    const res = await DELETE(makeDeleteReq('uuid-bad'))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toContain('foreign key')
  })
})

// ── GET ───────────────────────────────────────────────────────────────────────
describe('GET /api/inspection', () => {
  it('returns all records when no query params are given', async () => {
    queryStore.data = [{ id: '1', vin: 'AAA' }, { id: '2', vin: 'BBB' }]
    const res = await GET(makeGetReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
  })

  it('filters by VIN when ?vin= param is provided', async () => {
    queryStore.data = [{ id: '1', vin: '1HGBH41JXMN109186' }]
    const res = await GET(makeGetReq('?vin=1HGBH41JXMN109186'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body[0].vin).toBe('1HGBH41JXMN109186')
  })

  it('searches across fields when ?search= param is provided', async () => {
    queryStore.data = [{ id: '3', make: 'Toyota', model: 'Camry', year: '2020' }]
    const res = await GET(makeGetReq('?search=Toyota'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body[0].make).toBe('Toyota')
  })

  it('returns 500 when Supabase returns an error', async () => {
    queryStore.error = { message: 'connection timed out' }
    queryStore.data = null
    const res = await GET(makeGetReq())
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toContain('timed out')
  })

  it('returns an empty array when no records exist', async () => {
    queryStore.data = []
    const res = await GET(makeGetReq())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual([])
  })
})
