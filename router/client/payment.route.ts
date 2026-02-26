import express, { NextFunction }  from "express";
import * as controller from "../../controller/client/payment.controller" ;
 import { Request, Response } from "express"; 

const router = express.Router();
router.post("/", controller.payment);
router.post("/callback", controller.paymentCallback);
export const paymentRouter = router ;
