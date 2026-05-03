import { system } from "../../config/system.js";
import Service from "../../model/service.model.js";
import Artist from "../../model/artist.model.js";
import { pagi } from "../../helpers/pagination.helper.js";
// [GET] index start
export const index = async (req, res) => {
    const pagination = await pagi(req, res);
    const services = await Service.findAll({
        where: {
            is_deleted: 0
        }, limit: (await pagination).limitItem,
        offset: (await pagination).skip,
        raw: true
    });
    for (const service of services) {
        // tim address 
        const artist = await Artist.findOne({
            where: {
                id: service.artist_id,
            },
        });
        if (artist) {
            service.address = artist.address;
            service.artist_fullName = artist.name;
        }
        if (service["images"]) {
            service["images"] = (JSON.parse(service["images"]))[0];
        }
    }
    // tim khach hang
    res.render("admin/pages/service/index.pug", {
        services: services,
        pagination: pagination,
        totalService: pagination.count,
    });
};
// [GET] create start
export const create = async (req, res) => {
    const artists = await Artist.findAll();
    // message: req.flash()
    res.render("admin/pages/service/create.pug", {
        message: req.flash(),
        artists: artists,
    });
};
// [GET] create end
// [POST] store start 
export const store = async (req, res) => {
    try {
        const newService = req.body;
        newService.amenities = JSON.stringify(req.body.amenities);
        newService.images = JSON.stringify(req.body.images);
        // Kiểm tra xem nanoid có tạo ra ID không
        console.log("Dữ liệu trước khi lưu:", newService);
        await Service.create(newService);
        req.flash('success', 'Thêm dịch vụ thành công');
        // Sử dụng biến "back" không có dấu ngoặc kép nếu muốn dùng alias của Express
        // Hoặc dùng req.get('Referrer') để chắc chắn
        res.redirect(req.get('Referrer') || `${system.prefixAdmin}/services`);
    }
    catch (error) {
        // QUAN TRỌNG: Log này sẽ hiện thông báo lỗi CHI TIẾT từ MySQL
        console.error("LỖI SQL CHI TIẾT:", error.parent || error);
        res.status(500).send("Lỗi hệ thống: " + error.message);
    }
};
// get detail start
export const detail = async (req, res) => {
    // console.log("service detail controller");
    const id = req.params.id;
    const service = await Service.findOne({
        where: {
            id: id,
            is_deleted: 0,
        },
        raw: true
    });
    // console.log(service);
    if (service["images"]) {
        service["images"] = (JSON.parse(service["images"]));
    }
    service.amenities = JSON.parse(service.amenities);
    const artist = await Artist.findOne({
        where: {
            id: service.artist_id,
        },
        raw: true
    });
    res.render("admin/pages/service/detail", {
        service: service,
        artistName: artist?.name || "",
    });
};
// get detail end
// get edit start
export const edit = async (req, res) => {
    const id = req.params.id;
    const service = await Service.findOne({
        where: {
            id: id,
            is_deleted: 0,
        },
        raw: true
    });
    if (service) {
        service.amenities = JSON.parse(service.amenities);
    }
    if (service["images"]) {
        service["images"] = (JSON.parse(service["images"]));
    }
    res.render("admin/pages/service/edit", {
        service: service,
        message: req.flash()
    });
};
// get edit end
// [POST] edit start
export const editPost = async (req, res) => {
    try {
        const id = req.params.id;
        // 1. Xử lý images (Bắt buộc phải Stringify mảng ảnh)
        if (req.body.images && Array.isArray(req.body.images)) {
            req.body.images = JSON.stringify(req.body.images);
        }
        // 2. Xử lý amenities (Nếu rỗng thì cho về null để tránh lỗi Constraint)
        if (!req.body.amenities || req.body.amenities.trim() === "") {
            req.body.amenities = null;
        }
        // 3. Xử lý duration (Xóa chữ "phút" nếu có để tránh lỗi kiểu INTEGER)
        if (req.body.duration) {
            req.body.duration = parseInt(req.body.duration.toString().replace(/\D/g, ''));
        }
        // Trong controller editPost
        if (req.body.amenities) {
            // Biến chuỗi text thành một mảng để hợp lệ hóa nếu DB bắt check JSON
            req.body.amenities = JSON.stringify(req.body.amenities);
        }
        await Service.update(req.body, {
            where: { id: id }
        });
        req.flash("success", "Đã cập nhật thành công!");
        res.redirect(`/${system.prefixAdmin}/service`);
    }
    catch (error) {
        console.error("Lỗi Update chi tiết:", error);
    }
};
// [POST] edit end
// [PATCH] delete
export const deleted = async (req, res) => {
    const id = req.params.id;
    await Service.update(req.body, {
        where: { id: id }
    });
    await Service.update({ is_deleted: 1 }, { where: {
            id: id
        } });
    req.flash("success", "Đã xóa dịch vụ thành công!");
    res.redirect(`/${system.prefixAdmin}/service`);
};
