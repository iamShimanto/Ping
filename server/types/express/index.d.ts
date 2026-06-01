import type { JwtPayload } from "jsonwebtoken";
import { ITokenPayload } from "../../utils/tokens";

declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload | JwtPayload;
    }
  }
}

export { };
