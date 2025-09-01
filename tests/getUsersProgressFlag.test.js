const { getUsers } = require('../src/controllers/userController');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const ProgresoResidente = require('../src/models/ProgresoResidente');

describe('getUsers tieneProgreso flag', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('adds flag for residentes y participantes', async () => {
    const users = [
      { _id: 'u1', rol: 'residente', toObject() { return { ...this }; } },
      { _id: 'u2', rol: 'participante', toObject() { return { ...this }; } },
      { _id: 'u3', rol: 'tutor', toObject() { return { ...this }; } }
    ];
    const populate = jest.fn();
    populate.mockReturnValueOnce({ populate }).mockResolvedValueOnce(users);
    jest.spyOn(User, 'find').mockReturnValue({ populate });
    jest.spyOn(ProgresoResidente, 'exists').mockImplementation(({ residente }) =>
      Promise.resolve(residente === 'u1')
    );

    const req = { user: { rol: 'administrador' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getUsers(req, res, jest.fn());

    const data = res.json.mock.calls[0][0].data;
    expect(data[0]).toHaveProperty('tieneProgreso', true);
    expect(data[1]).toHaveProperty('tieneProgreso', false);
    expect(data[2].tieneProgreso).toBeUndefined();
  });
});
