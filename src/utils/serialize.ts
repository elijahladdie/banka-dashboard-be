import { Prisma } from '@prisma/client';

export function serializeResult(obj: any): any {
  const visited = new WeakSet<object>();

  const serialize = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(serialize);
    }

    if (value && typeof value === 'object') {
      if (value instanceof Prisma.Decimal) {
        return value.toString();
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (visited.has(value)) {
        return '[Circular]';
      }

      visited.add(value);
      const result: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        const nested = value[key];
        if (typeof nested === 'bigint') {
          result[key] = nested.toString();
        } else {
          result[key] = serialize(nested);
        }
      }
      return result;
    }

    return value;
  };

  return serialize(obj);
}
