const { createUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('createUser - csm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crea csm con zona', async () => {
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u1', rol: 'csm', zona: 'NORTE' });
    const req = {
      body: {
        nombre: 'Coord',
        apellidos: 'Test',
        email: 'coord@test.com',
        password: 'pass',
        rol: 'csm',
        tipo: 'Programa Residentes',
        zona: 'NORTE'
      },
      user: { _id: 'creator' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createUser(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'csm', zona: 'NORTE' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'u1', rol: 'csm', zona: 'NORTE' } });
  });
});