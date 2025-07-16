const { updatePassword } = require('../src/controllers/authController');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../src/utils/errorResponse');

describe('updatePassword', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('cambia la contraseña cuando la actual es correcta', async () => {
    const userDoc = {
      matchPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(),
      _id: 'u1',
      email: 'a@b.com',
      rol: 'residente'
    };
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({ select: jest.fn().mockResolvedValue(userDoc) });
    jest.spyOn(jwt, 'sign').mockReturnValue('newtoken');

    const req = { user: { id: 'u1' }, body: { currentPassword: 'old', newPassword: 'new' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updatePassword(req, res, jest.fn());

    expect(userDoc.matchPassword).toHaveBeenCalledWith('old');
    expect(userDoc.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, token: 'newtoken' });
  });

  test('pasa error si la contraseña actual no coincide', async () => {
    const userDoc = { matchPassword: jest.fn().mockResolvedValue(false) };
    jest
      .spyOn(User, 'findById')
      .mockReturnValue({ select: jest.fn().mockResolvedValue(userDoc) });
    const next = jest.fn();

    await updatePassword({ user: { id: 'u1' }, body: { currentPassword: 'bad', newPassword: 'new' } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});
