import { HttpException, HttpStatus } from "@nestjs/common";

export class EnhancedHttpException extends HttpException {
  constructor(
    private readonly responseData: {
      statusCode: number;
      message: string;
      path: string;
      data?: any;
    },
    status: HttpStatus
  ) {
    super(responseData, status);
  }
}

export const createResponse = (
  statusCode: number,
  success: Boolean,
  message: string,
  data: any = null
) => {
  return {
    statusCode,
    success,
    message,
    data,
  };
};
