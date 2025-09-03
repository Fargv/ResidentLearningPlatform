const { inicializarProgresoFormativo } = require('../src/utils/initProgreso');
const Fase = require('../src/models/Fase');
const FaseSoc = require('../src/models/FaseSoc');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const Actividad = require('../src/models/Actividad');
const ActividadSoc = require('../src/models/ActividadSoc');

describe('inicializarProgresoFormativo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('skips phases without activities', async () => {
    const user = { _id: 'res1', email: 'test@example.com' };

    const fases = [
      { _id: 'f1', nombre: 'Fase 1' },
      { _id: 'f2', nombre: 'Fase 2' }
    ];

    jest.spyOn(Fase, 'find').mockReturnValue({
      sort: jest.fn().mockResolvedValue(fases)
    });

    jest.spyOn(Actividad, 'find').mockImplementation(({ fase }) => ({
      select: jest.fn().mockReturnThis(),
      sort: jest
        .fn()
        .mockResolvedValue(
          fase === 'f1'
            ? [{ _id: 'a1', nombre: 'Act 1', tipo: 'procedimiento' }]
            : []
        )
    }));

    const createSpy = jest.spyOn(ProgresoResidente, 'create').mockResolvedValue({});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const count = await inicializarProgresoFormativo(user);

    expect(count).toBe(1);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      fase: 'f1',
      faseModel: 'Fase',
      actividades: [expect.objectContaining({ actividadModel: 'Actividad', tipo: 'procedimiento' })]
    }));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Fase 2')
    );
  });

  test('uses FaseSoc when user.tipo es Programa Sociedades', async () => {
    const user = { _id: 'res1', email: 'test@example.com', tipo: 'Programa Sociedades' };

    const fases = [
      { _id: 'fs1', nombre: 'Soc 1' }
    ];

    const findSpy = jest.spyOn(FaseSoc, 'find').mockReturnValue({
      sort: jest.fn().mockResolvedValue(fases)
    });
    jest.spyOn(ActividadSoc, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest
        .fn()
        .mockResolvedValue([{ _id: 'a1', nombre: 'Act', tipo: 'procedimiento' }])
    });
    const otherSpy = jest.spyOn(Fase, 'find');

    const createSpy = jest.spyOn(ProgresoResidente, 'create').mockResolvedValue({});

    const count = await inicializarProgresoFormativo(user);

    expect(findSpy).toHaveBeenCalled();
    expect(otherSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      faseModel: 'FaseSoc',
      actividades: [expect.objectContaining({ actividadModel: 'ActividadSoc', tipo: 'procedimiento' })]
    }));
    expect(count).toBe(1);
  });
});
