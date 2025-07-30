const { getAllProgreso } = require('../src/controllers/progresoController');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('getAllProgreso filtering', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('excludes progresos without residente', async () => {
    const progresoData = [
      { _id: 'p1', residente: { _id: 'u1' } },
      { _id: 'p2', residente: null }
    ];

    const lean = jest.fn().mockResolvedValue(progresoData);
    const populateActividades = jest.fn().mockReturnValue({ lean });
    const populateFase = jest.fn().mockReturnValue({ populate: populateActividades });
    const populateResidente = jest.fn().mockReturnValue({ populate: populateFase });

    jest.spyOn(ProgresoResidente, 'find').mockReturnValue({ populate: populateResidente });

    const req = { user: { rol: 'administrador' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getAllProgreso(req, res, jest.fn());

    expect(lean).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: [progresoData[0]] });
  });
});
