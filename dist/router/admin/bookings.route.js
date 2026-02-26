import express from "express";
import * as controller from "../../controller/admin/bookings.controller.js";
const router = express.Router();
router.get("/", controller.index);
router.get("/detail/:id", controller.detail);
router.patch("/cancel/:id", controller.cancel);
export const bookingsRouter = router;
