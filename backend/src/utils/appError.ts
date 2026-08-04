import {
  ErrorCodeEnumKeys,
  ErrorCodeEnums,
  HTTPSTATUS,
  HttpStatusCodeType,
} from './enums';

export class AppError extends Error {
  public statusCode: HttpStatusCodeType;
  public errorCode?: ErrorCodeEnumKeys;

  constructor(
    message: string,
    statusCode: HttpStatusCodeType,
    errorCode: ErrorCodeEnumKeys,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnAuthorizedAcsess extends AppError {
  constructor(message = 'Unauthorized Access', errorCode?: ErrorCodeEnumKeys) {
    super(
      message,
      HTTPSTATUS.UNAUTHORIZED,
      errorCode || ErrorCodeEnums.ACCESS_UNAUTHORIZED,
    );
  }
}

export class UnAuthorizedRequest extends AppError {
  constructor(message = 'Unauthorized Request', errorCode?: ErrorCodeEnumKeys) {
    super(
      message,
      HTTPSTATUS.UNAUTHORIZED,
      errorCode || ErrorCodeEnums.AUTH_UNAUTHORIZED_ACCESS,
    );
  }
}

export class BadRequest extends AppError {
  constructor(message = 'Bad Request', errorCode?: ErrorCodeEnumKeys) {
    super(
      message,
      HTTPSTATUS.BAD_REQUEST,
      errorCode || ErrorCodeEnums.VALIDATION_ERROR,
    );
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'InternalServerError', errorCode?: ErrorCodeEnumKeys) {
    super(
      message,
      HTTPSTATUS.INTERNAL_SERVER_ERROR,
      errorCode || ErrorCodeEnums.INTERNAL_SERVER_ERROR,
    );
  }
}
