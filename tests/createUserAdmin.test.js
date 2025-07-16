const { createUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Sociedades = require('../src/models/Sociedades');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('createUser - administrador', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crea administrador sin tipo', async () => {
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u1', rol: 'administrador' });
    const req = {
      body: {
        nombre: 'Admin',
        apellidos: 'Test',
        email: 'admin@test.com',
        password: 'pass',
        rol: 'administrador',
        tipo: 'invalido'
      },
      user: { _id: 'creator' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createUser(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'administrador', tipo: undefined })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'u1', rol: 'administrador' } });
  });
});
