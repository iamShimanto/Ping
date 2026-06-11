import express from "express";
const app = express();
import routes from "./routes";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
const dns = require("dns");
import { env } from "@repo/config";
import { errorHandler } from "./middleware/errorHandler";
import passport from "./config/passport";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dns.setServers(["1.1.1.1", "1.0.0.1"]);
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      env.CLIENT_URL1,
      env.CLIENT_URL2,
      env.CLIENT_URL3,
      env.CLIENT_URL4,
    ],
    credentials: true,
  }),
);
app.use(routes);

app.use(errorHandler);

export default app;
