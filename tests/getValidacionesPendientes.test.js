const { getValidacionesPendientes } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('getValidacionesPendientes filtro sociedad', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('incluye sociedad en match cuando se envía query', async () => {
    const populate = jest.fn();
    populate
      .mockReturnValueOnce({ populate })
      .mockResolvedValueOnce([]);
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate });

    const req = { user: { rol: 'formador', hospital: 'h1' }, query: { sociedad: 's1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getValidacionesPendientes(req, res, jest.fn());

    const matchArg = populate.mock.calls[0][0].match;
    expect(matchArg).toEqual({ hospital: 'h1', sociedad: 's1' });
  });
});
