
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model WebinarRegistration
 * 
 */
export type WebinarRegistration = $Result.DefaultSelection<Prisma.$WebinarRegistrationPayload>
/**
 * Model AvailabilityDay
 * 
 */
export type AvailabilityDay = $Result.DefaultSelection<Prisma.$AvailabilityDayPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more WebinarRegistrations
 * const webinarRegistrations = await prisma.webinarRegistration.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more WebinarRegistrations
   * const webinarRegistrations = await prisma.webinarRegistration.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.webinarRegistration`: Exposes CRUD operations for the **WebinarRegistration** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WebinarRegistrations
    * const webinarRegistrations = await prisma.webinarRegistration.findMany()
    * ```
    */
  get webinarRegistration(): Prisma.WebinarRegistrationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.availabilityDay`: Exposes CRUD operations for the **AvailabilityDay** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AvailabilityDays
    * const availabilityDays = await prisma.availabilityDay.findMany()
    * ```
    */
  get availabilityDay(): Prisma.AvailabilityDayDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.14.0
   * Query Engine version: 717184b7b35ea05dfa71a3236b7af656013e1e49
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    WebinarRegistration: 'WebinarRegistration',
    AvailabilityDay: 'AvailabilityDay'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "webinarRegistration" | "availabilityDay"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      WebinarRegistration: {
        payload: Prisma.$WebinarRegistrationPayload<ExtArgs>
        fields: Prisma.WebinarRegistrationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebinarRegistrationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebinarRegistrationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>
          }
          findFirst: {
            args: Prisma.WebinarRegistrationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebinarRegistrationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>
          }
          findMany: {
            args: Prisma.WebinarRegistrationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>[]
          }
          create: {
            args: Prisma.WebinarRegistrationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>
          }
          createMany: {
            args: Prisma.WebinarRegistrationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebinarRegistrationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>[]
          }
          delete: {
            args: Prisma.WebinarRegistrationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>
          }
          update: {
            args: Prisma.WebinarRegistrationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>
          }
          deleteMany: {
            args: Prisma.WebinarRegistrationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebinarRegistrationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WebinarRegistrationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>[]
          }
          upsert: {
            args: Prisma.WebinarRegistrationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebinarRegistrationPayload>
          }
          aggregate: {
            args: Prisma.WebinarRegistrationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebinarRegistration>
          }
          groupBy: {
            args: Prisma.WebinarRegistrationGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebinarRegistrationGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebinarRegistrationCountArgs<ExtArgs>
            result: $Utils.Optional<WebinarRegistrationCountAggregateOutputType> | number
          }
        }
      }
      AvailabilityDay: {
        payload: Prisma.$AvailabilityDayPayload<ExtArgs>
        fields: Prisma.AvailabilityDayFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AvailabilityDayFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AvailabilityDayFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>
          }
          findFirst: {
            args: Prisma.AvailabilityDayFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AvailabilityDayFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>
          }
          findMany: {
            args: Prisma.AvailabilityDayFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>[]
          }
          create: {
            args: Prisma.AvailabilityDayCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>
          }
          createMany: {
            args: Prisma.AvailabilityDayCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AvailabilityDayCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>[]
          }
          delete: {
            args: Prisma.AvailabilityDayDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>
          }
          update: {
            args: Prisma.AvailabilityDayUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>
          }
          deleteMany: {
            args: Prisma.AvailabilityDayDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AvailabilityDayUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AvailabilityDayUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>[]
          }
          upsert: {
            args: Prisma.AvailabilityDayUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityDayPayload>
          }
          aggregate: {
            args: Prisma.AvailabilityDayAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAvailabilityDay>
          }
          groupBy: {
            args: Prisma.AvailabilityDayGroupByArgs<ExtArgs>
            result: $Utils.Optional<AvailabilityDayGroupByOutputType>[]
          }
          count: {
            args: Prisma.AvailabilityDayCountArgs<ExtArgs>
            result: $Utils.Optional<AvailabilityDayCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    webinarRegistration?: WebinarRegistrationOmit
    availabilityDay?: AvailabilityDayOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model WebinarRegistration
   */

  export type AggregateWebinarRegistration = {
    _count: WebinarRegistrationCountAggregateOutputType | null
    _avg: WebinarRegistrationAvgAggregateOutputType | null
    _sum: WebinarRegistrationSumAggregateOutputType | null
    _min: WebinarRegistrationMinAggregateOutputType | null
    _max: WebinarRegistrationMaxAggregateOutputType | null
  }

  export type WebinarRegistrationAvgAggregateOutputType = {
    id: number | null
  }

  export type WebinarRegistrationSumAggregateOutputType = {
    id: number | null
  }

  export type WebinarRegistrationMinAggregateOutputType = {
    id: number | null
    email: string | null
    parentName: string | null
    parentEmail: string | null
    parentPhone: string | null
    studentName: string | null
    grade: string | null
    schoolName: string | null
    program: string | null
    preferredTime: string | null
    createdAt: Date | null
    approved: boolean | null
  }

  export type WebinarRegistrationMaxAggregateOutputType = {
    id: number | null
    email: string | null
    parentName: string | null
    parentEmail: string | null
    parentPhone: string | null
    studentName: string | null
    grade: string | null
    schoolName: string | null
    program: string | null
    preferredTime: string | null
    createdAt: Date | null
    approved: boolean | null
  }

  export type WebinarRegistrationCountAggregateOutputType = {
    id: number
    email: number
    parentName: number
    parentEmail: number
    parentPhone: number
    studentName: number
    grade: number
    schoolName: number
    program: number
    preferredTime: number
    createdAt: number
    approved: number
    _all: number
  }


  export type WebinarRegistrationAvgAggregateInputType = {
    id?: true
  }

  export type WebinarRegistrationSumAggregateInputType = {
    id?: true
  }

  export type WebinarRegistrationMinAggregateInputType = {
    id?: true
    email?: true
    parentName?: true
    parentEmail?: true
    parentPhone?: true
    studentName?: true
    grade?: true
    schoolName?: true
    program?: true
    preferredTime?: true
    createdAt?: true
    approved?: true
  }

  export type WebinarRegistrationMaxAggregateInputType = {
    id?: true
    email?: true
    parentName?: true
    parentEmail?: true
    parentPhone?: true
    studentName?: true
    grade?: true
    schoolName?: true
    program?: true
    preferredTime?: true
    createdAt?: true
    approved?: true
  }

  export type WebinarRegistrationCountAggregateInputType = {
    id?: true
    email?: true
    parentName?: true
    parentEmail?: true
    parentPhone?: true
    studentName?: true
    grade?: true
    schoolName?: true
    program?: true
    preferredTime?: true
    createdAt?: true
    approved?: true
    _all?: true
  }

  export type WebinarRegistrationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebinarRegistration to aggregate.
     */
    where?: WebinarRegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebinarRegistrations to fetch.
     */
    orderBy?: WebinarRegistrationOrderByWithRelationInput | WebinarRegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebinarRegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebinarRegistrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebinarRegistrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WebinarRegistrations
    **/
    _count?: true | WebinarRegistrationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WebinarRegistrationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WebinarRegistrationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebinarRegistrationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebinarRegistrationMaxAggregateInputType
  }

  export type GetWebinarRegistrationAggregateType<T extends WebinarRegistrationAggregateArgs> = {
        [P in keyof T & keyof AggregateWebinarRegistration]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebinarRegistration[P]>
      : GetScalarType<T[P], AggregateWebinarRegistration[P]>
  }




  export type WebinarRegistrationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebinarRegistrationWhereInput
    orderBy?: WebinarRegistrationOrderByWithAggregationInput | WebinarRegistrationOrderByWithAggregationInput[]
    by: WebinarRegistrationScalarFieldEnum[] | WebinarRegistrationScalarFieldEnum
    having?: WebinarRegistrationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebinarRegistrationCountAggregateInputType | true
    _avg?: WebinarRegistrationAvgAggregateInputType
    _sum?: WebinarRegistrationSumAggregateInputType
    _min?: WebinarRegistrationMinAggregateInputType
    _max?: WebinarRegistrationMaxAggregateInputType
  }

  export type WebinarRegistrationGroupByOutputType = {
    id: number
    email: string
    parentName: string
    parentEmail: string
    parentPhone: string
    studentName: string
    grade: string
    schoolName: string
    program: string
    preferredTime: string
    createdAt: Date
    approved: boolean
    _count: WebinarRegistrationCountAggregateOutputType | null
    _avg: WebinarRegistrationAvgAggregateOutputType | null
    _sum: WebinarRegistrationSumAggregateOutputType | null
    _min: WebinarRegistrationMinAggregateOutputType | null
    _max: WebinarRegistrationMaxAggregateOutputType | null
  }

  type GetWebinarRegistrationGroupByPayload<T extends WebinarRegistrationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebinarRegistrationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebinarRegistrationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebinarRegistrationGroupByOutputType[P]>
            : GetScalarType<T[P], WebinarRegistrationGroupByOutputType[P]>
        }
      >
    >


  export type WebinarRegistrationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    parentName?: boolean
    parentEmail?: boolean
    parentPhone?: boolean
    studentName?: boolean
    grade?: boolean
    schoolName?: boolean
    program?: boolean
    preferredTime?: boolean
    createdAt?: boolean
    approved?: boolean
  }, ExtArgs["result"]["webinarRegistration"]>

  export type WebinarRegistrationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    parentName?: boolean
    parentEmail?: boolean
    parentPhone?: boolean
    studentName?: boolean
    grade?: boolean
    schoolName?: boolean
    program?: boolean
    preferredTime?: boolean
    createdAt?: boolean
    approved?: boolean
  }, ExtArgs["result"]["webinarRegistration"]>

  export type WebinarRegistrationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    parentName?: boolean
    parentEmail?: boolean
    parentPhone?: boolean
    studentName?: boolean
    grade?: boolean
    schoolName?: boolean
    program?: boolean
    preferredTime?: boolean
    createdAt?: boolean
    approved?: boolean
  }, ExtArgs["result"]["webinarRegistration"]>

  export type WebinarRegistrationSelectScalar = {
    id?: boolean
    email?: boolean
    parentName?: boolean
    parentEmail?: boolean
    parentPhone?: boolean
    studentName?: boolean
    grade?: boolean
    schoolName?: boolean
    program?: boolean
    preferredTime?: boolean
    createdAt?: boolean
    approved?: boolean
  }

  export type WebinarRegistrationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "parentName" | "parentEmail" | "parentPhone" | "studentName" | "grade" | "schoolName" | "program" | "preferredTime" | "createdAt" | "approved", ExtArgs["result"]["webinarRegistration"]>

  export type $WebinarRegistrationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WebinarRegistration"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      email: string
      parentName: string
      parentEmail: string
      parentPhone: string
      studentName: string
      grade: string
      schoolName: string
      program: string
      preferredTime: string
      createdAt: Date
      approved: boolean
    }, ExtArgs["result"]["webinarRegistration"]>
    composites: {}
  }

  type WebinarRegistrationGetPayload<S extends boolean | null | undefined | WebinarRegistrationDefaultArgs> = $Result.GetResult<Prisma.$WebinarRegistrationPayload, S>

  type WebinarRegistrationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WebinarRegistrationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WebinarRegistrationCountAggregateInputType | true
    }

  export interface WebinarRegistrationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WebinarRegistration'], meta: { name: 'WebinarRegistration' } }
    /**
     * Find zero or one WebinarRegistration that matches the filter.
     * @param {WebinarRegistrationFindUniqueArgs} args - Arguments to find a WebinarRegistration
     * @example
     * // Get one WebinarRegistration
     * const webinarRegistration = await prisma.webinarRegistration.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebinarRegistrationFindUniqueArgs>(args: SelectSubset<T, WebinarRegistrationFindUniqueArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WebinarRegistration that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WebinarRegistrationFindUniqueOrThrowArgs} args - Arguments to find a WebinarRegistration
     * @example
     * // Get one WebinarRegistration
     * const webinarRegistration = await prisma.webinarRegistration.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebinarRegistrationFindUniqueOrThrowArgs>(args: SelectSubset<T, WebinarRegistrationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebinarRegistration that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationFindFirstArgs} args - Arguments to find a WebinarRegistration
     * @example
     * // Get one WebinarRegistration
     * const webinarRegistration = await prisma.webinarRegistration.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebinarRegistrationFindFirstArgs>(args?: SelectSubset<T, WebinarRegistrationFindFirstArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebinarRegistration that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationFindFirstOrThrowArgs} args - Arguments to find a WebinarRegistration
     * @example
     * // Get one WebinarRegistration
     * const webinarRegistration = await prisma.webinarRegistration.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebinarRegistrationFindFirstOrThrowArgs>(args?: SelectSubset<T, WebinarRegistrationFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WebinarRegistrations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WebinarRegistrations
     * const webinarRegistrations = await prisma.webinarRegistration.findMany()
     * 
     * // Get first 10 WebinarRegistrations
     * const webinarRegistrations = await prisma.webinarRegistration.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const webinarRegistrationWithIdOnly = await prisma.webinarRegistration.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebinarRegistrationFindManyArgs>(args?: SelectSubset<T, WebinarRegistrationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WebinarRegistration.
     * @param {WebinarRegistrationCreateArgs} args - Arguments to create a WebinarRegistration.
     * @example
     * // Create one WebinarRegistration
     * const WebinarRegistration = await prisma.webinarRegistration.create({
     *   data: {
     *     // ... data to create a WebinarRegistration
     *   }
     * })
     * 
     */
    create<T extends WebinarRegistrationCreateArgs>(args: SelectSubset<T, WebinarRegistrationCreateArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WebinarRegistrations.
     * @param {WebinarRegistrationCreateManyArgs} args - Arguments to create many WebinarRegistrations.
     * @example
     * // Create many WebinarRegistrations
     * const webinarRegistration = await prisma.webinarRegistration.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebinarRegistrationCreateManyArgs>(args?: SelectSubset<T, WebinarRegistrationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WebinarRegistrations and returns the data saved in the database.
     * @param {WebinarRegistrationCreateManyAndReturnArgs} args - Arguments to create many WebinarRegistrations.
     * @example
     * // Create many WebinarRegistrations
     * const webinarRegistration = await prisma.webinarRegistration.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WebinarRegistrations and only return the `id`
     * const webinarRegistrationWithIdOnly = await prisma.webinarRegistration.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebinarRegistrationCreateManyAndReturnArgs>(args?: SelectSubset<T, WebinarRegistrationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WebinarRegistration.
     * @param {WebinarRegistrationDeleteArgs} args - Arguments to delete one WebinarRegistration.
     * @example
     * // Delete one WebinarRegistration
     * const WebinarRegistration = await prisma.webinarRegistration.delete({
     *   where: {
     *     // ... filter to delete one WebinarRegistration
     *   }
     * })
     * 
     */
    delete<T extends WebinarRegistrationDeleteArgs>(args: SelectSubset<T, WebinarRegistrationDeleteArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WebinarRegistration.
     * @param {WebinarRegistrationUpdateArgs} args - Arguments to update one WebinarRegistration.
     * @example
     * // Update one WebinarRegistration
     * const webinarRegistration = await prisma.webinarRegistration.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebinarRegistrationUpdateArgs>(args: SelectSubset<T, WebinarRegistrationUpdateArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WebinarRegistrations.
     * @param {WebinarRegistrationDeleteManyArgs} args - Arguments to filter WebinarRegistrations to delete.
     * @example
     * // Delete a few WebinarRegistrations
     * const { count } = await prisma.webinarRegistration.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebinarRegistrationDeleteManyArgs>(args?: SelectSubset<T, WebinarRegistrationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebinarRegistrations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WebinarRegistrations
     * const webinarRegistration = await prisma.webinarRegistration.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebinarRegistrationUpdateManyArgs>(args: SelectSubset<T, WebinarRegistrationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebinarRegistrations and returns the data updated in the database.
     * @param {WebinarRegistrationUpdateManyAndReturnArgs} args - Arguments to update many WebinarRegistrations.
     * @example
     * // Update many WebinarRegistrations
     * const webinarRegistration = await prisma.webinarRegistration.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WebinarRegistrations and only return the `id`
     * const webinarRegistrationWithIdOnly = await prisma.webinarRegistration.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WebinarRegistrationUpdateManyAndReturnArgs>(args: SelectSubset<T, WebinarRegistrationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WebinarRegistration.
     * @param {WebinarRegistrationUpsertArgs} args - Arguments to update or create a WebinarRegistration.
     * @example
     * // Update or create a WebinarRegistration
     * const webinarRegistration = await prisma.webinarRegistration.upsert({
     *   create: {
     *     // ... data to create a WebinarRegistration
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WebinarRegistration we want to update
     *   }
     * })
     */
    upsert<T extends WebinarRegistrationUpsertArgs>(args: SelectSubset<T, WebinarRegistrationUpsertArgs<ExtArgs>>): Prisma__WebinarRegistrationClient<$Result.GetResult<Prisma.$WebinarRegistrationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WebinarRegistrations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationCountArgs} args - Arguments to filter WebinarRegistrations to count.
     * @example
     * // Count the number of WebinarRegistrations
     * const count = await prisma.webinarRegistration.count({
     *   where: {
     *     // ... the filter for the WebinarRegistrations we want to count
     *   }
     * })
    **/
    count<T extends WebinarRegistrationCountArgs>(
      args?: Subset<T, WebinarRegistrationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebinarRegistrationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WebinarRegistration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebinarRegistrationAggregateArgs>(args: Subset<T, WebinarRegistrationAggregateArgs>): Prisma.PrismaPromise<GetWebinarRegistrationAggregateType<T>>

    /**
     * Group by WebinarRegistration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebinarRegistrationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebinarRegistrationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebinarRegistrationGroupByArgs['orderBy'] }
        : { orderBy?: WebinarRegistrationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebinarRegistrationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebinarRegistrationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WebinarRegistration model
   */
  readonly fields: WebinarRegistrationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WebinarRegistration.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebinarRegistrationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WebinarRegistration model
   */
  interface WebinarRegistrationFieldRefs {
    readonly id: FieldRef<"WebinarRegistration", 'Int'>
    readonly email: FieldRef<"WebinarRegistration", 'String'>
    readonly parentName: FieldRef<"WebinarRegistration", 'String'>
    readonly parentEmail: FieldRef<"WebinarRegistration", 'String'>
    readonly parentPhone: FieldRef<"WebinarRegistration", 'String'>
    readonly studentName: FieldRef<"WebinarRegistration", 'String'>
    readonly grade: FieldRef<"WebinarRegistration", 'String'>
    readonly schoolName: FieldRef<"WebinarRegistration", 'String'>
    readonly program: FieldRef<"WebinarRegistration", 'String'>
    readonly preferredTime: FieldRef<"WebinarRegistration", 'String'>
    readonly createdAt: FieldRef<"WebinarRegistration", 'DateTime'>
    readonly approved: FieldRef<"WebinarRegistration", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * WebinarRegistration findUnique
   */
  export type WebinarRegistrationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * Filter, which WebinarRegistration to fetch.
     */
    where: WebinarRegistrationWhereUniqueInput
  }

  /**
   * WebinarRegistration findUniqueOrThrow
   */
  export type WebinarRegistrationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * Filter, which WebinarRegistration to fetch.
     */
    where: WebinarRegistrationWhereUniqueInput
  }

  /**
   * WebinarRegistration findFirst
   */
  export type WebinarRegistrationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * Filter, which WebinarRegistration to fetch.
     */
    where?: WebinarRegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebinarRegistrations to fetch.
     */
    orderBy?: WebinarRegistrationOrderByWithRelationInput | WebinarRegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebinarRegistrations.
     */
    cursor?: WebinarRegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebinarRegistrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebinarRegistrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebinarRegistrations.
     */
    distinct?: WebinarRegistrationScalarFieldEnum | WebinarRegistrationScalarFieldEnum[]
  }

  /**
   * WebinarRegistration findFirstOrThrow
   */
  export type WebinarRegistrationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * Filter, which WebinarRegistration to fetch.
     */
    where?: WebinarRegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebinarRegistrations to fetch.
     */
    orderBy?: WebinarRegistrationOrderByWithRelationInput | WebinarRegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebinarRegistrations.
     */
    cursor?: WebinarRegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebinarRegistrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebinarRegistrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebinarRegistrations.
     */
    distinct?: WebinarRegistrationScalarFieldEnum | WebinarRegistrationScalarFieldEnum[]
  }

  /**
   * WebinarRegistration findMany
   */
  export type WebinarRegistrationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * Filter, which WebinarRegistrations to fetch.
     */
    where?: WebinarRegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebinarRegistrations to fetch.
     */
    orderBy?: WebinarRegistrationOrderByWithRelationInput | WebinarRegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WebinarRegistrations.
     */
    cursor?: WebinarRegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebinarRegistrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebinarRegistrations.
     */
    skip?: number
    distinct?: WebinarRegistrationScalarFieldEnum | WebinarRegistrationScalarFieldEnum[]
  }

  /**
   * WebinarRegistration create
   */
  export type WebinarRegistrationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * The data needed to create a WebinarRegistration.
     */
    data: XOR<WebinarRegistrationCreateInput, WebinarRegistrationUncheckedCreateInput>
  }

  /**
   * WebinarRegistration createMany
   */
  export type WebinarRegistrationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WebinarRegistrations.
     */
    data: WebinarRegistrationCreateManyInput | WebinarRegistrationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebinarRegistration createManyAndReturn
   */
  export type WebinarRegistrationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * The data used to create many WebinarRegistrations.
     */
    data: WebinarRegistrationCreateManyInput | WebinarRegistrationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebinarRegistration update
   */
  export type WebinarRegistrationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * The data needed to update a WebinarRegistration.
     */
    data: XOR<WebinarRegistrationUpdateInput, WebinarRegistrationUncheckedUpdateInput>
    /**
     * Choose, which WebinarRegistration to update.
     */
    where: WebinarRegistrationWhereUniqueInput
  }

  /**
   * WebinarRegistration updateMany
   */
  export type WebinarRegistrationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WebinarRegistrations.
     */
    data: XOR<WebinarRegistrationUpdateManyMutationInput, WebinarRegistrationUncheckedUpdateManyInput>
    /**
     * Filter which WebinarRegistrations to update
     */
    where?: WebinarRegistrationWhereInput
    /**
     * Limit how many WebinarRegistrations to update.
     */
    limit?: number
  }

  /**
   * WebinarRegistration updateManyAndReturn
   */
  export type WebinarRegistrationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * The data used to update WebinarRegistrations.
     */
    data: XOR<WebinarRegistrationUpdateManyMutationInput, WebinarRegistrationUncheckedUpdateManyInput>
    /**
     * Filter which WebinarRegistrations to update
     */
    where?: WebinarRegistrationWhereInput
    /**
     * Limit how many WebinarRegistrations to update.
     */
    limit?: number
  }

  /**
   * WebinarRegistration upsert
   */
  export type WebinarRegistrationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * The filter to search for the WebinarRegistration to update in case it exists.
     */
    where: WebinarRegistrationWhereUniqueInput
    /**
     * In case the WebinarRegistration found by the `where` argument doesn't exist, create a new WebinarRegistration with this data.
     */
    create: XOR<WebinarRegistrationCreateInput, WebinarRegistrationUncheckedCreateInput>
    /**
     * In case the WebinarRegistration was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebinarRegistrationUpdateInput, WebinarRegistrationUncheckedUpdateInput>
  }

  /**
   * WebinarRegistration delete
   */
  export type WebinarRegistrationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
    /**
     * Filter which WebinarRegistration to delete.
     */
    where: WebinarRegistrationWhereUniqueInput
  }

  /**
   * WebinarRegistration deleteMany
   */
  export type WebinarRegistrationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebinarRegistrations to delete
     */
    where?: WebinarRegistrationWhereInput
    /**
     * Limit how many WebinarRegistrations to delete.
     */
    limit?: number
  }

  /**
   * WebinarRegistration without action
   */
  export type WebinarRegistrationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebinarRegistration
     */
    select?: WebinarRegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebinarRegistration
     */
    omit?: WebinarRegistrationOmit<ExtArgs> | null
  }


  /**
   * Model AvailabilityDay
   */

  export type AggregateAvailabilityDay = {
    _count: AvailabilityDayCountAggregateOutputType | null
    _avg: AvailabilityDayAvgAggregateOutputType | null
    _sum: AvailabilityDaySumAggregateOutputType | null
    _min: AvailabilityDayMinAggregateOutputType | null
    _max: AvailabilityDayMaxAggregateOutputType | null
  }

  export type AvailabilityDayAvgAggregateOutputType = {
    id: number | null
  }

  export type AvailabilityDaySumAggregateOutputType = {
    id: number | null
  }

  export type AvailabilityDayMinAggregateOutputType = {
    id: number | null
    date: string | null
    program: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AvailabilityDayMaxAggregateOutputType = {
    id: number | null
    date: string | null
    program: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AvailabilityDayCountAggregateOutputType = {
    id: number
    date: number
    times: number
    program: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AvailabilityDayAvgAggregateInputType = {
    id?: true
  }

  export type AvailabilityDaySumAggregateInputType = {
    id?: true
  }

  export type AvailabilityDayMinAggregateInputType = {
    id?: true
    date?: true
    program?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AvailabilityDayMaxAggregateInputType = {
    id?: true
    date?: true
    program?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AvailabilityDayCountAggregateInputType = {
    id?: true
    date?: true
    times?: true
    program?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AvailabilityDayAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AvailabilityDay to aggregate.
     */
    where?: AvailabilityDayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AvailabilityDays to fetch.
     */
    orderBy?: AvailabilityDayOrderByWithRelationInput | AvailabilityDayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AvailabilityDayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AvailabilityDays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AvailabilityDays.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AvailabilityDays
    **/
    _count?: true | AvailabilityDayCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AvailabilityDayAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AvailabilityDaySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AvailabilityDayMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AvailabilityDayMaxAggregateInputType
  }

  export type GetAvailabilityDayAggregateType<T extends AvailabilityDayAggregateArgs> = {
        [P in keyof T & keyof AggregateAvailabilityDay]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAvailabilityDay[P]>
      : GetScalarType<T[P], AggregateAvailabilityDay[P]>
  }




  export type AvailabilityDayGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AvailabilityDayWhereInput
    orderBy?: AvailabilityDayOrderByWithAggregationInput | AvailabilityDayOrderByWithAggregationInput[]
    by: AvailabilityDayScalarFieldEnum[] | AvailabilityDayScalarFieldEnum
    having?: AvailabilityDayScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AvailabilityDayCountAggregateInputType | true
    _avg?: AvailabilityDayAvgAggregateInputType
    _sum?: AvailabilityDaySumAggregateInputType
    _min?: AvailabilityDayMinAggregateInputType
    _max?: AvailabilityDayMaxAggregateInputType
  }

  export type AvailabilityDayGroupByOutputType = {
    id: number
    date: string
    times: JsonValue
    program: string
    createdAt: Date
    updatedAt: Date
    _count: AvailabilityDayCountAggregateOutputType | null
    _avg: AvailabilityDayAvgAggregateOutputType | null
    _sum: AvailabilityDaySumAggregateOutputType | null
    _min: AvailabilityDayMinAggregateOutputType | null
    _max: AvailabilityDayMaxAggregateOutputType | null
  }

  type GetAvailabilityDayGroupByPayload<T extends AvailabilityDayGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AvailabilityDayGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AvailabilityDayGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AvailabilityDayGroupByOutputType[P]>
            : GetScalarType<T[P], AvailabilityDayGroupByOutputType[P]>
        }
      >
    >


  export type AvailabilityDaySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    times?: boolean
    program?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["availabilityDay"]>

  export type AvailabilityDaySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    times?: boolean
    program?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["availabilityDay"]>

  export type AvailabilityDaySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    times?: boolean
    program?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["availabilityDay"]>

  export type AvailabilityDaySelectScalar = {
    id?: boolean
    date?: boolean
    times?: boolean
    program?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AvailabilityDayOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "date" | "times" | "program" | "createdAt" | "updatedAt", ExtArgs["result"]["availabilityDay"]>

  export type $AvailabilityDayPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AvailabilityDay"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: number
      date: string
      times: Prisma.JsonValue
      program: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["availabilityDay"]>
    composites: {}
  }

  type AvailabilityDayGetPayload<S extends boolean | null | undefined | AvailabilityDayDefaultArgs> = $Result.GetResult<Prisma.$AvailabilityDayPayload, S>

  type AvailabilityDayCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AvailabilityDayFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AvailabilityDayCountAggregateInputType | true
    }

  export interface AvailabilityDayDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AvailabilityDay'], meta: { name: 'AvailabilityDay' } }
    /**
     * Find zero or one AvailabilityDay that matches the filter.
     * @param {AvailabilityDayFindUniqueArgs} args - Arguments to find a AvailabilityDay
     * @example
     * // Get one AvailabilityDay
     * const availabilityDay = await prisma.availabilityDay.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AvailabilityDayFindUniqueArgs>(args: SelectSubset<T, AvailabilityDayFindUniqueArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AvailabilityDay that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AvailabilityDayFindUniqueOrThrowArgs} args - Arguments to find a AvailabilityDay
     * @example
     * // Get one AvailabilityDay
     * const availabilityDay = await prisma.availabilityDay.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AvailabilityDayFindUniqueOrThrowArgs>(args: SelectSubset<T, AvailabilityDayFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AvailabilityDay that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayFindFirstArgs} args - Arguments to find a AvailabilityDay
     * @example
     * // Get one AvailabilityDay
     * const availabilityDay = await prisma.availabilityDay.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AvailabilityDayFindFirstArgs>(args?: SelectSubset<T, AvailabilityDayFindFirstArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AvailabilityDay that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayFindFirstOrThrowArgs} args - Arguments to find a AvailabilityDay
     * @example
     * // Get one AvailabilityDay
     * const availabilityDay = await prisma.availabilityDay.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AvailabilityDayFindFirstOrThrowArgs>(args?: SelectSubset<T, AvailabilityDayFindFirstOrThrowArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AvailabilityDays that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AvailabilityDays
     * const availabilityDays = await prisma.availabilityDay.findMany()
     * 
     * // Get first 10 AvailabilityDays
     * const availabilityDays = await prisma.availabilityDay.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const availabilityDayWithIdOnly = await prisma.availabilityDay.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AvailabilityDayFindManyArgs>(args?: SelectSubset<T, AvailabilityDayFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AvailabilityDay.
     * @param {AvailabilityDayCreateArgs} args - Arguments to create a AvailabilityDay.
     * @example
     * // Create one AvailabilityDay
     * const AvailabilityDay = await prisma.availabilityDay.create({
     *   data: {
     *     // ... data to create a AvailabilityDay
     *   }
     * })
     * 
     */
    create<T extends AvailabilityDayCreateArgs>(args: SelectSubset<T, AvailabilityDayCreateArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AvailabilityDays.
     * @param {AvailabilityDayCreateManyArgs} args - Arguments to create many AvailabilityDays.
     * @example
     * // Create many AvailabilityDays
     * const availabilityDay = await prisma.availabilityDay.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AvailabilityDayCreateManyArgs>(args?: SelectSubset<T, AvailabilityDayCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AvailabilityDays and returns the data saved in the database.
     * @param {AvailabilityDayCreateManyAndReturnArgs} args - Arguments to create many AvailabilityDays.
     * @example
     * // Create many AvailabilityDays
     * const availabilityDay = await prisma.availabilityDay.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AvailabilityDays and only return the `id`
     * const availabilityDayWithIdOnly = await prisma.availabilityDay.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AvailabilityDayCreateManyAndReturnArgs>(args?: SelectSubset<T, AvailabilityDayCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AvailabilityDay.
     * @param {AvailabilityDayDeleteArgs} args - Arguments to delete one AvailabilityDay.
     * @example
     * // Delete one AvailabilityDay
     * const AvailabilityDay = await prisma.availabilityDay.delete({
     *   where: {
     *     // ... filter to delete one AvailabilityDay
     *   }
     * })
     * 
     */
    delete<T extends AvailabilityDayDeleteArgs>(args: SelectSubset<T, AvailabilityDayDeleteArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AvailabilityDay.
     * @param {AvailabilityDayUpdateArgs} args - Arguments to update one AvailabilityDay.
     * @example
     * // Update one AvailabilityDay
     * const availabilityDay = await prisma.availabilityDay.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AvailabilityDayUpdateArgs>(args: SelectSubset<T, AvailabilityDayUpdateArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AvailabilityDays.
     * @param {AvailabilityDayDeleteManyArgs} args - Arguments to filter AvailabilityDays to delete.
     * @example
     * // Delete a few AvailabilityDays
     * const { count } = await prisma.availabilityDay.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AvailabilityDayDeleteManyArgs>(args?: SelectSubset<T, AvailabilityDayDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AvailabilityDays.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AvailabilityDays
     * const availabilityDay = await prisma.availabilityDay.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AvailabilityDayUpdateManyArgs>(args: SelectSubset<T, AvailabilityDayUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AvailabilityDays and returns the data updated in the database.
     * @param {AvailabilityDayUpdateManyAndReturnArgs} args - Arguments to update many AvailabilityDays.
     * @example
     * // Update many AvailabilityDays
     * const availabilityDay = await prisma.availabilityDay.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AvailabilityDays and only return the `id`
     * const availabilityDayWithIdOnly = await prisma.availabilityDay.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AvailabilityDayUpdateManyAndReturnArgs>(args: SelectSubset<T, AvailabilityDayUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AvailabilityDay.
     * @param {AvailabilityDayUpsertArgs} args - Arguments to update or create a AvailabilityDay.
     * @example
     * // Update or create a AvailabilityDay
     * const availabilityDay = await prisma.availabilityDay.upsert({
     *   create: {
     *     // ... data to create a AvailabilityDay
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AvailabilityDay we want to update
     *   }
     * })
     */
    upsert<T extends AvailabilityDayUpsertArgs>(args: SelectSubset<T, AvailabilityDayUpsertArgs<ExtArgs>>): Prisma__AvailabilityDayClient<$Result.GetResult<Prisma.$AvailabilityDayPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AvailabilityDays.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayCountArgs} args - Arguments to filter AvailabilityDays to count.
     * @example
     * // Count the number of AvailabilityDays
     * const count = await prisma.availabilityDay.count({
     *   where: {
     *     // ... the filter for the AvailabilityDays we want to count
     *   }
     * })
    **/
    count<T extends AvailabilityDayCountArgs>(
      args?: Subset<T, AvailabilityDayCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AvailabilityDayCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AvailabilityDay.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AvailabilityDayAggregateArgs>(args: Subset<T, AvailabilityDayAggregateArgs>): Prisma.PrismaPromise<GetAvailabilityDayAggregateType<T>>

    /**
     * Group by AvailabilityDay.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityDayGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AvailabilityDayGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AvailabilityDayGroupByArgs['orderBy'] }
        : { orderBy?: AvailabilityDayGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AvailabilityDayGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAvailabilityDayGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AvailabilityDay model
   */
  readonly fields: AvailabilityDayFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AvailabilityDay.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AvailabilityDayClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AvailabilityDay model
   */
  interface AvailabilityDayFieldRefs {
    readonly id: FieldRef<"AvailabilityDay", 'Int'>
    readonly date: FieldRef<"AvailabilityDay", 'String'>
    readonly times: FieldRef<"AvailabilityDay", 'Json'>
    readonly program: FieldRef<"AvailabilityDay", 'String'>
    readonly createdAt: FieldRef<"AvailabilityDay", 'DateTime'>
    readonly updatedAt: FieldRef<"AvailabilityDay", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AvailabilityDay findUnique
   */
  export type AvailabilityDayFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * Filter, which AvailabilityDay to fetch.
     */
    where: AvailabilityDayWhereUniqueInput
  }

  /**
   * AvailabilityDay findUniqueOrThrow
   */
  export type AvailabilityDayFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * Filter, which AvailabilityDay to fetch.
     */
    where: AvailabilityDayWhereUniqueInput
  }

  /**
   * AvailabilityDay findFirst
   */
  export type AvailabilityDayFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * Filter, which AvailabilityDay to fetch.
     */
    where?: AvailabilityDayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AvailabilityDays to fetch.
     */
    orderBy?: AvailabilityDayOrderByWithRelationInput | AvailabilityDayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AvailabilityDays.
     */
    cursor?: AvailabilityDayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AvailabilityDays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AvailabilityDays.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AvailabilityDays.
     */
    distinct?: AvailabilityDayScalarFieldEnum | AvailabilityDayScalarFieldEnum[]
  }

  /**
   * AvailabilityDay findFirstOrThrow
   */
  export type AvailabilityDayFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * Filter, which AvailabilityDay to fetch.
     */
    where?: AvailabilityDayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AvailabilityDays to fetch.
     */
    orderBy?: AvailabilityDayOrderByWithRelationInput | AvailabilityDayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AvailabilityDays.
     */
    cursor?: AvailabilityDayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AvailabilityDays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AvailabilityDays.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AvailabilityDays.
     */
    distinct?: AvailabilityDayScalarFieldEnum | AvailabilityDayScalarFieldEnum[]
  }

  /**
   * AvailabilityDay findMany
   */
  export type AvailabilityDayFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * Filter, which AvailabilityDays to fetch.
     */
    where?: AvailabilityDayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AvailabilityDays to fetch.
     */
    orderBy?: AvailabilityDayOrderByWithRelationInput | AvailabilityDayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AvailabilityDays.
     */
    cursor?: AvailabilityDayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AvailabilityDays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AvailabilityDays.
     */
    skip?: number
    distinct?: AvailabilityDayScalarFieldEnum | AvailabilityDayScalarFieldEnum[]
  }

  /**
   * AvailabilityDay create
   */
  export type AvailabilityDayCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * The data needed to create a AvailabilityDay.
     */
    data: XOR<AvailabilityDayCreateInput, AvailabilityDayUncheckedCreateInput>
  }

  /**
   * AvailabilityDay createMany
   */
  export type AvailabilityDayCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AvailabilityDays.
     */
    data: AvailabilityDayCreateManyInput | AvailabilityDayCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AvailabilityDay createManyAndReturn
   */
  export type AvailabilityDayCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * The data used to create many AvailabilityDays.
     */
    data: AvailabilityDayCreateManyInput | AvailabilityDayCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AvailabilityDay update
   */
  export type AvailabilityDayUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * The data needed to update a AvailabilityDay.
     */
    data: XOR<AvailabilityDayUpdateInput, AvailabilityDayUncheckedUpdateInput>
    /**
     * Choose, which AvailabilityDay to update.
     */
    where: AvailabilityDayWhereUniqueInput
  }

  /**
   * AvailabilityDay updateMany
   */
  export type AvailabilityDayUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AvailabilityDays.
     */
    data: XOR<AvailabilityDayUpdateManyMutationInput, AvailabilityDayUncheckedUpdateManyInput>
    /**
     * Filter which AvailabilityDays to update
     */
    where?: AvailabilityDayWhereInput
    /**
     * Limit how many AvailabilityDays to update.
     */
    limit?: number
  }

  /**
   * AvailabilityDay updateManyAndReturn
   */
  export type AvailabilityDayUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * The data used to update AvailabilityDays.
     */
    data: XOR<AvailabilityDayUpdateManyMutationInput, AvailabilityDayUncheckedUpdateManyInput>
    /**
     * Filter which AvailabilityDays to update
     */
    where?: AvailabilityDayWhereInput
    /**
     * Limit how many AvailabilityDays to update.
     */
    limit?: number
  }

  /**
   * AvailabilityDay upsert
   */
  export type AvailabilityDayUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * The filter to search for the AvailabilityDay to update in case it exists.
     */
    where: AvailabilityDayWhereUniqueInput
    /**
     * In case the AvailabilityDay found by the `where` argument doesn't exist, create a new AvailabilityDay with this data.
     */
    create: XOR<AvailabilityDayCreateInput, AvailabilityDayUncheckedCreateInput>
    /**
     * In case the AvailabilityDay was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AvailabilityDayUpdateInput, AvailabilityDayUncheckedUpdateInput>
  }

  /**
   * AvailabilityDay delete
   */
  export type AvailabilityDayDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
    /**
     * Filter which AvailabilityDay to delete.
     */
    where: AvailabilityDayWhereUniqueInput
  }

  /**
   * AvailabilityDay deleteMany
   */
  export type AvailabilityDayDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AvailabilityDays to delete
     */
    where?: AvailabilityDayWhereInput
    /**
     * Limit how many AvailabilityDays to delete.
     */
    limit?: number
  }

  /**
   * AvailabilityDay without action
   */
  export type AvailabilityDayDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AvailabilityDay
     */
    select?: AvailabilityDaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AvailabilityDay
     */
    omit?: AvailabilityDayOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const WebinarRegistrationScalarFieldEnum: {
    id: 'id',
    email: 'email',
    parentName: 'parentName',
    parentEmail: 'parentEmail',
    parentPhone: 'parentPhone',
    studentName: 'studentName',
    grade: 'grade',
    schoolName: 'schoolName',
    program: 'program',
    preferredTime: 'preferredTime',
    createdAt: 'createdAt',
    approved: 'approved'
  };

  export type WebinarRegistrationScalarFieldEnum = (typeof WebinarRegistrationScalarFieldEnum)[keyof typeof WebinarRegistrationScalarFieldEnum]


  export const AvailabilityDayScalarFieldEnum: {
    id: 'id',
    date: 'date',
    times: 'times',
    program: 'program',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AvailabilityDayScalarFieldEnum = (typeof AvailabilityDayScalarFieldEnum)[keyof typeof AvailabilityDayScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type WebinarRegistrationWhereInput = {
    AND?: WebinarRegistrationWhereInput | WebinarRegistrationWhereInput[]
    OR?: WebinarRegistrationWhereInput[]
    NOT?: WebinarRegistrationWhereInput | WebinarRegistrationWhereInput[]
    id?: IntFilter<"WebinarRegistration"> | number
    email?: StringFilter<"WebinarRegistration"> | string
    parentName?: StringFilter<"WebinarRegistration"> | string
    parentEmail?: StringFilter<"WebinarRegistration"> | string
    parentPhone?: StringFilter<"WebinarRegistration"> | string
    studentName?: StringFilter<"WebinarRegistration"> | string
    grade?: StringFilter<"WebinarRegistration"> | string
    schoolName?: StringFilter<"WebinarRegistration"> | string
    program?: StringFilter<"WebinarRegistration"> | string
    preferredTime?: StringFilter<"WebinarRegistration"> | string
    createdAt?: DateTimeFilter<"WebinarRegistration"> | Date | string
    approved?: BoolFilter<"WebinarRegistration"> | boolean
  }

  export type WebinarRegistrationOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    parentName?: SortOrder
    parentEmail?: SortOrder
    parentPhone?: SortOrder
    studentName?: SortOrder
    grade?: SortOrder
    schoolName?: SortOrder
    program?: SortOrder
    preferredTime?: SortOrder
    createdAt?: SortOrder
    approved?: SortOrder
  }

  export type WebinarRegistrationWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: WebinarRegistrationWhereInput | WebinarRegistrationWhereInput[]
    OR?: WebinarRegistrationWhereInput[]
    NOT?: WebinarRegistrationWhereInput | WebinarRegistrationWhereInput[]
    email?: StringFilter<"WebinarRegistration"> | string
    parentName?: StringFilter<"WebinarRegistration"> | string
    parentEmail?: StringFilter<"WebinarRegistration"> | string
    parentPhone?: StringFilter<"WebinarRegistration"> | string
    studentName?: StringFilter<"WebinarRegistration"> | string
    grade?: StringFilter<"WebinarRegistration"> | string
    schoolName?: StringFilter<"WebinarRegistration"> | string
    program?: StringFilter<"WebinarRegistration"> | string
    preferredTime?: StringFilter<"WebinarRegistration"> | string
    createdAt?: DateTimeFilter<"WebinarRegistration"> | Date | string
    approved?: BoolFilter<"WebinarRegistration"> | boolean
  }, "id">

  export type WebinarRegistrationOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    parentName?: SortOrder
    parentEmail?: SortOrder
    parentPhone?: SortOrder
    studentName?: SortOrder
    grade?: SortOrder
    schoolName?: SortOrder
    program?: SortOrder
    preferredTime?: SortOrder
    createdAt?: SortOrder
    approved?: SortOrder
    _count?: WebinarRegistrationCountOrderByAggregateInput
    _avg?: WebinarRegistrationAvgOrderByAggregateInput
    _max?: WebinarRegistrationMaxOrderByAggregateInput
    _min?: WebinarRegistrationMinOrderByAggregateInput
    _sum?: WebinarRegistrationSumOrderByAggregateInput
  }

  export type WebinarRegistrationScalarWhereWithAggregatesInput = {
    AND?: WebinarRegistrationScalarWhereWithAggregatesInput | WebinarRegistrationScalarWhereWithAggregatesInput[]
    OR?: WebinarRegistrationScalarWhereWithAggregatesInput[]
    NOT?: WebinarRegistrationScalarWhereWithAggregatesInput | WebinarRegistrationScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"WebinarRegistration"> | number
    email?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    parentName?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    parentEmail?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    parentPhone?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    studentName?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    grade?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    schoolName?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    program?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    preferredTime?: StringWithAggregatesFilter<"WebinarRegistration"> | string
    createdAt?: DateTimeWithAggregatesFilter<"WebinarRegistration"> | Date | string
    approved?: BoolWithAggregatesFilter<"WebinarRegistration"> | boolean
  }

  export type AvailabilityDayWhereInput = {
    AND?: AvailabilityDayWhereInput | AvailabilityDayWhereInput[]
    OR?: AvailabilityDayWhereInput[]
    NOT?: AvailabilityDayWhereInput | AvailabilityDayWhereInput[]
    id?: IntFilter<"AvailabilityDay"> | number
    date?: StringFilter<"AvailabilityDay"> | string
    times?: JsonFilter<"AvailabilityDay">
    program?: StringFilter<"AvailabilityDay"> | string
    createdAt?: DateTimeFilter<"AvailabilityDay"> | Date | string
    updatedAt?: DateTimeFilter<"AvailabilityDay"> | Date | string
  }

  export type AvailabilityDayOrderByWithRelationInput = {
    id?: SortOrder
    date?: SortOrder
    times?: SortOrder
    program?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AvailabilityDayWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    date_program?: AvailabilityDayDateProgramCompoundUniqueInput
    AND?: AvailabilityDayWhereInput | AvailabilityDayWhereInput[]
    OR?: AvailabilityDayWhereInput[]
    NOT?: AvailabilityDayWhereInput | AvailabilityDayWhereInput[]
    date?: StringFilter<"AvailabilityDay"> | string
    times?: JsonFilter<"AvailabilityDay">
    program?: StringFilter<"AvailabilityDay"> | string
    createdAt?: DateTimeFilter<"AvailabilityDay"> | Date | string
    updatedAt?: DateTimeFilter<"AvailabilityDay"> | Date | string
  }, "id" | "date_program">

  export type AvailabilityDayOrderByWithAggregationInput = {
    id?: SortOrder
    date?: SortOrder
    times?: SortOrder
    program?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AvailabilityDayCountOrderByAggregateInput
    _avg?: AvailabilityDayAvgOrderByAggregateInput
    _max?: AvailabilityDayMaxOrderByAggregateInput
    _min?: AvailabilityDayMinOrderByAggregateInput
    _sum?: AvailabilityDaySumOrderByAggregateInput
  }

  export type AvailabilityDayScalarWhereWithAggregatesInput = {
    AND?: AvailabilityDayScalarWhereWithAggregatesInput | AvailabilityDayScalarWhereWithAggregatesInput[]
    OR?: AvailabilityDayScalarWhereWithAggregatesInput[]
    NOT?: AvailabilityDayScalarWhereWithAggregatesInput | AvailabilityDayScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"AvailabilityDay"> | number
    date?: StringWithAggregatesFilter<"AvailabilityDay"> | string
    times?: JsonWithAggregatesFilter<"AvailabilityDay">
    program?: StringWithAggregatesFilter<"AvailabilityDay"> | string
    createdAt?: DateTimeWithAggregatesFilter<"AvailabilityDay"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AvailabilityDay"> | Date | string
  }

  export type WebinarRegistrationCreateInput = {
    email: string
    parentName: string
    parentEmail: string
    parentPhone: string
    studentName: string
    grade: string
    schoolName: string
    program: string
    preferredTime: string
    createdAt?: Date | string
    approved?: boolean
  }

  export type WebinarRegistrationUncheckedCreateInput = {
    id?: number
    email: string
    parentName: string
    parentEmail: string
    parentPhone: string
    studentName: string
    grade: string
    schoolName: string
    program: string
    preferredTime: string
    createdAt?: Date | string
    approved?: boolean
  }

  export type WebinarRegistrationUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    parentName?: StringFieldUpdateOperationsInput | string
    parentEmail?: StringFieldUpdateOperationsInput | string
    parentPhone?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    program?: StringFieldUpdateOperationsInput | string
    preferredTime?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approved?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WebinarRegistrationUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    parentName?: StringFieldUpdateOperationsInput | string
    parentEmail?: StringFieldUpdateOperationsInput | string
    parentPhone?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    program?: StringFieldUpdateOperationsInput | string
    preferredTime?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approved?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WebinarRegistrationCreateManyInput = {
    id?: number
    email: string
    parentName: string
    parentEmail: string
    parentPhone: string
    studentName: string
    grade: string
    schoolName: string
    program: string
    preferredTime: string
    createdAt?: Date | string
    approved?: boolean
  }

  export type WebinarRegistrationUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    parentName?: StringFieldUpdateOperationsInput | string
    parentEmail?: StringFieldUpdateOperationsInput | string
    parentPhone?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    program?: StringFieldUpdateOperationsInput | string
    preferredTime?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approved?: BoolFieldUpdateOperationsInput | boolean
  }

  export type WebinarRegistrationUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    parentName?: StringFieldUpdateOperationsInput | string
    parentEmail?: StringFieldUpdateOperationsInput | string
    parentPhone?: StringFieldUpdateOperationsInput | string
    studentName?: StringFieldUpdateOperationsInput | string
    grade?: StringFieldUpdateOperationsInput | string
    schoolName?: StringFieldUpdateOperationsInput | string
    program?: StringFieldUpdateOperationsInput | string
    preferredTime?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approved?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AvailabilityDayCreateInput = {
    date: string
    times: JsonNullValueInput | InputJsonValue
    program: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AvailabilityDayUncheckedCreateInput = {
    id?: number
    date: string
    times: JsonNullValueInput | InputJsonValue
    program: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AvailabilityDayUpdateInput = {
    date?: StringFieldUpdateOperationsInput | string
    times?: JsonNullValueInput | InputJsonValue
    program?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AvailabilityDayUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: StringFieldUpdateOperationsInput | string
    times?: JsonNullValueInput | InputJsonValue
    program?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AvailabilityDayCreateManyInput = {
    id?: number
    date: string
    times: JsonNullValueInput | InputJsonValue
    program: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AvailabilityDayUpdateManyMutationInput = {
    date?: StringFieldUpdateOperationsInput | string
    times?: JsonNullValueInput | InputJsonValue
    program?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AvailabilityDayUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: StringFieldUpdateOperationsInput | string
    times?: JsonNullValueInput | InputJsonValue
    program?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type WebinarRegistrationCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    parentName?: SortOrder
    parentEmail?: SortOrder
    parentPhone?: SortOrder
    studentName?: SortOrder
    grade?: SortOrder
    schoolName?: SortOrder
    program?: SortOrder
    preferredTime?: SortOrder
    createdAt?: SortOrder
    approved?: SortOrder
  }

  export type WebinarRegistrationAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type WebinarRegistrationMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    parentName?: SortOrder
    parentEmail?: SortOrder
    parentPhone?: SortOrder
    studentName?: SortOrder
    grade?: SortOrder
    schoolName?: SortOrder
    program?: SortOrder
    preferredTime?: SortOrder
    createdAt?: SortOrder
    approved?: SortOrder
  }

  export type WebinarRegistrationMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    parentName?: SortOrder
    parentEmail?: SortOrder
    parentPhone?: SortOrder
    studentName?: SortOrder
    grade?: SortOrder
    schoolName?: SortOrder
    program?: SortOrder
    preferredTime?: SortOrder
    createdAt?: SortOrder
    approved?: SortOrder
  }

  export type WebinarRegistrationSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AvailabilityDayDateProgramCompoundUniqueInput = {
    date: string
    program: string
  }

  export type AvailabilityDayCountOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    times?: SortOrder
    program?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AvailabilityDayAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type AvailabilityDayMaxOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    program?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AvailabilityDayMinOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    program?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AvailabilityDaySumOrderByAggregateInput = {
    id?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}