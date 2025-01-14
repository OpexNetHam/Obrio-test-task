export class ErrorWithPayload extends Error {
    payload?: Record<string, any>;
  
    constructor(message: string, payload?: Record<string, any>) {
      super(message);
      this.name = this.constructor.name;
      this.payload = payload;
  
      // Preserve the stack trace
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
 }