import { hashPassword, verifyPassword } from '@/lib/password';

describe('password hashing', () => {
  it('verifies the correct password and rejects a different password', () => {
    const storedHash = hashPassword('correct horse battery staple');

    expect(verifyPassword('correct horse battery staple', storedHash)).toBe(true);
    expect(verifyPassword('incorrect password', storedHash)).toBe(false);
  });

  it('uses a unique salt for each password hash', () => {
    const firstHash = hashPassword('same password');
    const secondHash = hashPassword('same password');

    expect(firstHash).not.toBe(secondHash);
    expect(verifyPassword('same password', firstHash)).toBe(true);
    expect(verifyPassword('same password', secondHash)).toBe(true);
  });

  it('rejects malformed stored hashes', () => {
    expect(verifyPassword('password', '')).toBe(false);
    expect(verifyPassword('password', 'missing-separator')).toBe(false);
  });
});