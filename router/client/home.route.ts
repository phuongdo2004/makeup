import express, { NextFunction }  from "express";
import * as controller from "../../controller/client/home.controller" ;
 import { Request, Response } from "express"; 

const router = express.Router();
router.get("/", controller.index);


export const homeRouter = router ;
