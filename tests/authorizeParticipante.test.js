const { authorize } = require('../src/middleware/auth');
const ErrorResponse = require('../src/utils/errorResponse');

describe('authorize middleware with participante', () => {
  test('permite rol participante cuando está incluido', () => {
    const middleware = authorize('residente', 'participante');
    const req = { user: { rol: 'participante' } };
    const next = jest.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('rechaza rol participante cuando no está incluido', () => {
    const middleware = authorize('residente');
    const req = { user: { rol: 'participante' } };
    const next = jest.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});
