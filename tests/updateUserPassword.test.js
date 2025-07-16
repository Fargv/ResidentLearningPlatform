const { updateUserPassword } = require('../src/controllers/userController');
const User = require('../src/models/User');
const ErrorResponse = require('../src/utils/errorResponse');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('updateUserPassword', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('updates password and logs action', async () => {
    const save = jest.fn().mockResolvedValue();
    const user = { _id: 'u1', email: 'test@example.com', save };
    jest.spyOn(User, 'findById').mockResolvedValue(user);

    const req = {
      params: { id: 'u1' },
      body: { password: 'newpass' },
      user: { _id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateUserPassword(req, res, jest.fn());

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(user.password).toBe('newpass');
    expect(save).toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith({
      usuario: 'admin',
      accion: 'actualizar_password_usuario',
      descripcion: 'Contraseña actualizada para usuario: test@example.com',
      ip: '::1'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
  });

  test('calls next when user not found', async () => {
    jest.spyOn(User, 'findById').mockResolvedValue(null);
    const next = jest.fn();
    const req = { params: { id: 'bad' }, body: { password: 'x' } };

    await updateUserPassword(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});
