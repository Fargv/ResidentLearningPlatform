const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Sociedades = require('../src/models/Sociedades');
const { createAuditLog } = require('../src/utils/auditLog');
const { inicializarProgresoFormativo } = require('../src/utils/initProgreso');
const { resolveTutor } = require('../src/utils/resolveTutor');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));
jest.mock('../src/utils/initProgreso');
jest.mock('../src/utils/resolveTutor', () => ({ resolveTutor: jest.fn() }));

const { createUser } = require('../src/controllers/userController');

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

  test('autoasigna tutor al crear residente sin especificarlo', async () => {
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    resolveTutor.mockResolvedValue('t1');
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u2', rol: 'residente', tutor: 't1' });
    const req = {
      body: {
        nombre: 'Res',
        apellidos: 'Test',
        email: 'res@test.com',
        password: 'pass',
        rol: 'residente',
        tipo: 'Programa Residentes',
        hospital: 'h1',
        especialidad: 'URO'
      },
      user: { _id: 'creator' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createUser(req, res, jest.fn());

    expect(resolveTutor).toHaveBeenCalledWith('ALL', 'h1', 'URO');
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'residente', tutor: 't1' })
    );
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
  });
});
