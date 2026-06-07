const catalogServices = require('../data/services');

function normalizeServiceId(service) {
  if (service && typeof service === 'object') {
    return Number(service.id);
  }
  return Number(service);
}

function resolveServices(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return { error: 'Selecciona al menos un servicio.' };
  }

  const serviceIds = input.map(normalizeServiceId);
  if (serviceIds.some(id => !Number.isInteger(id))) {
    return { error: 'Uno o más servicios no son válidos.' };
  }

  if (new Set(serviceIds).size !== serviceIds.length) {
    return { error: 'No se permiten servicios duplicados.' };
  }

  const services = serviceIds.map(id => catalogServices.find(service => service.id === id));
  if (services.some(service => !service)) {
    return { error: 'Uno o más servicios no encontrados.' };
  }

  return {
    serviceIds,
    services,
    totalPrice: services.reduce((sum, service) => sum + service.price, 0),
    totalDuration: services.reduce((sum, service) => sum + service.duration, 0),
  };
}

module.exports = { resolveServices };
