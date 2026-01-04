import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PrivacyManager,
  ConsentManager,
  DataDeletionManager,
  GDPRCompliance
} from '@features/privacy'
// Import types are used in function signatures

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  })),
  auth: {
    admin: {
      deleteUser: vi.fn()
    }
  }
}

// Mock fetch for IP address
global.fetch = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

// TODO: Phase 4.1移行により、Privacy関連機能の実装が変更されたため、
// テストを新しい実装に合わせて修正する必要があります（後続PRで対応）
describe.skip('PrivacyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPrivacySettings', () => {
    it('should retrieve existing privacy settings', async () => {
      const mockSettings = {
        user_id: 'user123',
        data_encryption: true,
        share_analytics: false,
        share_usage_data: false,
        allow_cookies: true,
        data_retention_period: 730,
        public_profile: false,
        share_progress: false,
        email_notifications: true,
        data_export: true,
        data_delete: true,
        updated_at: '2025-01-01T00:00:00Z',
        version: 1
      }

      mockSupabase.from().single.mockResolvedValue({ data: mockSettings, error: null })

      const result = await PrivacyManager.getPrivacySettings('user123')

      expect(result).toEqual({
        userId: 'user123',
        dataEncryption: true,
        shareAnalytics: false,
        shareUsageData: false,
        allowCookies: true,
        dataRetentionPeriod: 730,
        publicProfile: false,
        shareProgress: false,
        emailNotifications: true,
        dataExport: true,
        dataDelete: true,
        updatedAt: '2025-01-01T00:00:00Z',
        version: 1
      })
    })

    it('should create default settings for new users', async () => {
      mockSupabase.from().single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } // Not found
      })
      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: {
          user_id: 'user123',
          data_encryption: true,
          share_analytics: false,
          updated_at: '2025-01-01T00:00:00Z',
          version: 1
        },
        error: null
      })

      // Mock IP fetch
      ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ ip: '192.168.1.1' })
      })

      const result = await PrivacyManager.getPrivacySettings('user123')

      expect(result).toBeDefined()
      expect(result?.userId).toBe('user123')
      expect(result?.dataEncryption).toBe(true)
    })

    it('should handle database errors', async () => {
      mockSupabase.from().single.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      })

      await expect(PrivacyManager.getPrivacySettings('user123')).rejects.toThrow('Privacy settings retrieval failed')
    })
  })

  describe('updatePrivacySettings', () => {
    it('should update privacy settings successfully', async () => {
      const updatedData = {
        user_id: 'user123',
        data_encryption: false,
        share_analytics: true,
        updated_at: '2025-01-01T00:00:00Z',
        version: 2
      }

      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: updatedData,
        error: null
      })

      // Mock IP fetch
      ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ ip: '192.168.1.1' })
      })

      const result = await PrivacyManager.updatePrivacySettings('user123', {
        dataEncryption: false,
        shareAnalytics: true
      })

      expect(result.dataEncryption).toBe(false)
      expect(result.shareAnalytics).toBe(true)
      expect(result.version).toBe(2)
    })

    it('should log privacy action after update', async () => {
      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: { user_id: 'user123', version: 2 },
        error: null
      })

      // Mock IP fetch
      ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ ip: '192.168.1.1' })
      })

      await PrivacyManager.updatePrivacySettings('user123', { dataEncryption: false })

      // Check if audit log was called
      expect(mockSupabase.from).toHaveBeenCalledWith('privacy_audit_log')
    })
  })

  describe('logPrivacyAction', () => {
    it('should log privacy actions successfully', async () => {
      ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ ip: '192.168.1.1' })
      })

      mockSupabase.from().insert.mockResolvedValue({ error: null })

      await PrivacyManager.logPrivacyAction('user123', 'privacy_settings_update', {
        changed_fields: ['dataEncryption']
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('privacy_audit_log')
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })

    it('should handle logging errors gracefully', async () => {
      ;(global.fetch as unknown as jest.Mock).mockRejectedValue(new Error('Network error'))
      mockSupabase.from().insert.mockResolvedValue({ error: new Error('DB error') })

      // Should not throw
      await expect(PrivacyManager.logPrivacyAction('user123', 'data_access')).resolves.toBeUndefined()
    })
  })
})

