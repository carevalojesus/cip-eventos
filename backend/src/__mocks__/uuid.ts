// Mock for uuid module (ESM)
export const v4 = jest.fn(() => 'test-uuid-1234');
export const validate = jest.fn((id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
);
export const version = jest.fn(() => 4);
export const NIL = '00000000-0000-0000-0000-000000000000';
export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export default { v4, validate, version, NIL, MAX };
