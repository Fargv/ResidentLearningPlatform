const { createUser } = require('../src/controllers/userController');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const { createAuditLog } = require('../src/utils/auditLog');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('createUser - coordinador', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crea coordinador con hospital', async () => {
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1' });
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u1', rol: 'coordinador' });
    const req = {
      body: {
        nombre: 'Coord',
        apellidos: 'Test',
        email: 'coord@test.com',
        password: 'pass',
        rol: 'coordinador',
        tipo: 'Programa Residentes',
        hospital: 'h1'
      },
      user: { _id: 'creator' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createUser(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'coordinador', hospital: 'h1' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { _id: 'u1', rol: 'coordinador' } });
  });
});
