const { register } = require('../src/controllers/authController');
const User = require('../src/models/User');
const Sociedades = require('../src/models/Sociedades');
const Hospital = require('../src/models/Hospital');
jest.mock('../src/models/AccessCode', () => {
  let docs = [];
  return {
    create: jest.fn(async (doc) => {
      docs.push({ ...doc });
      return doc;
    }),
    findOne: jest.fn(async (query) =>
      docs.find((d) => d.codigo === query.codigo) || null
    ),
    deleteMany: jest.fn(async () => {
      docs = [];
    })
  };
});
const AccessCode = require('../src/models/AccessCode');
const { inicializarProgresoFormativo } = require('../src/utils/initProgreso');
const ErrorResponse = require('../src/utils/errorResponse');
const ProgresoResidente = require('../src/models/ProgresoResidente');

jest.mock('../src/utils/initProgreso');

describe('register access codes', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await AccessCode.deleteMany();
  });

  test('ABEXFOR2025 asigna rol tutor y tipo Programa Residentes', async () => {
    const req = {
      body: {
        nombre: 'a',
        apellidos: 'b',
        email: 'a@b.com',
        password: '12345678',
        codigoAcceso: 'ABEXFOR2025',
        hospital: 'h1',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await AccessCode.create({ codigo: 'ABEXFOR2025', rol: 'tutor', tipo: 'Programa Residentes' });
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    jest
      .spyOn(User, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => ({
        sort: () => ({ select: jest.fn().mockResolvedValue(null) })
      }));
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u1', rol: 'tutor', tipo: 'Programa Residentes', hospital: 'h1' });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'tutor', tipo: 'Programa Residentes', hospital: 'h1' }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXFOR2025' });
  });

  test('ABEXSOCUSER2025 requiere sociedad', async () => {
    const req = {
      body: {
        nombre: 'a',
        apellidos: 'b',
        email: 'soc@a.com',
        password: '12345678',
        codigoAcceso: 'ABEXSOCUSER2025',
        consentimientoDatos: true
      }
    };
    await AccessCode.create({ codigo: 'ABEXSOCUSER2025', rol: 'participante', tipo: 'Programa Sociedades' });
    const next = jest.fn();
    await register(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXSOCUSER2025' });
  });

  test('ABEXSOCUSER2025 crea usuario de sociedad', async () => {
    const req = {
      body: {
        nombre: 'a',
        apellidos: 'b',
        email: 'soc@a.com',
        password: '12345678',
        codigoAcceso: 'ABEXSOCUSER2025',
        sociedad: 's1',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await AccessCode.create({ codigo: 'ABEXSOCUSER2025', rol: 'participante', tipo: 'Programa Sociedades' });
    jest
      .spyOn(User, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => ({
        sort: () => ({ select: jest.fn().mockResolvedValue(null) })
      }));
    jest.spyOn(Sociedades, 'findOne').mockResolvedValue({ _id: 's1', status: 'ACTIVO' });
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u2', rol: 'participante', tipo: 'Programa Sociedades', sociedad: 's1' });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'participante', tipo: 'Programa Sociedades', sociedad: 's1' }));
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXSOCUSER2025' });
  });

  test('ABEXPARTRES2025 crea participante en Programa Residentes', async () => {
    const req = {
      body: {
        nombre: 'p',
        apellidos: 'q',
        email: 'p@q.com',
        password: '12345678',
        codigoAcceso: 'ABEXPARTRES2025',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await AccessCode.create({ codigo: 'ABEXPARTRES2025', rol: 'participante', tipo: 'Programa Residentes' });
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest
      .spyOn(User, 'create')
      .mockResolvedValue({ _id: 'u5', rol: 'participante', tipo: 'Programa Residentes' });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'participante', tipo: 'Programa Residentes' })
    );
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXPARTRES2025' });
  });

  test('registro de residente con tutor disponible', async () => {
    const req = {
      body: {
        nombre: 'r',
        apellidos: 's',
        email: 'r@s.com',
        password: '12345678',
        codigoAcceso: 'ABEXRES2025',
        hospital: 'h1',
        especialidad: 'URO',
        tutor: 'ALL',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await AccessCode.create({ codigo: 'ABEXRES2025', rol: 'residente', tipo: 'Programa Residentes' });
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    jest
      .spyOn(User, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => ({
        sort: () => ({ select: jest.fn().mockResolvedValue({ _id: 't1' }) })
      }));
    jest
      .spyOn(User, 'create')
      .mockResolvedValue({
        _id: 'u3',
        rol: 'residente',
        tutor: 't1',
        hospital: 'h1',
        tipo: 'Programa Residentes',
        especialidad: 'URO'
      });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'residente', tutor: 't1' })
    );
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXRES2025' });
  });

  test('registro sin tutor asigna tutor null', async () => {
    const req = {
      body: {
        nombre: 'r2',
        apellidos: 's2',
        email: 'r2@s.com',
        password: '12345678',
        codigoAcceso: 'ABEXRES2026',
        hospital: 'h1',
        especialidad: 'URO',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await AccessCode.create({ codigo: 'ABEXRES2026', rol: 'residente', tipo: 'Programa Residentes' });
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    jest
      .spyOn(User, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => ({
        sort: () => ({ select: jest.fn().mockResolvedValue(null) })
      }));
    jest
      .spyOn(User, 'create')
      .mockResolvedValue({
        _id: 'u4',
        rol: 'residente',
        tutor: null,
        hospital: 'h1',
        tipo: 'Programa Residentes',
        especialidad: 'URO'
      });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'residente', tutor: null })
    );
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXRES2026' });
  });

  test('elimina usuario si falla la inicialización del progreso', async () => {
    const req = {
      body: {
        nombre: 'r3',
        apellidos: 's3',
        email: 'r3@s.com',
        password: '12345678',
        codigoAcceso: 'ABEXRES2027',
        hospital: 'h1',
        especialidad: 'URO',
        consentimientoDatos: true
      }
    };
    const next = jest.fn();
    await AccessCode.create({ codigo: 'ABEXRES2027', rol: 'residente', tipo: 'Programa Residentes' });
    jest.spyOn(Hospital, 'findById').mockResolvedValue({ _id: 'h1', zona: 'NORTE' });
    jest
      .spyOn(User, 'findOne')
      .mockImplementationOnce(() => Promise.resolve(null))
      .mockImplementationOnce(() => ({
        sort: () => ({ select: jest.fn().mockResolvedValue(null) })
      }));
    const created = { _id: 'u5', rol: 'residente', hospital: 'h1' };
    jest.spyOn(User, 'create').mockResolvedValue(created);
    inicializarProgresoFormativo.mockRejectedValue(new Error('fail'));
    const deleteUserSpy = jest.spyOn(User, 'deleteOne').mockResolvedValue({});
    const deleteProgSpy = jest.spyOn(ProgresoResidente, 'deleteMany').mockResolvedValue({});

    await register(req, {}, next);

    expect(deleteProgSpy).toHaveBeenCalledWith({ residente: 'u5' });
    expect(deleteUserSpy).toHaveBeenCalledWith({ _id: 'u5' });
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No se pudo completar el registro. Ni el usuario ni el progreso fueron creados' })
    );
  });
});