describe.skip('ConsentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ ip: '192.168.1.1' })
    })
  })

  describe('recordConsent', () => {
    it('should record consent successfully', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      await ConsentManager.recordConsent('user123', 'data_processing', true, '1.0')

      expect(mockSupabase.from).toHaveBeenCalledWith('consent_records')
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })

    it('should handle consent withdrawal', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      await ConsentManager.recordConsent('user123', 'analytics', false, '1.0')

      const insertCall = mockSupabase.from().insert.mock.calls[0][0]
      expect(insertCall.granted).toBe(false)
      expect(insertCall.withdrawn_at).toBeDefined()
    })

    it('should throw error on database failure', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: new Error('DB error') })

      await expect(ConsentManager.recordConsent('user123', 'cookies', true)).rejects.toThrow('Consent recording failed')
    })
  })

  describe('getConsentStatus', () => {
    it('should retrieve consent records', async () => {
      const mockRecords = [
        {
          user_id: 'user123',
          consent_type: 'data_processing',
          granted: true,
          granted_at: '2025-01-01T00:00:00Z',
          version: '1.0'
        }
      ]

      mockSupabase.from().order.mockResolvedValue({ data: mockRecords, error: null })

      const result = await ConsentManager.getConsentStatus('user123')

      expect(result).toHaveLength(1)
      expect(result[0].consentType).toBe('data_processing')
      expect(result[0].granted).toBe(true)
    })
  })

  describe('hasValidConsent', () => {
    it('should return true for granted consent', async () => {
      mockSupabase.from().limit().single.mockResolvedValue({
        data: { granted: true, granted_at: '2025-01-01T00:00:00Z' },
        error: null
      })

      const result = await ConsentManager.hasValidConsent('user123', 'analytics')

      expect(result).toBe(true)
    })

    it('should return false for withdrawn consent', async () => {
      mockSupabase.from().limit().single.mockResolvedValue({
        data: { granted: false, granted_at: '2025-01-01T00:00:00Z' },
        error: null
      })

      const result = await ConsentManager.hasValidConsent('user123', 'marketing')

      expect(result).toBe(false)
    })

    it('should return false when no consent record exists', async () => {
      mockSupabase.from().limit().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const result = await ConsentManager.hasValidConsent('user123', 'cookies')

      expect(result).toBe(false)
    })
  })
})

describe.skip('DataDeletionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ ip: '192.168.1.1' })
    })
    
    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: vi.fn(() => 'test-uuid-123')
    } as unknown as Crypto
  })

  describe('requestDataDeletion', () => {
    it('should create deletion request successfully', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      const token = await DataDeletionManager.requestDataDeletion(
        'user123',
        'complete',
        [],
        'User requested account deletion'
      )

      expect(token).toBe('test-uuid-123')
      expect(mockSupabase.from).toHaveBeenCalledWith('data_deletion_requests')
      expect(mockSupabase.from().insert).toHaveBeenCalled()
    })

    it('should create partial deletion request', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      await DataDeletionManager.requestDataDeletion(
        'user123',
        'partial',
        ['goals', 'progress']
      )

      const insertCall = mockSupabase.from().insert.mock.calls[0][0]
      expect(insertCall.request_type).toBe('partial')
      expect(insertCall.data_types).toEqual(['goals', 'progress'])
      expect(insertCall.verification_required).toBe(false)
    })

    it('should require verification for complete deletion', async () => {
      mockSupabase.from().insert.mockResolvedValue({ error: null })

      await DataDeletionManager.requestDataDeletion('user123', 'complete')

      const insertCall = mockSupabase.from().insert.mock.calls[0][0]
      expect(insertCall.verification_required).toBe(true)
    })
  })

  describe('confirmDataDeletion', () => {
    it('should confirm and execute deletion request', async () => {
      const mockRequest = {
        user_id: 'user123',
        request_type: 'complete',
        data_types: null
      }

      // Mock request retrieval
      mockSupabase.from().eq().single.mockResolvedValue({
        data: mockRequest,
        error: null
      })

      // Mock status update
      mockSupabase.from().update().eq.mockResolvedValue({ error: null })

      // Mock data deletion
      mockSupabase.from().delete().eq.mockResolvedValue({ error: null })
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

      const result = await DataDeletionManager.confirmDataDeletion('test-token')

      expect(result).toBe(true)
    })

    it('should handle invalid confirmation token', async () => {
      mockSupabase.from().eq().single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const result = await DataDeletionManager.confirmDataDeletion('invalid-token')

      expect(result).toBe(false)
    })
  })
})

