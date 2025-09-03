const Joi = require('joi');
const { validationResult } = require('express-validator');

// Joi validation schemas
const schemas = {
  user: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).optional()
  }),

  news: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    content: Joi.string().min(10).required(),
    category: Joi.string().valid('berita', 'transfer', 'pertandingan', 'umum').required(),
    featured: Joi.boolean().optional()
  }),

  match: Joi.object({
    home_team: Joi.string().required(),
    away_team: Joi.string().required(),
    match_date: Joi.date().iso().required(),
    venue: Joi.string().required(),
    competition: Joi.string().required(),
    ticket_price: Joi.number().min(0).optional()
  }),

  ticket: Joi.object({
    match_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).max(10).required(),
    seat_type: Joi.string().valid('vip', 'tribun', 'standing').required()
  }),

  merchandise: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string().required(),
    stock: Joi.number().integer().min(0).required()
  }),

  player: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    position: Joi.string().required(),
    jersey_number: Joi.number().integer().min(1).max(99).required(),
    age: Joi.number().integer().min(16).max(50).optional(),
    nationality: Joi.string().optional()
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Express-validator error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  const xss = require('xss');
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  schemas,
  validate,
  handleValidationErrors,
  sanitizeInput
};