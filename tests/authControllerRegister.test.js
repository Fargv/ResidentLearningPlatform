const { register } = require('../src/controllers/authController');
const User = require('../src/models/User');
const { inicializarProgresoFormativo } = require('../src/utils/initProgreso');
const ErrorResponse = require('../src/utils/errorResponse');

jest.mock('../src/utils/initProgreso');

describe('register access codes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('ABEXFOR2025 asigna rol formador y tipo hospital', async () => {
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
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u1', rol: 'formador', tipo: 'hospital', hospital: 'h1' });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'formador', tipo: 'hospital', hospital: 'h1' }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('ABEXSOC2025 requiere sociedad', async () => {
    const req = {
      body: {
        nombre: 'a',
        apellidos: 'b',
        email: 'soc@a.com',
        password: '12345678',
        codigoAcceso: 'ABEXSOC2025',
        consentimientoDatos: true
      }
    };
    const next = jest.fn();
    await register(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });

  test('ABEXSOC2025 crea usuario de sociedad', async () => {
    const req = {
      body: {
        nombre: 'a',
        apellidos: 'b',
        email: 'soc@a.com',
        password: '12345678',
        codigoAcceso: 'ABEXSOC2025',
        sociedad: 's1',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({ _id: 'u2', rol: 'residente', tipo: 'sociedad', sociedad: 's1' });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'residente', tipo: 'sociedad', sociedad: 's1' }));
    expect(inicializarProgresoFormativo).toHaveBeenCalled();
  });
});
