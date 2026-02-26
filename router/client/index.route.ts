import { Express } from "express";
import express from "express";
import { homeRouter } from "./home.route";
import { userRouter } from "./user.route";
import { serviceRouter } from "./service.route";
import { requireAuth } from "../../middleware/client/auth.middleware";
import { paymentRouter } from "./payment.route";
const app:Express = express();
export const clientRouter = (app:Express)=>{
  app.use("/user", userRouter);
  app.use(requireAuth);
  app.use("/home", homeRouter);
  app.use("/service", serviceRouter);
  app.use("/payment", paymentRouter);
  

}