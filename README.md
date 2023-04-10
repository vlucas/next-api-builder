# Next.js API Builder

An easy way to build API routes in Next.js with the right defaults.

Features:

- Fully typed with TypeScript
- Built-in schema validation with [Zod](https://github.com/colinhacks/zod)
- Automatic `400: Bad Request` response when a Zod schema is supplied and the input data fails validation
- Automatic `OPTIONS` response based on defined HTTP methods
- Automatic `HEAD` response based on your defined `GET` handler
- Automatic `405: Method Not Found` response for requests to methods not handled

## Installation

Install with NPM:

```
npm i next-api-builder
```

Or with Yarn:

```
yarn add next-api-builder
```

## Usage

```javascript
import { apiRoute } from 'next-api-builder';
import type { NextApiRequest, NextApiResponse } from 'next/types';

export default apiRoute()
  .get(async (req: NextApiRequest, res: NextApiResponse) => {
    return { foo: 'bar!' };
  })
  .post(async (req: NextApiRequest, res: NextApiResponse) => {
    // Insert data into some DB...
    return req.body || { id: 0, title: 'Sample record' };
  });
```

## Using Zod.js for Runtime Validation

Next API builder uses [Zod](https://github.com/colinhacks/zod) for runtime validation of a request body and/or query
string parameters.

You can use a second optional object literal parameter when defining routes to supply a Zod schema.

- `validateBody` - Parse the body as an object (from JSON, etc.) and run validations on it
- `validateQuery` - Parse the query string and run validations on it

```javascript
import { apiRoute } from 'next-api-builder';
import type { NextApiRequest, NextApiResponse } from 'next/types';

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});

type TSchema = z.infer<typeof schema>;

export default apiRoute().post(
  async (req: NextApiRequest, res: NextApiResponse, data: TSchema) => {
    // Insert data into some DB...
    return data || { id: 0, title: 'Sample record' };
  },
  { validateBody: schema }, // Use 'validateBody' or 'validateQuery' with a Zod schema object
);
```

If the incoming HTTP Request fails validation, a `400: Bad Request` will be returned to the user with the field level
errors and messages returned from Zod, formatted to JSON.