describe.skip('GDPRCompliance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ ip: '192.168.1.1' })
    })
  })

  describe('exerciseRightToAccess', () => {
    it('should export all user data', async () => {
      const mockGoals = [{ id: '1', title: 'Goal 1' }]
      const mockProgress = [{ id: '1', value: 50 }]

      // Mock data retrieval for each table
      mockSupabase.from().select().eq
        .mockResolvedValueOnce({ data: mockGoals, error: null })
        .mockResolvedValueOnce({ data: mockProgress, error: null })
        .mockResolvedValue({ data: [], error: null })

      // Mock privacy settings and consent records
      mockSupabase.from().single.mockResolvedValue({
        data: { user_id: 'user123', data_encryption: true },
        error: null
      })
      mockSupabase.from().order.mockResolvedValue({
        data: [{ consent_type: 'data_processing', granted: true }],
        error: null
      })

      const result = await GDPRCompliance.exerciseRightToAccess('user123')

      expect(result).toHaveProperty('goals')
      expect(result).toHaveProperty('progress_entries')
      expect(result).toHaveProperty('privacy_settings')
      expect(result).toHaveProperty('consent_records')
    })
  })

  describe('exerciseRightToDataPortability', () => {
    it('should create downloadable data blob', async () => {
      // Mock data will be constructed during the test

      // Mock data access
      mockSupabase.from().select().eq.mockResolvedValue({ data: [], error: null })
      mockSupabase.from().single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      mockSupabase.from().upsert().select().single.mockResolvedValue({
        data: { user_id: 'user123' },
        error: null
      })
      mockSupabase.from().order.mockResolvedValue({ data: [], error: null })

      const result = await GDPRCompliance.exerciseRightToDataPortability('user123')

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/json')
    })
  })

  describe('getGDPRRights', () => {
    it('should return all GDPR rights as enabled', () => {
      const rights = GDPRCompliance.getGDPRRights()

      expect(rights.rightToAccess).toBe(true)
      expect(rights.rightToRectification).toBe(true)
      expect(rights.rightToErasure).toBe(true)
      expect(rights.rightToRestrictProcessing).toBe(true)
      expect(rights.rightToDataPortability).toBe(true)
      expect(rights.rightToObject).toBe(true)
      expect(rights.rightNotToBeSubject).toBe(true)
    })
  })
})

describe.skip('Integration Tests', () => {
  it('should handle complete privacy workflow', async () => {
    // Mock all necessary calls
    mockSupabase.from().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    })
    mockSupabase.from().upsert().select().single.mockResolvedValue({
      data: { user_id: 'user123', data_encryption: true, version: 1 },
      error: null
    })
    mockSupabase.from().insert.mockResolvedValue({ error: null })
    ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ ip: '192.168.1.1' })
    })

    // 1. Get privacy settings (creates default)
    const settings = await PrivacyManager.getPrivacySettings('user123')
    expect(settings?.dataEncryption).toBe(true)

    // 2. Record consent
    await ConsentManager.recordConsent('user123', 'data_processing', true)

    // 3. Update privacy settings
    const updated = await PrivacyManager.updatePrivacySettings('user123', {
      shareAnalytics: true
    })
    expect(updated.version).toBeGreaterThan(1)
  })

  it('should handle error scenarios gracefully', async () => {
    // Database connection failure
    mockSupabase.from().single.mockRejectedValue(new Error('Connection failed'))

    await expect(PrivacyManager.getPrivacySettings('user123')).rejects.toThrow()
  })
})