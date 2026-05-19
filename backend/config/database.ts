// config/database.ts
// Configuración simplificada para Railway + PostgreSQL

export default ({ env }: { env: any }) => {
  // Si estamos en producción y tenemos DATABASE_URL, usar PostgreSQL
  if (env('NODE_ENV') === 'production' || env('DATABASE_URL')) {
    const rawUrl = env('DATABASE_URL');
    const normalizedUrl = rawUrl && rawUrl.startsWith('postgres://')
      ? rawUrl.replace(/^postgres:\/\//, 'postgresql://')
      : rawUrl;

    return {
      connection: {
        client: 'postgres',
        connection: {
          connectionString: normalizedUrl,
          ssl: env.bool('DATABASE_SSL', false) && {
            rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
          },
        },
        pool: {
          min: env.int('DATABASE_POOL_MIN', 2),
          max: env.int('DATABASE_POOL_MAX', 10),
        },
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };
  }

  // Para desarrollo local, usar configuración original o SQLite
  return {
    connection: {
      client: env('DATABASE_CLIENT', 'sqlite'),
      connection: env('DATABASE_CLIENT') === 'postgres' ? {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
      } : {
        filename: env('DATABASE_FILENAME', '.tmp/data.db'),
      },
      useNullAsDefault: true,
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};