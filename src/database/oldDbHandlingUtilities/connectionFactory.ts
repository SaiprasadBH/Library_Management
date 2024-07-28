import mysql, { QueryResult } from "mysql2/promise";
export interface IConnectionFactory<QR> {
  initialize(): Promise<void>;
  query: <T extends QR>(sql: string, values: any) => Promise<T>;
}
export interface IPoolConnectionFactory<QR> {
  acquirePoolConnection(): Promise<PoolConnection<QR>>;
  acquireTransactionPoolConnection(): Promise<TransactionPoolConnection<QR>>;
}
export abstract class StandaloneConnection<QR>
  implements IConnectionFactory<QR>
{
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
}
export abstract class PoolConnection<QR> implements IConnectionFactory<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): Promise<void>;
}
export abstract class TransactionConnection<QR>
  implements IConnectionFactory<QR>
{
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}
export abstract class TransactionPoolConnection<QR>
  implements IConnectionFactory<QR>
{
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}
// -----XXXXX-----
export class MySqlStandaloneConnection extends StandaloneConnection<QueryResult> {
  private connection: mysql.Connection | null = null;
  constructor(private readonly connectionString: string) {
    super();
  }
  async initialize() {
    if (this.connection) return;
    this.connection = await mysql.createConnection(this.connectionString);
  }
  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  async close(): Promise<void> {
    if (!this.connection) return;
    this.connection.end();
    this.connection = null;
  }
}

export class MyPoolConnection extends PoolConnection<QueryResult> {
  private connection: mysql.PoolConnection | null = null;
  private pool: mysql.Pool;
  constructor(poolConnection: mysql.Pool) {
    super();
    this.pool = poolConnection;
  }
  async initialize() {
    if (this.connection) return;
    this.connection = await this.pool.getConnection();
  }
  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  async release(): Promise<void> {
    if (!this.connection) return;
    this.pool.releaseConnection(this.connection);
    // this.connection.release();
    this.connection = null;
  }
}

export class MyTransactionConnection extends TransactionConnection<QueryResult> {
  private connection: mysql.Connection | null = null;
  constructor(private readonly connectionString: string) {
    super();
  }
  async initialize() {
    if (this.connection) return;
    this.connection = await mysql.createConnection(this.connectionString);
    await this.connection.beginTransaction();
  }
  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  async close(): Promise<void> {
    if (!this.connection) return;
    await this.connection.end();
  }
  async commit(): Promise<void> {
    if (!this.connection) return;
    await this.connection.commit();
  }
  async rollback(): Promise<void> {
    if (!this.connection) return;
    await this.connection.rollback();
  }
}

export class MyTransactionPoolConnection extends TransactionPoolConnection<QueryResult> {
  private connection: mysql.PoolConnection | null = null;
  private pool: mysql.Pool;
  constructor(poolConnection: mysql.Pool) {
    super();
    this.pool = poolConnection;
  }
  async initialize(): Promise<void> {
    if (this.connection) return;
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
  }
  async query<T extends mysql.QueryResult>(
    sql: string,
    values: any
  ): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }
  async release(): Promise<void> {
    if (!this.connection) return;
    this.pool.releaseConnection(this.connection);
    this.connection = null;
  }
  async commit(): Promise<void> {
    if (!this.connection) return;
    await this.connection.commit();
  }
  async rollback(): Promise<void> {
    if (!this.connection) return;
    await this.connection.rollback();
  }
}

export class MySQLConnectionFactory
  implements IPoolConnectionFactory<QueryResult>
{
  private pool: mysql.Pool | null = null;
  constructor(private readonly connectionString: string) {}

  async acquirePoolConnection(): Promise<MyPoolConnection> {
    if (!this.pool) this.pool = mysql.createPool(this.connectionString);
    const connection = new MyPoolConnection(this.pool);
    await connection.initialize();
    return connection;
  }

  async acquireTransactionPoolConnection(): Promise<MyTransactionPoolConnection> {
    if (!this.pool) this.pool = mysql.createPool(this.connectionString);
    const connection = new MyTransactionPoolConnection(this.pool);
    await connection.initialize();
    return connection;
  }

  async acquireConnection() {
    const connection = new MySqlStandaloneConnection(this.connectionString);
    await connection.initialize();
    return connection;
  }

  async acquireTransactionConnection() {
    const connection = new MyTransactionConnection(this.connectionString);
    await connection.initialize();
    return connection;
  }

  async endConnection() {
    if (this.pool) {
      this.pool.end();
      this.pool = null;
    }
  }
}
