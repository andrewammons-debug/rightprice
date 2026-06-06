import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from '@/app/api/vin/route'

const makeReq = (vin?: string) =>
  new Request(`http://localhost/api/vin${vin ? `?vin=${vin}` : ''}`)

const TEST_VIN = '1HGBH41JXMN109186'

describe('GET /api/vin', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 400 when VIN query param is missing', async () => {
    const res = await GET(makeReq())
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error).toBe('VIN is required')
  })

  it('returns Auto.dev data directly when Auto.dev succeeds', async () => {
    const autoDevData = { make: 'Toyota', model: 'Camry', year: 2020, trim: 'LE' }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(autoDevData), { status: 200 })
    )
    const res = await GET(makeReq(TEST_VIN))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.make).toBe('Toyota')
    expect(body.trim).toBe('LE')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to NHTSA when Auto.dev returns NOT_FOUND status', async () => {
    const nhtsaData = { Results: [{ Make: 'HONDA', Model: 'Civic', ModelYear: '2019' }] }
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'NOT_FOUND' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(nhtsaData), { status: 200 }))
    const res = await GET(makeReq(TEST_VIN))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.Results[0].Make).toBe('HONDA')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to NHTSA when Auto.dev returns no make field', async () => {
    const nhtsaData = { Results: [{ Make: 'FORD', Model: 'F-150' }] }
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'OK', trim: 'XLT' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(nhtsaData), { status: 200 }))
    const res = await GET(makeReq(TEST_VIN))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to NHTSA when Auto.dev returns a non-200 status', async () => {
    const nhtsaData = { Results: [{ Make: 'CHEVROLET', Model: 'Silverado' }] }
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(nhtsaData), { status: 200 }))
    const res = await GET(makeReq(TEST_VIN))
    expect(res.status).toBe(200)
  })

  it('returns 404 when both Auto.dev and NHTSA return no usable data', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'NOT_FOUND' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ Results: [] }), { status: 200 }))
    const res = await GET(makeReq(TEST_VIN))
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error).toBe('Vehicle not found in any registry')
  })

  it('returns 500 on a network-level fetch error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network failure'))
    const res = await GET(makeReq(TEST_VIN))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body.error).toBe('Network failure')
  })

  it('passes the VIN to the Auto.dev URL', async () => {
    const autoDevData = { make: 'Subaru', model: 'Outback', year: 2022 }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(autoDevData), { status: 200 })
    )
    await GET(makeReq(TEST_VIN))
    expect(fetchMock.mock.calls[0][0]).toContain(TEST_VIN)
  })

  it('includes Authorization header for Auto.dev', async () => {
    const autoDevData = { make: 'Subaru', model: 'Outback', year: 2022 }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(autoDevData), { status: 200 })
    )
    await GET(makeReq(TEST_VIN))
    const init = fetchMock.mock.calls[0][1]
    expect(init?.headers?.Authorization).toContain('Bearer')
  })
})
