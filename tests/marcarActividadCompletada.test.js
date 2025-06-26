const { marcarActividadCompletada } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('marcarActividadCompletada', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('populates fase before responding', async () => {
    const progreso = {
      actividades: [{ actividad: 'a1' }],
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue()
    };

    jest.spyOn(ProgresoResidente, 'findById').mockResolvedValue(progreso);

    const req = { params: { id: 'p1', index: '0' }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await marcarActividadCompletada(req, res, jest.fn());

    expect(progreso.populate).toHaveBeenCalledWith(['fase', 'actividades.actividad']);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
  });
});
