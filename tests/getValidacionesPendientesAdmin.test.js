const { getValidacionesPendientesAdmin } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('getValidacionesPendientesAdmin', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('no aplica match al populate de residente', async () => {
    const populate = jest.fn();
    populate
      .mockReturnValueOnce({ populate })
      .mockReturnValueOnce({ populate })
      .mockResolvedValueOnce([]);
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate });

    const req = { user: { rol: 'administrador' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getValidacionesPendientesAdmin(req, res, jest.fn());

    const matchArg = populate.mock.calls[0][0].match;
    expect(matchArg).toBeUndefined();
  });
});
