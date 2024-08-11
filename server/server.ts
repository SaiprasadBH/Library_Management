import http from "node:http";
import { URL } from "node:url";

export interface CustomRequest extends http.IncomingMessage {
  [key: string]: any;
}

export type CustomResponse = http.ServerResponse;

type NextMiddlewareExecutor = (error?: Error) => void;

export type RequestProcessor = (
  request: CustomRequest,
  response: CustomResponse,
  next: NextMiddlewareExecutor
) => void;

type URLPath = string;
type AllowedHTTPMethods = "GET" | "POST" | "PATCH" | "DELETE";

type RequestProcessorPathMap = Record<URLPath, RequestProcessor[]>;

export class HTTPServer {
  private port: number;
  private server: ReturnType<typeof http.createServer>;

  private processorsMap: Record<AllowedHTTPMethods, RequestProcessorPathMap> = {
    GET: {},
    POST: {},
    PATCH: {},
    DELETE: {},
  };
  private globalProcessors: Record<string, RequestProcessor[]> = {
    globals: [],
  };

  constructor(port: number) {
    this.port = port;

    this.server = http.createServer(
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        if (
          request.method !== "GET" &&
          request.method !== "POST" &&
          request.method !== "PATCH" &&
          request.method !== "DELETE"
        ) {
          response
            .writeHead(500)
            .end(`Sorry, currently not handling ${request.method}`);
          return;
        }
        this.handleRequest(request, response);
      }
    );

    this.server.listen(port, () => {
      console.log("listening at port: ", port);
    });
  }

  private handleRequest(request: CustomRequest, response: CustomResponse) {
    if (request.method !== undefined) {
      const method = request.method as AllowedHTTPMethods;
      const baseUrl = `http://${request.headers.host}`;
      const url = new URL(request.url ?? "", baseUrl);
      const path = url.pathname;

      const globalMiddlewares = [
        ...this.globalProcessors["globals"],
        ...(this.globalProcessors[path] || []),
      ];
      const pathMiddlewares = this.processorsMap[method][path] || [];

      this.executeMiddleware(request, response, [
        ...globalMiddlewares,
        ...pathMiddlewares,
      ]);
    }
  }

  private nextFunctionCreator(
    request: CustomRequest,
    response: CustomResponse,
    middlewares: RequestProcessor[],
    nextIndex: number
  ) {
    return (error?: Error) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Internal server error: ${error.message}`);
      } else {
        if (nextIndex < middlewares.length) {
          this.executeMiddleware(request, response, middlewares, nextIndex);
        } else {
          if (!response.headersSent) {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.end("Not Found");
          }
        }
      }
    };
  }

  private executeMiddleware(
    request: CustomRequest,
    response: CustomResponse,
    middlewares: RequestProcessor[],
    nextIndex: number = 0
  ) {
    const currentMiddleware = middlewares[nextIndex];
    if (currentMiddleware) {
      try {
        currentMiddleware(
          request,
          response,
          this.nextFunctionCreator(
            request,
            response,
            middlewares,
            nextIndex + 1
          )
        );
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end(`Internal server error: ${(error as Error).message}`);
      }
    }
  }

  public get(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessor("GET", path, processors);
  }

  public post(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessor("POST", path, processors);
  }

  public put(path: string, ...processors: RequestProcessor[]) {}

  public patch(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessor("PATCH", path, processors);
  }

  public delete(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessor("DELETE", path, processors);
  }

  public use(processor: RequestProcessor): void;
  public use(path: string, processor: RequestProcessor): void;
  public use(arg1: string | RequestProcessor, arg2?: RequestProcessor): void {
    if (typeof arg1 === "string" && arg2) {
      if (!this.globalProcessors[arg1]) {
        this.globalProcessors[arg1] = [];
      }
      this.globalProcessors[arg1].push(arg2);
    } else if (typeof arg1 === "function") {
      this.globalProcessors["globals"].push(arg1);
    }
  }

  public registerProcessor(
    method: AllowedHTTPMethods,
    path: string,
    processor: RequestProcessor[]
  ) {
    if (!this.processorsMap[method][path]) {
      this.processorsMap[method][path] = [];
    }
    this.processorsMap[method][path].push(...processor);
  }
}
