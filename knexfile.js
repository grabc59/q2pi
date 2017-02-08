'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: 'postgres://localhost/q2pi'
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }
};
