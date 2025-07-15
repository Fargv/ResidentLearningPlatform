const ErrorResponse = require('../utils/errorResponse');
const AccessCode = require('../models/AccessCode');

// @desc    Obtener todos los códigos de acceso
// @route   GET /api/access-codes
// @access  Private/Admin
exports.getAccessCodes = async (req, res, next) => {
  try {
    const codes = await AccessCode.find();
    res.status(200).json({ success: true, count: codes.length, data: codes });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener un código de acceso por ID
// @route   GET /api/access-codes/:id
// @access  Private/Admin
exports.getAccessCode = async (req, res, next) => {
  try {
    const code = await AccessCode.findById(req.params.id);
    if (!code) {
      return next(new ErrorResponse('Código de acceso no encontrado', 404));
    }
    res.status(200).json({ success: true, data: code });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear un código de acceso
// @route   POST /api/access-codes
// @access  Private/Admin
exports.createAccessCode = async (req, res, next) => {
  try {
    const code = await AccessCode.create(req.body);
    res.status(201).json({ success: true, data: code });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar un código de acceso
// @route   PUT /api/access-codes/:id
// @access  Private/Admin
exports.updateAccessCode = async (req, res, next) => {
  try {
    let code = await AccessCode.findById(req.params.id);
    if (!code) {
      return next(new ErrorResponse('Código de acceso no encontrado', 404));
    }
    code = await AccessCode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: code });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un código de acceso
// @route   DELETE /api/access-codes/:id
// @access  Private/Admin
exports.deleteAccessCode = async (req, res, next) => {
  try {
    const code = await AccessCode.findById(req.params.id);
    if (!code) {
      return next(new ErrorResponse('Código de acceso no encontrado', 404));
    }
    await code.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
