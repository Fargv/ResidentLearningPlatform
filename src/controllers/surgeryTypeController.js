const ErrorResponse = require('../utils/errorResponse');
const SurgeryType = require('../models/SurgeryType');

// @desc    Obtener todos los tipos de cirugía
// @route   GET /api/surgery-types
// @access  Private/Admin
exports.getSurgeryTypes = async (req, res, next) => {
  try {
    const types = await SurgeryType.find();
    res.status(200).json({ success: true, count: types.length, data: types });
  } catch (err) {
    next(err);
  }
};

// @desc    Obtener un tipo de cirugía por ID
// @route   GET /api/surgery-types/:id
// @access  Private/Admin
exports.getSurgeryType = async (req, res, next) => {
  try {
    const type = await SurgeryType.findById(req.params.id);
    if (!type) {
      return next(new ErrorResponse('Tipo de cirugía no encontrado', 404));
    }
    res.status(200).json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

// @desc    Crear un tipo de cirugía
// @route   POST /api/surgery-types
// @access  Private/Admin
exports.createSurgeryType = async (req, res, next) => {
  try {
    const type = await SurgeryType.create(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

// @desc    Actualizar un tipo de cirugía
// @route   PUT /api/surgery-types/:id
// @access  Private/Admin
exports.updateSurgeryType = async (req, res, next) => {
  try {
    let type = await SurgeryType.findById(req.params.id);
    if (!type) {
      return next(new ErrorResponse('Tipo de cirugía no encontrado', 404));
    }
    type = await SurgeryType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

// @desc    Eliminar un tipo de cirugía
// @route   DELETE /api/surgery-types/:id
// @access  Private/Admin
exports.deleteSurgeryType = async (req, res, next) => {
  try {
    const type = await SurgeryType.findById(req.params.id);
    if (!type) {
      return next(new ErrorResponse('Tipo de cirugía no encontrado', 404));
    }
    await type.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
