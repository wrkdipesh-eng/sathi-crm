const { PGlite } = require('@electric-sql/pglite');
const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');

async function main() {
  const db = new PGlite('./pgdata');
  const server = new PGLiteSocketServer({
    db,
    port: 3004,
    host: '127.0.0.1'
  });
  await server.start();
  console.log('PGlite server listening on 127.0.0.1:3004');
}

main().catch(console.error);
