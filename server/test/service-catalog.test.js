'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { resolveServices } = require('../src/utils/service-catalog');

test('resolveServices: error si la entrada no es un array', () => {
  assert.equal(resolveServices(null).error, 'Selecciona al menos un servicio.');
  assert.equal(resolveServices(undefined).error, 'Selecciona al menos un servicio.');
  assert.equal(resolveServices('1,2').error, 'Selecciona al menos un servicio.');
});

test('resolveServices: error si el array está vacío', () => {
  assert.equal(resolveServices([]).error, 'Selecciona al menos un servicio.');
});

test('resolveServices: error si algún id no es entero', () => {
  assert.equal(resolveServices(['abc']).error, 'Uno o más servicios no son válidos.');
  assert.equal(resolveServices([1.5]).error, 'Uno o más servicios no son válidos.');
});

test('resolveServices: error si hay ids duplicados', () => {
  assert.equal(resolveServices([1, 1]).error, 'No se permiten servicios duplicados.');
});

test('resolveServices: error si un id no existe en el catálogo', () => {
  assert.equal(resolveServices([9999]).error, 'Uno o más servicios no encontrados.');
});

test('resolveServices: acepta ids numéricos y calcula totales', () => {
  // Corte Clásico (id 1: 25€/45min) + Arreglo de Barba (id 4: 18€/30min)
  const r = resolveServices([1, 4]);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.serviceIds, [1, 4]);
  assert.equal(r.services.length, 2);
  assert.equal(r.totalPrice, 43);
  assert.equal(r.totalDuration, 75);
});

test('resolveServices: acepta objetos {id} además de números', () => {
  const r = resolveServices([{ id: 1 }, { id: 4 }]);
  assert.equal(r.error, undefined);
  assert.equal(r.totalPrice, 43);
  assert.equal(r.totalDuration, 75);
});

test('resolveServices: el precio NO depende de datos del cliente (anti-manipulación)', () => {
  // Aunque el cliente mande precio falso, se ignora: solo cuenta el id.
  const r = resolveServices([{ id: 1, price: 0.01, duration: 1 }]);
  assert.equal(r.totalPrice, 25);
  assert.equal(r.totalDuration, 45);
});
