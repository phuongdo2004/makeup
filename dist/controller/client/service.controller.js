import { Op } from "sequelize";
import Service from "../../model/service.model.js";
import Artist from "../../model/artist.model.js";
import Customer from "../../model/customer.model.js";
import Comment from "../../model/comment.model.js";
import Booking from "../../model/booking.model.js";
import { pagi } from "../../helpers/pagination.helper.js";
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
        }
        if (service["images"]) {
            service["images"] = (JSON.parse(service["images"]))[0];
        }
    }
    // tim khach hang
    const customer = res.locals.Customer;
    res.render("client/pages/service/index.pug", {
        services: services,
        pagination: pagination,
        customer: customer,
    });
};
// detail service start
// export const detail = async(req: Request, res: Response) => {
//   const id = req.params.id;
//   // 1. Tìm dịch vụ
//   const service = await Service.findOne({
//     where: { id: id }
//   });
//   console.log((service as any).price);
//   if (!service) {
//     return res.redirect("/services");
//   }
//   // 2. Xử lý mảng ảnh (QUAN TRỌNG)
//   if ((service as any).images) {
//     try {
//       // Parse chuỗi JSON từ DB thành mảng thực thụ
//       const allImages = JSON.parse((service as any).images);
//       // Tạo biến mới 'allImages' chứa mảng để Pug chạy vòng lặp 'each'
//       (service as any).allImages = allImages;
//       // Giữ 'images' là ảnh đầu tiên để các chỗ khác không bị lỗi hiển thị
//       (service as any).images = allImages[0];
//     } catch (e) {
//       console.log("Lỗi parse JSON images:", e);
//       (service as any).allImages = [(service as any).images];
//     }
//   }
//   // 3. Tìm Artist liên quan (Nhớ sửa lỗi 'experience' t nhắc lúc nãy)
//   const artist = await Artist.findOne({
//     where: {
//       id: (service as any).artist_id
//     },
//     attributes: ['name', 'address', 'phone', 'experience', 'id']
//   });
//   // 4. Render ra giao diện
//   res.render("client/pages/service/detail.pug", {
//     service: service,
//     artist: artist,
//   });
// }
export const detail = async (req, res) => {
    const id = req.params.id;
    // 1. Tìm dịch vụ (Giữ nguyên)
    const service = await Service.findOne({ where: { id: id } });
    if (!service)
        return res.redirect("/services");
    // 2. Xử lý mảng ảnh (Giữ nguyên)
    if (service.images) {
        try {
            const allImages = JSON.parse(service.images);
            service.allImages = allImages;
            service.images = allImages[0];
        }
        catch (e) {
            service.allImages = [service.images];
        }
    }
    // 3. Tìm Artist liên quan (Giữ nguyên)
    const artist = await Artist.findOne({
        where: { id: service.artist_id },
        attributes: ['name', 'address', 'phone', 'experience', 'id']
    });
    // 4. LẤY BÌNH LUẬN THEO KIỂU THỦ CÔNG (Không dùng include)
    // Lấy tất cả comment của dịch vụ này
    const rawReviews = await Comment.findAll({
        where: { service_id: id },
        order: [['created_at', 'DESC']],
        raw: true // Lấy dữ liệu thuần túy cho dễ xử lý
    });
    // Tạo một mảng mới để chứa comment đã có thông tin khách hàng
    const reviews = [];
    for (const review of rawReviews) {
        // Tìm khách hàng tương ứng với mỗi comment
        const customer = await Customer.findOne({
            where: { customer_id: review.customer_id },
            attributes: ['fullName', 'avatar'],
            raw: true
        });
        if (typeof customer.avatar === 'string') {
            // Nếu là chuỗi JSON mảng thì parse, nếu là chuỗi thường thì bọc vào mảng
            try {
                customer.avatar = (JSON.parse(customer.avatar))[0];
            }
            catch (e) {
                customer.avatar = [customer.avatar];
            }
        }
        // Gộp thông tin khách vào object review
        reviews.push({
            ...review,
            customer_name: customer ? customer.fullName : "Khách hàng",
            customer_avatar: customer ? customer.avatar : null
        });
    }
    // 4. LẤY DANH SÁCH LỊCH ĐÃ ĐẶT (Xử lý trùng giờ)
    // Lấy các booking của artist này mà chưa bị hủy
    const existingBookings = await Booking.findAll({
        where: {
            id_artist: artist.id,
        },
        attributes: ['booking_date', 'time_start', 'time_end'],
        raw: true
    });
    // 5. Render ra giao diện
    res.render("client/pages/service/detail.pug", {
        service: service,
        artist: artist,
        reviews: reviews // Giờ reviews đã có thêm customer_name và customer_avatar
        ,
        existingBookings: JSON.stringify(existingBookings) // Chuyển sang JSON để Script ở Frontend đọc được
    });
};
// detail service end
export const searchSuggest = async (req, res) => {
    console.log("chay vaof ");
    const keyword = req.query.keyword;
    console.log(keyword);
    try {
        const services = await Service.findAll({
            where: {
                name: {
                    [Op.like]: `%${keyword}%` // Tìm kiếm gần đúng
                },
                is_deleted: 0
            },
            limit: 5, // Chỉ lấy 5 gợi ý hàng đầu
            attributes: ['id', 'name', 'price', 'images']
        });
        for (const service of services) {
            if (service["images"]) {
                service["images"] = (JSON.parse(service["images"]))[0];
            }
        }
        console.log(services);
        res.json({ services });
    }
    catch (error) {
        res.status(500).json({ message: "Lỗi tìm kiếm" });
    }
};
export const toggleFavorite = async (req, res) => {
    const { serviceId } = req.body;
    const customer = res.locals.Customer; // Giả sử bạn đã lấy user từ middleware
    // Vì chúng ta đã dùng get() ở model, favorite_services sẽ là một Array
    let favorites = customer.favorites || [];
    if (typeof favorites === 'string')
        favorites = JSON.parse(favorites);
    if (favorites.includes(serviceId)) {
        // Nếu có rồi thì xóa đi (Unfavorite)
        favorites = favorites.filter(id => id !== serviceId);
    }
    else {
        // Nếu chưa có thì thêm vào
        favorites.push(serviceId);
    }
    // Cập nhật lại vào DB
    await Customer.update({ favorites: favorites }, { where: { customer_id: customer.customer_id } });
    res.json({ message: "Cập nhật yêu thích thành công", code: 200 });
};
export const favorite = async (req, res) => {
    const customer = res.locals.Customer;
    const favorite_services = customer.favorites || []; // Mảng các ID: ['id1', 'id2',...]
    // 1. Cấu hình phân trang
    const limit = 6; // Số lượng item mỗi trang
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    // 2. Lấy danh sách ID cho trang hiện tại
    // Việc cắt mảng giúp bạn biết chính xác trang này cần lấy những ID nào
    const idsForPage = favorite_services.slice(offset, offset + limit);
    let services = [];
    if (idsForPage.length > 0) {
        services = await Service.findAll({
            where: {
                id: {
                    [Op.in]: idsForPage // Tìm các Service có id nằm trong danh sách idsForPage
                },
                is_deleted: 0
            },
            raw: true
        });
        for (const service of services) {
            // / tim address 
            const artist = await Artist.findOne({
                where: {
                    id: service.artist_id,
                },
            });
            if (artist) {
                service.address = artist.address;
            }
            if (service["images"]) {
                service["images"] = (JSON.parse(service["images"]))[0];
            }
        }
    }
    // 3. Tính toán thông tin phân trang cho giao diện
    const totalPage = Math.ceil(favorite_services.length / limit);
    const pagination = {
        currentPage: page,
        limitItem: limit,
        totalPage: totalPage,
        skip: offset
    };
    res.render("client/pages/service/favorite.pug", {
        services: services,
        pagination: pagination, // Truyền sang để hiển thị nút số trang
        customer: customer
    });
};
export const review = async (req, res) => {
    try {
        const { service_id, rating, content } = req.body;
        const customer = res.locals.Customer;
        // Kiểm tra nếu khách hàng chưa đăng nhập
        if (!customer) {
            return res.json({
                code: 401,
                message: "Vui lòng đăng nhập để gửi đánh giá!"
            });
        }
        const customer_id = customer.customer_id;
        // Tạo bình luận mới
        const newComment = await Comment.create({
            customer_id: customer_id,
            service_id: service_id,
            content: content,
            rating: parseFloat(rating) || 5,
        });
        // Lưu vào Database (Nếu dùng Sequelize thì .create đã save rồi, 
        // nhưng nếu dùng mongoose/khác thì để chắc chắn có thể giữ .save)
        await newComment.save();
        // TRẢ VỀ JSON THAY VÌ REDIRECT
        res.json({
            code: 200,
            message: "Gửi bình luận thành công!"
        });
    }
    catch (error) {
        console.error(error);
        res.json({
            code: 500,
            message: "Có lỗi xảy ra trên hệ thống."
        });
    }
};
