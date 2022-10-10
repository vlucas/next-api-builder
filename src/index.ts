import { z, ZodSchema } from 'zod';

// Types
import type { NextApiRequest, NextApiResponse } from 'next';

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
  validateBody?: ZodSchema<TSchema>;
  validateQuery?: ZodSchema<TSchema>;
};
export type THttpHandler = <T>(req: NextApiRequest, res: NextApiResponse, data?: T) => Promise<any>;
export type TMethodHandler = {
  handler: THttpHandler;
  options?: THttpHandlerOptions;
};

type TSchema = unknown;
type TValidatePath = 'body' | 'query';
export async function validateSchema<T>(
  schema: ZodSchema<TSchema>,
  req: NextApiRequest,
  path: TValidatePath,
): Promise<T> {
  return (await schema.parseAsync(req[path])) as Promise<T>;
}

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

      let schemaData;
      // Run validations, if any
      if (methodHandler.options?.validateQuery) {
        type TSchema = z.infer<typeof methodHandler.options.validateQuery>;
        schemaData = await validateSchema<TSchema>(
          methodHandler.options.validateQuery,
          req,
          'query',
        );
      }
      if (methodHandler.options?.validateBody) {
        type TSchema = z.infer<typeof methodHandler.options.validateBody>;
        schemaData = await validateSchema<TSchema>(methodHandler.options.validateBody, req, 'body');
      }

      const json = await methodHandler.handler(req, res, schemaData);

      if (json) {
        return sendJSONSuccess(res, json);
      }
    } catch (err) {
      // Handle ZodError (validation failure)
      if (err instanceof z.ZodError) {
        const e = err as z.ZodError;

        const errorJSON = {
          fieldErrors: e.flatten().fieldErrors,
        };
        const statusCode: number = 400;

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
