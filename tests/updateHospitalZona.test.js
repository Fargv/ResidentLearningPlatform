const { updateHospital } = require('../src/controllers/hospitalController');
const Hospital = require('../src/models/Hospital');
const User = require('../src/models/User');
const { createAuditLog } = require('../src/utils/auditLog');
const ErrorResponse = require('../src/utils/errorResponse');

jest.mock('../src/utils/auditLog', () => ({ createAuditLog: jest.fn() }));

describe('updateHospital zona cascade', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('updates users zona when hospital zona changes', async () => {
    const oldHospital = { _id: 'h1', zona: 'NORTE', nombre: 'Hosp' };
    jest.spyOn(Hospital, 'findById').mockResolvedValue(oldHospital);
    jest
      .spyOn(Hospital, 'findByIdAndUpdate')
      .mockResolvedValue({ ...oldHospital, zona: 'CENTRO' });
    const updateMany = jest
      .spyOn(User, 'updateMany')
      .mockResolvedValue({ acknowledged: true });

    const req = {
      params: { id: 'h1' },
      body: { zona: 'CENTRO' },
      user: { _id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateHospital(req, res, jest.fn());

    expect(updateMany).toHaveBeenCalledWith({ hospital: 'h1' }, { zona: 'CENTRO' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { ...oldHospital, zona: 'CENTRO' } });
  });

  test('does not update users when zona unchanged', async () => {
    const oldHospital = { _id: 'h1', zona: 'CENTRO', nombre: 'Hosp' };
    jest.spyOn(Hospital, 'findById').mockResolvedValue(oldHospital);
    jest
      .spyOn(Hospital, 'findByIdAndUpdate')
      .mockResolvedValue(oldHospital);
    const updateMany = jest.spyOn(User, 'updateMany').mockResolvedValue({});

    const req = {
      params: { id: 'h1' },
      body: { nombre: 'New Name' },
      user: { _id: 'admin' },
      ip: '::1'
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateHospital(req, res, jest.fn());

    expect(updateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
