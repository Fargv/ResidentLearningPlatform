const { getValidacionesPendientes } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('getValidacionesPendientes csm zona', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('usa zona en match para csm', async () => {
    const populate = jest.fn();
    populate
      .mockReturnValueOnce({ populate })
      .mockResolvedValueOnce([]);
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate });

    const req = { user: { rol: 'csm', zona: 'NORTE' }, query: { zona: 'NORTE' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getValidacionesPendientes(req, res, jest.fn());

    const matchArg = populate.mock.calls[0][0].match;
    expect(matchArg).toEqual({ zona: 'NORTE' });
  });
});
