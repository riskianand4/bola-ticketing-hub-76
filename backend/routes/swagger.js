const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Persiraja API',
      version: '1.0.0',
      description: 'Complete API documentation for Persiraja backend',
      contact: {
        name: 'Persiraja Team',
        email: 'admin@persiraja.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            avatar_url: { type: 'string' },
            email_verified: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        News: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string', enum: ['berita', 'transfer', 'pertandingan', 'umum'] },
            image_url: { type: 'string' },
            featured: { type: 'boolean' },
            views: { type: 'integer' },
            likes: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            home_team: { type: 'string' },
            away_team: { type: 'string' },
            match_date: { type: 'string', format: 'date-time' },
            venue: { type: 'string' },
            competition: { type: 'string' },
            status: { type: 'string', enum: ['scheduled', 'live', 'finished', 'cancelled'] },
            home_score: { type: 'integer' },
            away_score: { type: 'integer' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Persiraja API Documentation'
}));

// JSON endpoint for API specs
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

module.exports = router;