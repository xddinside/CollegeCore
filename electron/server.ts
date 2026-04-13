import { createServer, type Server } from 'node:http';
import path from 'node:path';
import next from 'next';

export type StartedNextServer = {
  port: number;
  url: string;
  close: () => Promise<void>;
};

export async function startNextServer(port: number): Promise<StartedNextServer> {
  const rootDir = path.resolve(__dirname, '../..');
  const app = next({
    dev: false,
    dir: rootDir,
    hostname: '127.0.0.1',
    port,
  });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((request, response) => {
    void handle(request, response);
  });

  await listen(server, port);

  return {
    port,
    url: `http://127.0.0.1:${port}`,
    close: () => closeServer(server),
  };
}

function listen(server: Server, port: number) {
  return new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function closeServer(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
