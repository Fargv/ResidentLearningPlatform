const { getProgresoResidente } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const User = require('../src/models/User');

describe('getProgresoResidente alumno', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('populates fase and actividades.actividad', async () => {
    const populate = jest.fn();
    populate.mockReturnValueOnce({ populate }).mockResolvedValueOnce([]);
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate });
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: 'u1', rol: 'alumno', hospital: 'h1' });

    const req = { params: { id: 'u1' }, user: { rol: 'alumno', id: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getProgresoResidente(req, res, jest.fn());

    expect(populate).toHaveBeenNthCalledWith(1, 'fase');
    expect(populate).toHaveBeenNthCalledWith(2, 'actividades.actividad');
  });
});
