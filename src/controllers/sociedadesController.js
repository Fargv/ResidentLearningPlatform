const Sociedades = require('../models/Sociedades');

exports.crearSociedad = async (req, res) => {
  try {
    const nueva = await Sociedades.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerSociedades = async (req, res) => {
  try {
    const todas = await Sociedades.find();
    res.json(todas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerSociedad = async (req, res) => {
  try {
    const item = await Sociedades.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrada' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarSociedad = async (req, res) => {
  try {
    const actualizada = await Sociedades.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarSociedad = async (req, res) => {
  try {
    await Sociedades.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Sociedad eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
