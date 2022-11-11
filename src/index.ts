import { z, ZodSchema, ZodTypeAny, ZodError } from 'zod';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';
// Mock AxiosError instead of installing package as a devDep (only what we need)
interface AxiosError extends Error {
  isAxiosError: boolean;
  response: {
    data: any;
  };
}

const NODE_ENV: string = process.env.NODE_ENV || '';

/**
 * Send JSON content as a response
 */
export function sendJSON(res: NextApiResponse, json: any, statusCode: number = 200): void {
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).send(JSON.stringify(json));
}

/**
 * SUCCESS JSON Response
 */
export function sendJSONSuccess(res: NextApiResponse, json: any, statusCode: number = 200): void {
  return sendJSON(
    res,
    {
      meta: {
        success: true,
        statusCode,
        dtResponse: new Date(),
      },
      data: json,
    },
    statusCode,
  );
}

/**
 * ERROR JSON Response
 */
export function sendJSONErrors(res: NextApiResponse, json: any, statusCode: number = 500): void {
  return sendJSON(
    res,
    {
      ...json,
      meta: {
        success: false,
        statusCode,
        dtResponse: new Date(),
      },
    },
    statusCode,
  );
}

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
export type HandlerResponse = any;
export type HandlerFunction = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<HandlerResponse>;
export type THttpHandlerOptions = {
  validateBody?: ZodSchema;
  validateQuery?: ZodSchema;
};
export type THttpHandler = <T>(req: NextApiRequest, res: NextApiResponse, data?: T) => Promise<any>;
export type TMethodHandler = {
  handler: THttpHandler;
  options?: THttpHandlerOptions;
};

/**
 * API route builder
 */
export function apiRoute() {
  const handlers: { [key: string]: any } = {};

  async function _apiRouteHandler(req: NextApiRequest, res: NextApiResponse<any>) {
    let errorStatusCode = 500;
    const method: string = req.method ? req.method.toUpperCase() : 'GET';

    try {
      let methodHandler = handlers[method];

      // 'HEAD' requests use 'GET' if not separately specified
      if (method === 'HEAD' && !methodHandler && handlers['GET'] !== undefined) {
        methodHandler = handlers['GET'];
      }

      // Automatic 'OPTIONS' response based on specified methods
      if (method === 'OPTIONS') {
        res.status(204);
        res.setHeader('Allow', Object.keys(handlers).join(', '));
        return res.end();
      }

      // Invalid request method
      if (!methodHandler) {
        errorStatusCode = 405;
        throw new Error(
          'Method Not Allowed. Supported HTTP methods: ' + Object.keys(handlers).join(', '),
        );
      }

      let schema: ZodTypeAny;
      let schemaData;
      // Run validations, if any
      if (methodHandler.options?.validateQuery) {
        schema = methodHandler.options.validateQuery;
        schemaData = await schema.parseAsync(req.query);
      }
      if (methodHandler.options?.validateBody) {
        schema = methodHandler.options.validateBody;
        let body = req.body;

        try {
          if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
          }
        } catch (e) {
          console.log('Unable to JSON parse body', req.body);
        }

        schemaData = await schema.parseAsync(body);
      }

      // Takes a ZodType | undefined union and spits out either an inferred
      // type for the schema, or undefined. This allows us to more smoothly
      // handle type inference for optional schemas:
      // type OptionalSchemaType<S> = S extends ZodTypeAny ? z.infer<S> : undefined;

      type TSchema = z.infer<typeof schema>;
      const json = await methodHandler.handler(req, res, schemaData as TSchema);

      if (json) {
        return sendJSONSuccess(res, json);
      }
    } catch (err) {
      // Handle ZodError (validation failure)
      if (err instanceof ZodError) {
        const e = err as ZodError;

        const errorJSON = {
          title: 'A validation error has occured',
          errors: e.format(),
        };
        const statusCode = 400;

        return sendJSONErrors(res, errorJSON, statusCode);
      }

      // Handle Axios error (sadly common fetch library)
      // @ts-ignore
      if (err.isAxiosError) {
        const e = err as AxiosError;
        const statusCode = 400;

        const title = 'An HTTP request error has occurred';
        const errorJSON = {
          data: e.response && e.response.data ? e.response.data : undefined,
          title,
          stack: NODE_ENV === 'development' && e.stack ? e.stack.split('\n') : undefined,
          type: e.name,
          detail: e.message,
        };

        return sendJSONErrors(res, errorJSON, statusCode);
      }

      const e = err as Error;
      let parameters;
      const title = 'An error has occurred';

      const statusCode: number = errorStatusCode;
      const errorJSON = {
        title,
        errors: [
          {
            message: e.message,
            stack: NODE_ENV === 'development' && e.stack ? e.stack.split('\n') : undefined,
            type: e.name,
            parameters,
          },
        ],
        detail: e.message,
      };

      return sendJSONErrors(res, errorJSON, statusCode);
    }
  }

  // HTTP Method handlers...
  _apiRouteHandler.head = (handler: THttpHandler, options?: THttpHandlerOptions) => {
    handlers['HEAD'] = { handler, options };
    return _apiRouteHandler;
  };
  _apiRouteHandler.get = (handler: THttpHandler, options?: THttpHandlerOptions) => {
    handlers['GET'] = { handler, options };
    return _apiRouteHandler;
  };
  _apiRouteHandler.post = (handler: THttpHandler, options?: THttpHandlerOptions) => {
    handlers['POST'] = { handler, options };
    return _apiRouteHandler;
  };
  _apiRouteHandler.put = (handler: THttpHandler, options?: THttpHandlerOptions) => {
    handlers['PUT'] = { handler, options };
    return _apiRouteHandler;
  };
  _apiRouteHandler.patch = (handler: THttpHandler, options?: THttpHandlerOptions) => {
    handlers['PATCH'] = { handler, options };
    return _apiRouteHandler;
  };
  _apiRouteHandler.delete = (handler: THttpHandler, options?: THttpHandlerOptions) => {
    handlers['DELETE'] = { handler, options };
    return _apiRouteHandler;
  };

  return _apiRouteHandler;
}
