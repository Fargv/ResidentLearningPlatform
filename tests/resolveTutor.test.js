const { resolveTutor } = require('../src/utils/resolveTutor');
const User = require('../src/models/User');
const { Role } = require('../src/utils/roles');

describe('resolveTutor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns provided tutor id when exact tutor is given', async () => {
    const result = await resolveTutor('t1', 'h1', 'URO');
    expect(result).toBe('t1');
  });

  test('selects a tutor when ALL is specified', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 't2' })
    });
    const result = await resolveTutor('ALL', 'h1', 'URO');
    expect(User.findOne).toHaveBeenCalledWith({
      rol: Role.TUTOR,
      hospital: 'h1',
      $or: [{ especialidad: 'URO' }, { especialidad: 'ALL' }]
    });
    expect(result).toBe('t2');
  });

  test('returns null when tutor is absent', async () => {
    const spy = jest.spyOn(User, 'findOne');
    const result = await resolveTutor(null, 'h1', 'URO');
    expect(spy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
