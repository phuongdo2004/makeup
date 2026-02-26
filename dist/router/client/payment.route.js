import express from "express";
import * as controller from "../../controller/client/payment.controller.js";
const router = express.Router();
router.post("/", controller.payment);
router.post("/callback", controller.paymentCallback);
export const paymentRouter = router;
