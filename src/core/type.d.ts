import { IncomingMessage, ServerResponse } from "http";

type NextFunction = (error?: any) => void;

interface CustomResponse extends ServerResponse {
  json: (data: any) => void;
  send: (data: any) => void;
  status: (statusCode: number) => CustomResponse;
  redirect: (url: string) => void;
  render: (view: string, data?: Record<string, any>) => void;
}

export interface ExtendedRequest extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  files?: any;
  cookies?: Record<string, string>;
}

type Handler = (
  req: ExtendedRequest,
  res: CustomResponse,
  next: NextFunction
) => void;

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

type ErrorHandler = (
  err: any,
  req: ExtendedRequest,
  res: CustomResponse,
  next: NextFunction
) => void;

interface MultipartOptions {
  limits?: {
    fileSize?: number;
  };
  allowedMimeTypes?: string[];
}
