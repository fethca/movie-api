import { Parser } from '@fethcat/logger'

interface IHttpResponse extends Record<string, unknown> {
  config?: Record<string, unknown>
}

export class HttpParser extends Parser<IHttpResponse> {
  parse(payload?: unknown) {
    if (this.isObject(payload))
      return {
        request: {
          url: super.parse([payload.config?.baseURL, payload.config?.url].filter(Boolean).join('')),
          method: payload.config?.method,
          data: super.parse(payload.config?.data),
        },
        response: {
          status: payload.status,
          statusText: payload.statusText,
          data: super.parse(payload.data),
        },
      }
  }
}

export class RequestParser extends Parser<Record<string, unknown>> {
  constructor(private withBody = false) {
    super()
  }

  parse(req?: unknown) {
    if (this.isObject(req)) {
      return {
        url: super.parse(req.url),
        params: super.parse(req.params),
        query: super.parse(req.query),
        ...(this.withBody && { body: super.parse(req.body) }),
      }
    }
  }
}
