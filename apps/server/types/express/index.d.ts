import type { JwtPayload } from "jsonwebtoken";
import { ITokenPayload } from "../../utils/tokens";

declare global {
  namespace Express {
    interface User {
      _id?: any;
      userId?: any;
      email?: string;
    }
    interface Request {
      user?: ITokenPayload | JwtPayload | Express.User;
    }
  }
}

export { };
