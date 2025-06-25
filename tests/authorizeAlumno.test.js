const { authorize } = require('../src/middleware/auth');
const ErrorResponse = require('../src/utils/errorResponse');

describe('authorize middleware with alumno', () => {
  test('permite rol alumno cuando está incluido', () => {
    const middleware = authorize('residente', 'alumno');
    const req = { user: { rol: 'alumno' } };
    const next = jest.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('rechaza rol alumno cuando no está incluido', () => {
    const middleware = authorize('residente');
    const req = { user: { rol: 'alumno' } };
    const next = jest.fn();
    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ErrorResponse));
  });
});
