const { createUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('createUser - coordinador', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crea coordinador con zona', async () => {
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u1', rol: 'coordinador', zona: 'NORTE' });
    const req = {
      body: {
        nombre: 'Coord',
        apellidos: 'Test',
        email: 'coord@test.com',
        password: 'pass',
        rol: 'coordinador',
        tipo: 'Programa Residentes',
        zona: 'NORTE'
      },
      user: { _id: 'creator' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createUser(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'coordinador', zona: 'NORTE' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'u1', rol: 'coordinador', zona: 'NORTE' } });
  });
});
