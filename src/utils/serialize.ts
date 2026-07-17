import { Prisma } from '@prisma/client';

export function serializeResult<T>(obj: T): unknown {
  const visited = new WeakSet<object>();

  const serialize = (value: unknown): unknown => {
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
      const result: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>)) {
          const nested = (value as Record<string, unknown>)[key];
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
