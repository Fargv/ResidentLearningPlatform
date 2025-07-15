const { updatePhaseStatusAdmin } = require('../src/controllers/adminController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const ErrorResponse = require('../src/utils/errorResponse');

describe('updatePhaseStatusAdmin', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows change from bloqueada to en progreso', async () => {
    const progreso = {
      estadoGeneral: 'bloqueada',
      actividades: [],
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({})
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', estadoGeneral: 'en progreso' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await updatePhaseStatusAdmin(req, res, next);

    expect(progreso.estadoGeneral).toBe('en progreso');
    expect(progreso.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects moving to completado if activities incomplete', async () => {
    const progreso = {
      estadoGeneral: 'en progreso',
      actividades: [{ estado: 'completado' }, { estado: 'pendiente' }],
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({}),
      fechaFin: null
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', estadoGeneral: 'completado' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await updatePhaseStatusAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
    expect(progreso.estadoGeneral).toBe('en progreso');
    expect(progreso.save).not.toHaveBeenCalled();
  });

   test('allows reverting from completado to en progreso', async () => {
    const progreso = {
      estadoGeneral: 'completado',
      actividades: [],
      fechaFin: new Date('2024-01-01'),
      validadoPor: 'user1',
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({})
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', estadoGeneral: 'en progreso' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updatePhaseStatusAdmin(req, res, jest.fn());

    expect(progreso.estadoGeneral).toBe('en progreso');
    expect(progreso.fechaFin).toBeUndefined();
    expect(progreso.validadoPor).toBeUndefined();
    expect(progreso.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
  });

  test('allows reverting from validado to en progreso', async () => {
    const progreso = {
      estadoGeneral: 'validado',
      actividades: [],
      fechaFin: new Date('2024-01-01'),
      validadoPor: 'user1',
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue({})
    };

    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue({
      populate: jest.fn().mockResolvedValue(progreso)
    });

    const req = { body: { progresoId: 'p1', estadoGeneral: 'en progreso' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updatePhaseStatusAdmin(req, res, jest.fn());

    expect(progreso.estadoGeneral).toBe('en progreso');
    expect(progreso.fechaFin).toBeUndefined();
    expect(progreso.validadoPor).toBeUndefined();
    expect(progreso.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
  });

});