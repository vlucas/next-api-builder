import type { NextApiRequest, NextApiResponse } from 'next';
import type { RequestOptions } from 'node-mocks-http';
import { createRequest, createResponse } from 'node-mocks-http';
import { z } from 'zod';
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
    const handler = apiRoute().get(async () => ({ foo: req.query.foo }));

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

  // With options
  it('should provide data types for schema', async () => {
    const testSchema = z
      .object({
        foo: z.string(),
      })
      .strict();
    const { req, res } = createTestRouteContext({
      method: 'GET',
      query: { foo: 'bar' },
    });
    // @ts-ignore
    const handler = apiRoute().get(async (req, res, data) => ({ foo: data.foo }), {
      validateQuery: testSchema,
    });

    await handler(req, res);

    expect(res._getJSONData().data).toEqual({ foo: 'bar' });
    expect(res._getStatusCode()).toEqual(200);
  });

  describe('data parameter', () => {
    it('should be populated for a GET request with query string data', async () => {
      const { req, res } = createTestRouteContext({
        method: 'GET',
        query: { foo: 'bar' },
      });
      // @ts-ignore
      const handler = apiRoute().get(async (req, res, data) => data);

      await handler(req, res);

      expect(res._getJSONData().data).toEqual({ foo: 'bar' });
      expect(res._getStatusCode()).toEqual(200);
    });

    it('should be populated for a POST requests with body data', async () => {
      const { req, res } = createTestRouteContext({
        method: 'POST',
        body: { foo: 'bar' },
      });
      // @ts-ignore
      const handler = apiRoute().post(async (req, res, data) => data);

      await handler(req, res);

      expect(res._getJSONData().data).toEqual({ foo: 'bar' });
      expect(res._getStatusCode()).toEqual(200);
    });

    it('should be populated for a POST requests with body data that is stringified', async () => {
      const { req, res } = createTestRouteContext({
        method: 'POST',
        // @ts-ignore
        body: JSON.stringify({ foo: 'bar' }),
      });
      // @ts-ignore
      const handler = apiRoute().post(async (req, res, data) => data);

      await handler(req, res);

      expect(res._getJSONData().data).toEqual({ foo: 'bar' });
      expect(res._getStatusCode()).toEqual(200);
    });

    it('should be populated for a PUT requests with body data', async () => {
      const { req, res } = createTestRouteContext({
        method: 'PUT',
        body: { foo: 'bar' },
      });
      // @ts-ignore
      const handler = apiRoute().put(async (req, res, data) => data);

      await handler(req, res);

      expect(res._getJSONData().data).toEqual({ foo: 'bar' });
      expect(res._getStatusCode()).toEqual(200);
    });

    it('should be populated for a PATCH requests with body data', async () => {
      const { req, res } = createTestRouteContext({
        method: 'PATCH',
        body: { foo: 'bar' },
      });
      // @ts-ignore
      const handler = apiRoute().patch(async (req, res, data) => data);

      await handler(req, res);

      expect(res._getJSONData().data).toEqual({ foo: 'bar' });
      expect(res._getStatusCode()).toEqual(200);
    });

    it('should be populated for a DELETE requests with body data', async () => {
      const { req, res } = createTestRouteContext({
        method: 'DELETE',
        body: { foo: 'bar' },
      });
      // @ts-ignore
      const handler = apiRoute().delete(async (req, res, data) => data);

      await handler(req, res);

      expect(res._getJSONData().data).toEqual({ foo: 'bar' });
      expect(res._getStatusCode()).toEqual(200);
    });
  });
});
