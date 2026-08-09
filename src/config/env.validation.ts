import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  HOST: Joi.alternatives()
    .try(Joi.string().hostname(), Joi.string().ip())
    .default('127.0.0.1'),
  PORT: Joi.number().port().default(9999),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().allow('').default(''),

  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().port().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().allow('').required(),
  POSTGRES_DATABASE: Joi.string().required(),
  POSTGRES_SYNCHRONIZE: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),
  POSTGRES_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
  POSTGRES_MIGRATIONS_RUN: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),

  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXP_SECONDS: Joi.number().integer().positive().default(900),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXP_SECONDS: Joi.number().integer().positive().default(604800),

  ARGON2_MEMORY_COST_KILOBYTE: Joi.number().integer().min(8192).default(19456),
  ARGON2_TIME_COST: Joi.number().integer().min(2).default(2),
  ARGON2_PARALLELISM_LANE: Joi.number().integer().min(1).default(1),
});
