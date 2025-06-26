const { updatePhaseStatus } = require('../src/controllers/progresoController');
const Fase = require('../src/models/Fase');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('updatePhaseStatus', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('marks phase as validated and unlocks next phase', async () => {
    const progreso = {
      actividades: [ { estado: 'validado' }, { estado: 'validado' } ],
      estadoGeneral: 'en progreso',
      residente: { _id: 'res1' },
      fase: { _id: 'fase1', orden: 1 },
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue()
    };

    const nextFase = { _id: 'fase2', orden: 2 };
    const nextProgreso = {
      estadoGeneral: 'bloqueada',
      save: jest.fn()
    };

    jest.spyOn(Fase, 'findOne').mockResolvedValue(nextFase);
    jest.spyOn(ProgresoResidente, 'findOne').mockResolvedValue(nextProgreso);

    await updatePhaseStatus(progreso);

    expect(progreso.estadoGeneral).toBe('validado');
    expect(progreso.save).toHaveBeenCalled();
    expect(nextProgreso.estadoGeneral).toBe('en progreso');
    expect(nextProgreso.save).toHaveBeenCalled();
  });
  test('uses FaseSoc when progreso.faseModel es FaseSoc', async () => {
    const progreso = {
      actividades: [{ estado: 'validado' }, { estado: 'validado' }],
      estadoGeneral: 'en progreso',
      residente: { _id: 'res1' },
      faseModel: 'FaseSoc',
      fase: { _id: 'soc1', orden: 1 },
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue()
    };

    const nextFase = { _id: 'soc2', orden: 2 };
    const nextProgreso = {
      estadoGeneral: 'bloqueada',
      save: jest.fn()
    };

    const faseSpy = jest.spyOn(Fase, 'findOne');
    const faseSocSpy = jest.spyOn(FaseSoc, 'findOne').mockResolvedValue(nextFase);
    const progresoSpy = jest.spyOn(ProgresoResidente, 'findOne').mockResolvedValue(nextProgreso);

    await updatePhaseStatus(progreso);

    expect(faseSocSpy).toHaveBeenCalled();
    expect(faseSpy).not.toHaveBeenCalled();
    expect(progresoSpy).toHaveBeenCalledWith({ residente: 'res1', fase: nextFase._id });
    expect(progreso.estadoGeneral).toBe('validado');
    expect(nextProgreso.estadoGeneral).toBe('en progreso');
  });
});