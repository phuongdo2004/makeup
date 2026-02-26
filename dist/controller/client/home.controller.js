import Service from "../../model/service.model.js";
import Artist from "../../model/artist.model.js";
export const index = async (req, res) => {
    try {
        const services = await Service.findAll({ limit: 3 });
        for (const service of services) {
            // tim address 
            const artist = await Artist.findOne({
                where: {
                    id: service.artist_id,
                }
            });
            if (artist) {
                service.address = artist.address;
            }
            if (service["images"]) {
                service["images"] = (JSON.parse(service["images"]))[0];
            }
        }
        const customer = res.locals.Customer;
        res.render("client/pages/home/index.pug", {
            services: services,
            message: req.flash(),
            customer: customer,
        });
    }
    catch (error) {
        res.status(500).send("Lỗi máy chủ");
    }
};
