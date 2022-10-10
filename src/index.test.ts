import type { NextApiRequest, NextApiResponse } from 'next';
import type { RequestOptions } from 'node-mocks-http';
import { createRequest, createResponse } from 'node-mocks-http';
import { apiRoute } from './index';

export const createTestRouteContext = (opts: RequestOptions) => ({
  req: createRequest<NextApiRequest>(opts),
  res: createResponse<NextApiResponse>(),
});

describe('Next.js API Builder', () => {
  it('should return an API handler', async () => {
    const { req, res } = createTestRouteContext({
      method: 'GET',
      query: { foo: 'bar' },
    });
    const handler = apiRoute().get(async () => {
      return { foo: req.query.foo };
    });

    await handler(req, res);

    expect(res._getJSONData().data).toEqual({ foo: 'bar' });
    expect(res._getStatusCode()).toEqual(200);
  });

  it('should return an automatic HEAD response when GET handler is supplied', async () => {
    const stubGetHandler = jest.fn();
    const { req, res } = createTestRouteContext({
      method: 'HEAD',
    });
    const handler = apiRoute().get(stubGetHandler);

    await handler(req, res);

    expect(res._getStatusCode()).toEqual(200);
  });

  it('should respond to OPTIONS requests with correct Allow header', async () => {
    const stubGetHandler = jest.fn();
    const { req, res } = createTestRouteContext({
      method: 'OPTIONS',
    });
    const handler = apiRoute().get(stubGetHandler).post(stubGetHandler);

    await handler(req, res);

    expect(res._getHeaders()).toEqual({ allow: 'GET, POST' });
    expect(res._getStatusCode()).toEqual(204);
  });

  it('should respond with a 405 result when request method is not handled', async () => {
    const stubGetHandler = jest.fn();
    const { req, res } = createTestRouteContext({
      method: 'PATCH',
    });
    const handler = apiRoute().get(stubGetHandler);

    await handler(req, res);

    expect(res._getStatusCode()).toEqual(405);
  });
});
