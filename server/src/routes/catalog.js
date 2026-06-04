const express = require('express');
const router = express.Router();
const services = require('../data/services');
const stylists = require('../data/stylists');

router.get('/services', (_req, res) => {
  res.json(services);
});

router.get('/stylists', (_req, res) => {
  res.json(stylists);
});

module.exports = router;
