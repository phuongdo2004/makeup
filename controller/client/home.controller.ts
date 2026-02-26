import {Request , Response} from "express";
import Customer from "../../model/customer.model.js";
import Service from "../../model/service.model.js";
import Artist from "../../model/artist.model.js";

export const index = async( req :Request, res:Response) => {
  try {
      const services = await Service.findAll({limit: 3});
        for (const service of services) {
// tim address 
const artist = await Artist.findOne({
  where:{
    id: (service as any).artist_id,
  }
});

if(artist){
  (service as any).address = (artist as any).address;
}
    if ((service as any)["images"]) {
      (service as any)["images"] = (JSON.parse((service as any)["images"]))[0];

    }
    
    
  
  }
  const customer = res.locals.Customer;

res.render("client/pages/home/index.pug", {
  services: services,
  message: req.flash(),
  customer:customer,
});
  
  } catch (error) {
    res.status(500).send("Lỗi máy chủ");
  }

}