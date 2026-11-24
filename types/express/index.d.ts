import { ILogger } from '@fethcat/logger'
import http from 'http'
import { JwtPayload } from 'jsonwebtoken'

declare module 'express-serve-static-core' {
  export interface Request extends http.IncomingMessage, Express.Request {}
}

declare global {
  namespace Express {
    interface Request {
      logger: ILogger<string>
      currentUser?: string | JwtPayload
    }
  }
}
