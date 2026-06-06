import { describe, it, expect } from 'vitest'
import { creditApplicationSchema } from '@/lib/creditSchemas'

const base = {
  name: 'John Doe',
  dob: '1990-01-15',
  phone: '6155551234',
  streetAddress: '123 Main St',
  ssn: '123-45-6789',
  dl: 'D1234567',
  city: 'Nashville',
  state: 'TN',
  zip: '37201',
  employer: 'ACME Corp',
  occupation: 'Engineer',
  netCompensation: '5000',
  relativeName: 'Jane Doe',
  relativeAddress: '456 Oak Ave, Nashville TN',
  authDate: '2026-06-05',
}

describe('creditApplicationSchema', () => {
  it('accepts a valid application', () => {
    expect(creditApplicationSchema.safeParse(base).success).toBe(true)
  })

  it('accepts SSN without dashes (9 consecutive digits)', () => {
    expect(creditApplicationSchema.safeParse({ ...base, ssn: '123456789' }).success).toBe(true)
  })

  it('accepts a valid 9-digit zip+4 code', () => {
    expect(creditApplicationSchema.safeParse({ ...base, zip: '37201-1234' }).success).toBe(true)
  })

  it('accepts all valid marital status values', () => {
    for (const status of ['married', 'unmarried', 'separated'] as const) {
      expect(creditApplicationSchema.safeParse({ ...base, maritalStatus: status }).success).toBe(true)
    }
  })

  it('accepts optional fields being omitted', () => {
    const { name, dob, phone, streetAddress, ssn, dl, city, state, zip, employer, occupation, netCompensation, relativeName, relativeAddress, authDate } = base
    const minimal = { name, dob, phone, streetAddress, ssn, dl, city, state, zip, employer, occupation, netCompensation, relativeName, relativeAddress, authDate }
    expect(creditApplicationSchema.safeParse(minimal).success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, name: 'J' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('Name is required')
  })

  it('rejects phone shorter than 10 characters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, phone: '615555' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain('10 digits')
  })

  it('rejects an SSN that is too short (8 digits)', () => {
    const result = creditApplicationSchema.safeParse({ ...base, ssn: '12345678' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain('SSN')
  })

  it('rejects an SSN with wrong grouping (1234-5-6789)', () => {
    const result = creditApplicationSchema.safeParse({ ...base, ssn: '1234-5-6789' })
    expect(result.success).toBe(false)
  })

  it('rejects state that is not exactly 2 characters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, state: 'TEN' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain('2 characters')
  })

  it('rejects a zip code with fewer than 5 digits', () => {
    const result = creditApplicationSchema.safeParse({ ...base, zip: '1234' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain('Zip')
  })

  it('rejects a zip code with letters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, zip: 'ABCDE' })
    expect(result.success).toBe(false)
  })

  it('rejects missing authDate', () => {
    const result = creditApplicationSchema.safeParse({ ...base, authDate: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain('Date')
  })

  it('rejects employer shorter than 2 characters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, employer: 'X' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toContain('Employer')
  })

  it('rejects relativeName shorter than 2 characters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, relativeName: 'X' })
    expect(result.success).toBe(false)
  })

  it('rejects relativeAddress shorter than 5 characters', () => {
    const result = creditApplicationSchema.safeParse({ ...base, relativeAddress: '123' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid homeStatus enum value', () => {
    const result = creditApplicationSchema.safeParse({ ...base, homeStatus: 'lease' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid maritalStatus enum value', () => {
    const result = creditApplicationSchema.safeParse({ ...base, maritalStatus: 'widowed' })
    expect(result.success).toBe(false)
  })
})
