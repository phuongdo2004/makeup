import express, { NextFunction }  from "express";
import * as controller from "../../controller/client/bookings.controller.js";
 import { Request, Response } from "express"; 

const router = express.Router();
router.get("/history", controller.history);
router.get("/detail/:id", controller.getBookingDetail);
router.post("/cancel/:id", controller.cancelBooking);

export const bookingsRouter = router ;
