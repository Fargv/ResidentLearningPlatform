const { updateActivityStatus } = require('../src/controllers/adminController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const ErrorResponse = require('../src/utils/errorResponse');

jest.mock('../src/controllers/progresoController', () => ({
  updatePhaseStatus: jest.fn().mockResolvedValue()
}));

describe('updateActivityStatus', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows status change when fase is active', async () => {
    const actividad = { estado: 'pendiente' };
    const progreso = {
      estadoGeneral: 'en progreso',
      actividades: [actividad],
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

    expect(actividad.estado).toBe('completado');
    expect(progreso.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects status change when fase not active', async () => {
    const actividad = { estado: 'pendiente' };
    const progreso = {
      estadoGeneral: 'completado',
      actividades: [actividad],
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({})
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', index: 0, estado: 'validado' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await updateActivityStatus(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(actividad.estado).toBe('pendiente');
    expect(progreso.save).not.toHaveBeenCalled();
  });
});
