const { register } = require('../src/controllers/authController');
const User = require('../src/models/User');
const Sociedades = require('../src/models/Sociedades');
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
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
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
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(Sociedades, 'findOne').mockResolvedValue({ _id: 's1', status: 'ACTIVO' });
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u2', rol: 'participante', tipo: 'Programa Sociedades', sociedad: 's1' });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'participante', tipo: 'Programa Sociedades', sociedad: 's1' }));
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXSOCUSER2025' });
  });
});
