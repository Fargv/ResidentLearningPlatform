const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Sociedades = require('../src/models/Sociedades');
const { createAuditLog } = require('../src/utils/auditLog');
const { inicializarProgresoFormativo } = require('../src/utils/initProgreso');
const { resolveTutor } = require('../src/utils/resolveTutor');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const ErrorResponse = require('../src/utils/errorResponse');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));
jest.mock('../src/utils/initProgreso');
jest.mock('../src/utils/resolveTutor', () => ({ resolveTutor: jest.fn() }));

const { createUser } = require('../src/controllers/userController');

describe('createUser - administrador', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('crea administrador sin tipo', async () => {
    const doc = { _id: 'u1', rol: 'administrador' };
    doc.populate = jest.fn().mockResolvedValue(doc);
    jest.spyOn(User, 'create').mockResolvedValue(doc);
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
    expect(res.json).toHaveBeenCalledWith({ success: true, data: expect.objectContaining({ _id: 'u1', rol: 'administrador' }) });
  });

  test('autoasigna tutor al crear residente sin especificarlo', async () => {
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    resolveTutor.mockResolvedValue('t1');
    const docRes = { _id: 'u2', rol: 'residente', tutor: 't1' };
    docRes.populate = jest.fn().mockResolvedValue(docRes);
    jest.spyOn(User, 'create').mockResolvedValue(docRes);
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

  test('crea participante en Programa Residentes', async () => {
    jest
      .spyOn(User, 'create')
      .mockResolvedValue({ _id: 'u3', rol: 'participante', tipo: 'Programa Residentes' });
    const req = {
      body: {
        nombre: 'Part',
        apellidos: 'Test',
        email: 'part@test.com',
        password: 'pass',
        rol: 'participante',
        tipo: 'Programa Residentes'
      },
      user: { _id: 'creator' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createUser(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'participante', tipo: 'Programa Residentes' })
    );
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
  });
});
