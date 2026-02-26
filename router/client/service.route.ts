import express, { NextFunction }  from "express";
import * as controller from "../../controller/client/service.controller" ;
 import { Request, Response } from "express"; 

const router = express.Router();
router.get("/", controller.index);
router.get("/detail/:id", controller.detail);
router.get("/search-suggest", controller.searchSuggest);
router.post("/favorite/toggle", controller.toggleFavorite);
router.get("/favorite", controller.favorite);
router.post("/review", controller.review);
export const serviceRouter = router ;
