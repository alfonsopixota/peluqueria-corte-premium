// Validaciones ligeras de entrada compartidas por las rutas (sin dependencias).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

module.exports = { isValidEmail };
