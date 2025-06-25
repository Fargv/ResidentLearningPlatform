const { inicializarProgresoFormativo } = require('../src/utils/initProgreso');
const Fase = require('../src/models/Fase');
const FaseSoc = require('../src/models/FaseSoc');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('inicializarProgresoFormativo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('skips phases without activities', async () => {
    const user = { _id: 'res1', email: 'test@example.com' };

    const fases = [
      { _id: 'f1', nombre: 'Fase 1', actividades: [{ _id: 'a1', nombre: 'Act 1' }] },
      { _id: 'f2', nombre: 'Fase 2', actividades: [] }
    ];

    jest.spyOn(Fase, 'find').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(fases)
    });

    const createSpy = jest.spyOn(ProgresoResidente, 'create').mockResolvedValue({});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const count = await inicializarProgresoFormativo(user);

    expect(count).toBe(1);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      fase: 'f1',
      faseModel: 'Fase',
      actividades: [expect.objectContaining({ actividadModel: 'Actividad' })]
    }));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Fase 2')
    );
  });

  test('uses FaseSoc when user.tipo es Programa Sociedades', async () => {
    const user = { _id: 'res1', email: 'test@example.com', tipo: 'Programa Sociedades' };

    const fases = [
      { _id: 'fs1', nombre: 'Soc 1', actividades: [{ _id: 'a1', nombre: 'Act' }] }
    ];

    const findSpy = jest.spyOn(FaseSoc, 'find').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(fases)
    });
    const otherSpy = jest.spyOn(Fase, 'find');

    const createSpy = jest.spyOn(ProgresoResidente, 'create').mockResolvedValue({});

    const count = await inicializarProgresoFormativo(user);

    expect(findSpy).toHaveBeenCalled();
    expect(otherSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      faseModel: 'FaseSoc',
      actividades: [expect.objectContaining({ actividadModel: 'ActividadSoc' })]
    }));
    expect(count).toBe(1);
  });
});
