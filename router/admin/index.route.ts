import { Express } from "express";
import express, { NextFunction }  from "express";
import { dashboardRouter} from "./dashboard.route";
import {system} from "../../config/system.js";
import multer from "multer";

// const upload = multer({ storage: multer.memoryStorage() });
// // import { userRouter } from "./user.route";
import { profileRouter } from "./profile.route";
import { serviceRouter } from "./service.route";
import { bookingsRouter } from "./bookings.route";
import { customerRouter } from "./customers.route";
import { reviewsRouter } from "./reviews.route";
import { userRouter } from "./user.route";
import { artistRouter } from "./artist.route";
import { requireAuth } from "../../middleware/admin/auth.middlewares.js";
export const adminRouter = async(app:Express)=>{
  
  app.use(`/${system.prefixAdmin}/auth`, userRouter);
  app.use(`/${system.prefixAdmin}/dashboard`,requireAuth, dashboardRouter);
  app.use(`/${system.prefixAdmin}/service`,requireAuth,serviceRouter);
  app.use(`/${system.prefixAdmin}/profile`,requireAuth, profileRouter);
  app.use(`/${system.prefixAdmin}/bookings`,requireAuth,bookingsRouter);
  app.use(`/${system.prefixAdmin}/customers`, requireAuth,customerRouter);
  app.use(`/${system.prefixAdmin}/reviews`, requireAuth,reviewsRouter);
  app.use(`/${system.prefixAdmin}/artists`, requireAuth,artistRouter);
}