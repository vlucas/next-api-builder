# Next.js API Builder

An easy way to build API routes in Next.js with the right defaults.

Features:

- Fully typed with TypeScript
- Built-in schema validation with zod.js
- Automatic `OPTIONS` response based on defined HTTP methods
- Automatic `HEAD` response based on your defined `GET` handler
- Automatic `405: Method Not Found` response for requests to methods not handled

## TypeScript Usage

```javascript
import { apiRoute } from 'next-api-builder';
import type { NextApiRequest, NextApiResponse } from 'next';

export default apiRoute()
  .get(async (req: NextApiRequest, res: NextApiResponse) => {
    return { foo: 'bar!' };
  })
  .post(async (req: NextApiRequest, res: NextApiResponse) => {
    // Insert data into some DB...
    return req.body || { id: 0, title: 'Sample record' };
  });
```

## JavaScript Usage

```javascript
import { apiRoute } from 'next-api-builder';

export default apiRoute()
  .get(async (req, res) => {
    return { foo: 'bar!' };
  })
  .post(async (req, res) => {
    // Insert data into some DB...
    return req.body || { id: 0, title: 'Sample record' };
  });
```
