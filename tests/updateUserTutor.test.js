const { updateUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const { resolveTutor } = require('../src/utils/resolveTutor');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));
jest.mock('../src/utils/resolveTutor', () => ({ resolveTutor: jest.fn() }));

describe('updateUser tutor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('desasigna tutor cuando se envía cadena vacía', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue({
      _id: 'u1',
      email: 'res@test.com',
      rol: 'residente',
      hospital: 'h1',
      especialidad: 'URO',
      tutor: 't1',
    });

    const updatedUser = { _id: 'u1', rol: 'residente', tutor: null };
    const populate3 = jest.fn().mockResolvedValue(updatedUser);
    const populate2 = jest.fn().mockReturnValue({ populate: populate3 });
    const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
    jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({ populate: populate1 });

    const req = {
      params: { id: 'u1' },
      body: { tutor: '' },
      user: { _id: 'admin', rol: 'administrador' },
      ip: '::1',
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateUser(req, res, jest.fn());

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ tutor: null }),
      { new: true, runValidators: true }
    );
    expect(resolveTutor).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
