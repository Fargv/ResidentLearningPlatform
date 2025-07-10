const {
  getAccessCodes,
  createAccessCode,
  updateAccessCode,
  deleteAccessCode
} = require('../src/controllers/accessCodeController');
const AccessCode = require('../src/models/AccessCode');
const ErrorResponse = require('../src/utils/errorResponse');

describe('accessCodeController', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getAccessCodes devuelve todos los códigos', async () => {
    const list = [{ _id: 'a1' }];
    jest.spyOn(AccessCode, 'find').mockResolvedValue(list);

    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getAccessCodes(req, res, jest.fn());

    expect(AccessCode.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, count: 1, data: list });
  });

  test('createAccessCode crea un código', async () => {
    const created = { _id: 'a1' };
    jest.spyOn(AccessCode, 'create').mockResolvedValue(created);

    const req = { body: { codigo: 'C1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await createAccessCode(req, res, jest.fn());

    expect(AccessCode.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });

  test('updateAccessCode actualiza el código', async () => {
    const updated = { _id: 'a1', codigo: 'NUEVO' };
    jest.spyOn(AccessCode, 'findById').mockResolvedValue({});
    jest.spyOn(AccessCode, 'findByIdAndUpdate').mockResolvedValue(updated);

    const req = { params: { id: 'a1' }, body: { codigo: 'NUEVO' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await updateAccessCode(req, res, jest.fn());

    expect(AccessCode.findById).toHaveBeenCalledWith('a1');
    expect(AccessCode.findByIdAndUpdate).toHaveBeenCalledWith('a1', req.body, { new: true, runValidators: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  test('deleteAccessCode elimina el código', async () => {
    const remove = jest.fn().mockResolvedValue();
    jest.spyOn(AccessCode, 'findById').mockResolvedValue({ remove });

    const req = { params: { id: 'a1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await deleteAccessCode(req, res, jest.fn());

    expect(AccessCode.findById).toHaveBeenCalledWith('a1');
    expect(remove).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: {} });
  });
});
