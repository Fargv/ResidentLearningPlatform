const assert = require('assert');
const { updatePhaseStatus } = require('../src/controllers/progresoController');

// Stub models
const Fase = require('../src/models/Fase');
const ProgresoResidente = require('../src/models/ProgresoResidente');

(async () => {
  let nextProgreso;
  // stubs
  Fase.findOne = () => ({ sort: async () => ({ _id: 'fase2', orden: 2 }) });
  ProgresoResidente.findOne = async () => nextProgreso;

  const progresoActual = {
    actividades: [ { estado: 'validado' }, { estado: 'validado' } ],
    estadoGeneral: 'en progreso',
    residente: 'res1',
    fase: { _id: 'fase1', orden: 1 },
    async save() { this.saved = true; },
    async populate() { return this; }
  };
  nextProgreso = {
    estadoGeneral: 'bloqueada',
    residente: 'res1',
    fase: { _id: 'fase2', orden: 2 },
    async save() { this.saved = true; }
  };

  await updatePhaseStatus(progresoActual);

  assert.strictEqual(progresoActual.estadoGeneral, 'validado');
  assert.ok(progresoActual.saved);
  assert.strictEqual(nextProgreso.estadoGeneral, 'en progreso');
  assert.ok(nextProgreso.saved);

  // Case where not all validated
  const progresoNoValidado = {
    actividades: [ { estado: 'completado' }, { estado: 'validado' } ],
    estadoGeneral: 'en progreso',
    residente: 'res1',
    fase: { _id: 'fase1', orden: 1 },
    async save() { this.saved = true; },
    async populate() { return this; }
  };
  nextProgreso = { estadoGeneral: 'bloqueada', async save() { this.saved = true; } };
  await updatePhaseStatus(progresoNoValidado);
  assert.strictEqual(progresoNoValidado.estadoGeneral, 'en progreso');
  assert.ok(!progresoNoValidado.saved);
  assert.strictEqual(nextProgreso.estadoGeneral, 'bloqueada');
  console.log('All tests passed');
})();