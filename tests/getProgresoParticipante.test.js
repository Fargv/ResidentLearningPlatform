const { getProgresoResidente } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');
const User = require('../src/models/User');

describe('getProgresoResidente participante', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('populates fase and actividades.actividad', async () => {
    const populate = jest.fn();
    populate.mockReturnValueOnce({ populate }).mockResolvedValueOnce([]);
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate });
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: 'u1', rol: 'participante', hospital: 'h1' });

    const req = { params: { id: 'u1' }, user: { rol: 'participante', id: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getProgresoResidente(req, res, jest.fn());

    expect(populate).toHaveBeenNthCalledWith(1, 'fase');
    expect(populate).toHaveBeenNthCalledWith(2, 'actividades.actividad');
  });
  test('includes validation and rejection fields in actividades', async () => {
    const progresoData = [{
      _id: 'p1',
      fase: { orden: 1 },
      estadoGeneral: 'en progreso',
      actividades: [{
        nombre: 'Act',
        estado: 'validado',
        comentariosResidente: 'cr',
          comentariosTutor: 'cf',
        fechaRealizacion: '2024-01-01',
        fechaValidacion: '2024-01-02',
        comentariosRechazo: 'rej',
        fechaRechazo: '2024-01-03'
      }]
    }];

    const populate = jest.fn();
    populate
      .mockReturnValueOnce({ populate })
      .mockResolvedValueOnce(progresoData);
    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate });
    jest.spyOn(User, 'findById').mockResolvedValue({ _id: 'u1', rol: 'participante', hospital: 'h1' });

    const req = { params: { id: 'u1' }, user: { rol: 'participante', id: 'u1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getProgresoResidente(req, res, jest.fn());

    const actividad = res.json.mock.calls[0][0].data[0].actividades[0];
      expect(actividad).toHaveProperty('comentariosTutor', 'cf');
    expect(actividad).toHaveProperty('fechaValidacion', '2024-01-02');
    expect(actividad).toHaveProperty('comentariosRechazo', 'rej');
    expect(actividad).toHaveProperty('fechaRechazo', '2024-01-03');
  });
});
