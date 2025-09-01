const { marcarActividadCompletada } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const Notificacion = require('../src/models/Notificacion');

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

    const query = { populate: jest.fn().mockResolvedValue(progreso) };
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue(query);

    const req = { params: { id: 'p1', index: '0' }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await marcarActividadCompletada(req, res, jest.fn());

    expect(progreso.populate).toHaveBeenCalledWith([
      'fase',
      'actividades.actividad',
      'actividades.cirugia'
    ]);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: progreso });
  });

  test('creates validation notifications and avoids duplicates', async () => {
    const progreso = {
      _id: 'p1',
      residente: {
        nombre: 'Res',
        apellidos: 'Dent',
        tutor: 't1',
        profesor: 't1'
      },
      actividades: [
        { estado: 'pendiente', actividad: { nombre: 'Act', requiereValidacion: true } }
      ],
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue()
    };

    const query = { populate: jest.fn().mockResolvedValue(progreso) };
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue(query);
    const createSpy = jest.spyOn(Notificacion, 'create').mockResolvedValue({});

    const req = { params: { id: 'p1', index: '0' }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await marcarActividadCompletada(req, res, jest.fn());

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ usuario: 't1', tipo: 'validacion', enlace: '/dashboard/validaciones' })
    );
  });

  test('creates notifications for both tutor and profesor', async () => {
    const progreso = {
      _id: 'p2',
      residente: {
        nombre: 'Res',
        apellidos: 'Dent',
        tutor: 't1',
        profesor: 'pr1'
      },
      actividades: [
        { estado: 'pendiente', actividad: { nombre: 'Act', requiereValidacion: true } }
      ],
      save: jest.fn().mockResolvedValue(),
      populate: jest.fn().mockResolvedValue()
    };

    const query = { populate: jest.fn().mockResolvedValue(progreso) };
    jest.spyOn(ProgresoResidente, 'findById').mockReturnValue(query);
    const createSpy = jest.spyOn(Notificacion, 'create').mockResolvedValue({});

    const req = { params: { id: 'p2', index: '0' }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await marcarActividadCompletada(req, res, jest.fn());

    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(createSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ usuario: 't1', tipo: 'validacion', enlace: '/dashboard/validaciones' })
    );
    expect(createSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ usuario: 'pr1', tipo: 'validacion', enlace: '/dashboard/validaciones' })
    );
  });
});
