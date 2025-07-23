const { register } = require('../src/controllers/authController');
const User = require('../src/models/User');

jest.mock('../src/models/AccessCode', () => {
  let docs = [];
  return {
    create: jest.fn(async doc => {
      docs.push({ ...doc });
      return doc;
    }),
    findOne: jest.fn(async query => docs.find(d => d.codigo === query.codigo) || null),
    deleteMany: jest.fn(async () => {
      docs = [];
    })
  };
});
const AccessCode = require('../src/models/AccessCode');

describe('register coordinador access code', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await AccessCode.deleteMany();
  });

  test('ABEXCOOR2025 asigna rol coordinador con zona', async () => {
    const req = {
      body: {
        nombre: 'c',
        apellidos: 'd',
        email: 'c@d.com',
        password: '12345678',
        codigoAcceso: 'ABEXCOOR2025',
        zona: 'NORTE',
        consentimientoDatos: true
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await AccessCode.create({ codigo: 'ABEXCOOR2025', rol: 'coordinador', tipo: 'Programa Residentes' });
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({
      _id: 'u1',
      rol: 'coordinador',
      tipo: 'Programa Residentes',
      zona: 'NORTE',
      hospital: null
    });

    await register(req, res, jest.fn());

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ rol: 'coordinador', tipo: 'Programa Residentes', zona: 'NORTE', hospital: undefined })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(AccessCode.findOne).toHaveBeenCalledWith({ codigo: 'ABEXCOOR2025' });
  });
});
