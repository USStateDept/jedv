// Update with your config settings.
module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host     : 'localhost',
      database: 'bids_development',
      user:     'postgres',
      password: 'eDipl0macy2016!',
      charset  : 'utf8',
      debug: true
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },
  
  ci: {
    client: 'postgresql',
    connection: {
      host     : process.env.CI_DB_HOST_NAME,
      user     : process.env.CI_DB_USER_NAME,
      password : process.env.CI_DB_PASSWORD,
      database : process.env.CI_DATABASE,
      charset  : 'utf8',
      debug: true
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      host     : process.env.DB_HOST_NAME,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER_NAME,
      password: process.env.DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host     : process.env.DB_HOST_NAME,
      database: process.env.DB_NAME,
      user:     process.env.DB_USER_NAME,
      password: process.env.DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
