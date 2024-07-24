import mysql, { QueryResult } from "mysql2/promise";
import { DBConfig } from "./dbTypes";

export interface IConnection<QR> {
  initialize(): Promise<void>;
  query: <T extends QR>(sql: string, values: any) => Promise<T>;
}

export interface IConnectionPool<QR> {
  acquireStandaloneConnection(): Promise<StandaloneConnection<QR>>;
  acquirePoolConnection(): Promise<PoolConnection<QR>>;
  acquireTransactionConnection(): Promise<TransactionConnection<QR>>;
  acquireTransactionPoolConnection(): Promise<TransactionPoolConnection<QR>>;
}

// -----XXXXX-----

export abstract class StandaloneConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
}

export abstract class PoolConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): Promise<void>;
}

export abstract class TransactionConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract close(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}

export abstract class TransactionPoolConnection<QR> implements IConnection<QR> {
  abstract initialize(): Promise<void>;
  abstract query<T extends QR>(sql: string, values: any): Promise<T>;
  abstract release(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
}

// -----XXXXX-----

export class MySqlStandaloneConnection extends StandaloneConnection<QueryResult> {
  private connection: mysql.Connection | undefined;
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
  }
}

export class MySqlPoolConnection extends PoolConnection<QueryResult> {
  private connection: mysql.PoolConnection | undefined;
  constructor(private readonly pool: mysql.Pool) {
    super();
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
    this.connection.release();
  }
}

export class MySqlTransactionConnection extends TransactionConnection<QueryResult> {
  private connection: mysql.Connection | undefined;

  constructor(private readonly connectionString: string) {
    super();
  }

  async initialize(): Promise<void> {
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

  async commit(): Promise<void> {
    if (!this.connection) return;
    await this.connection.commit();
  }

  async rollback(): Promise<void> {
    if (!this.connection) return;
    await this.connection.rollback();
  }

  async close(): Promise<void> {
    if (!this.connection) return;
    await this.connection.end();
    this.connection = undefined;
  }
}

export class MySqlTransactionPoolConnection extends TransactionPoolConnection<QueryResult> {
  private connection: mysql.PoolConnection | undefined;

  constructor(private readonly pool: mysql.Pool) {
    super();
  }

  async initialize(): Promise<void> {
    if (this.connection) return;
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
  }

  async query<T extends QueryResult>(sql: string, values: any): Promise<T> {
    if (!this.connection) {
      await this.initialize();
    }
    const [result] = await this.connection!.query<T>(sql, values);
    return result;
  }

  async commit(): Promise<void> {
    if (!this.connection) return;
    await this.connection.commit();
  }

  async rollback(): Promise<void> {
    if (!this.connection) return;
    await this.connection.rollback();
  }

  async release(): Promise<void> {
    if (!this.connection) return;
    this.connection.release();
    this.connection = undefined;
  }
}

export class MySqlConnectionFactory implements IConnectionPool<QueryResult> {
  private pool: mysql.Pool | null = null;
  constructor(private readonly config: DBConfig) {}

  async acquireStandaloneConnection(): Promise<
    StandaloneConnection<mysql.QueryResult>
  > {
    const connection = new MySqlStandaloneConnection(this.config.dbURL);
    return connection;
  }

  async acquirePoolConnection(): Promise<PoolConnection<mysql.QueryResult>> {
    if (this.pool === null) {
      this.pool = mysql.createPool(this.config.dbURL);
    }
    const connection = new MySqlPoolConnection(this.pool);
    return connection;
  }

  async acquireTransactionConnection(): Promise<
    TransactionConnection<mysql.QueryResult>
  > {
    const connection = new MySqlTransactionConnection(this.config.dbURL);
    return connection;
  }

  async acquireTransactionPoolConnection(): Promise<
    TransactionPoolConnection<mysql.QueryResult>
  > {
    if (this.pool === null) {
      this.pool = mysql.createPool(this.config.dbURL);
    }
    const connection = new MySqlTransactionPoolConnection(this.pool);
    return connection;
  }

  async shutdown(): Promise<void> {
    if (this.pool) {
      this.pool.end();
    }
  }
}
