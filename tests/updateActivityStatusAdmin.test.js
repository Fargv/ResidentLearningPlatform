const { updateActivityStatus } = require('../src/controllers/adminController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const ErrorResponse = require('../src/utils/errorResponse');

jest.mock('../src/controllers/progresoController', () => ({
  updatePhaseStatus: jest.fn()
}));

describe('updateActivityStatus admin restrictions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('updates activity when fase is en progreso', async () => {
    const progreso = {
      estadoGeneral: 'en progreso',
      actividades: [{ estado: 'pendiente' }],
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({})
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', index: 0, estado: 'completado' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await updateActivityStatus(req, res, next);

    expect(progreso.actividades[0].estado).toBe('completado');
    expect(progreso.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
    expect(next).not.toHaveBeenCalled();
  });

  test.each([
    'bloqueada',
    'completado',
    'validado'
  ])('rejects update when fase is %s', async (estadoGeneral) => {
    const progreso = {
      estadoGeneral,
      actividades: [{ estado: 'pendiente' }],
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({})
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', index: 0, estado: 'completado' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await updateActivityStatus(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(progreso.save).not.toHaveBeenCalled();
  });
});
