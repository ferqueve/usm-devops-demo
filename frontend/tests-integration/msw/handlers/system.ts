import { http, HttpResponse } from 'msw';

// El backend de "sistema" pasa por actuator, fuera del prefijo /api/v1.
const ACTUATOR = 'http://localhost:8080/actuator';

export const systemHandlers = [
  http.get(`${ACTUATOR}/health`, () =>
    HttpResponse.json({ status: 'UP', components: { db: { status: 'UP' } } })
  ),
  http.get(`${ACTUATOR}/info`, () =>
    HttpResponse.json({ app: { name: 'UTEC Space Manager', version: '1.0.0' } })
  ),
  http.get(`${ACTUATOR}/metrics`, () =>
    HttpResponse.json({ names: ['jvm.memory.used', 'http.server.requests'] })
  ),
  http.get(`${ACTUATOR}/metrics/:metric`, () =>
    HttpResponse.json({
      name: 'jvm.memory.used',
      measurements: [{ statistic: 'VALUE', value: 12345 }],
    })
  ),
  http.get(`${ACTUATOR}/httpexchanges`, () =>
    HttpResponse.json({ exchanges: [] })
  ),
  http.get(`${ACTUATOR}/mappings`, () =>
    HttpResponse.json({ contexts: {} })
  ),
  http.get(`${ACTUATOR}/liquibase`, () =>
    HttpResponse.json({ contexts: {} })
  ),
  http.get(`${ACTUATOR}/loggers`, () =>
    HttpResponse.json({ loggers: {} })
  ),
  http.get(`${ACTUATOR}/logfile`, () =>
    HttpResponse.text('log content')
  ),
  http.get('http://localhost:8080/v3/api-docs', () =>
    HttpResponse.json({ openapi: '3.0.0', paths: {} })
  ),
];
