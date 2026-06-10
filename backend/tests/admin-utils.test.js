const { isAdminUser, getAdminSettings } = require('../src/utils/admin');

describe('admin utilities', () => {
  it('detects admin users using isAdmin flag', () => {
    expect(isAdminUser({ isAdmin: true })).toBe(true);
    expect(isAdminUser({ isAdmin: false })).toBe(false);
  });

  it('detects admin users using role', () => {
    expect(isAdminUser({ role: 'admin' })).toBe(true);
    expect(isAdminUser({ role: 'user' })).toBe(false);
  });

  it('returns admin settings payload', () => {
    const settings = getAdminSettings();
    expect(settings).toMatchObject({
      paymentGateway: 'razorpay',
      authMode: 'magic-link',
    });
    expect(typeof settings.cloudflareR2Enabled).toBe('boolean');
  });
});
