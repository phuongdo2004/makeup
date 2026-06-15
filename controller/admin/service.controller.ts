import { Request, Response } from "express";
import { system } from "../../config/system.js";
import Service from "../../model/service.model.js";
import Artist from "../../model/artist.model.js";
import { Op } from "sequelize";
import { pagi } from "../../helpers/pagination.helper.js";
import Booking from "../../model/booking.model.js"; // NHỚ IMPORT MODEL BOOKING VÀO ĐÂY


// [GET] /admin/services
export const index = async (req: Request, res: Response) => {
    try {
       const keyword = req.query.keyword as string || "";
        const whereCondition: any = { is_deleted: 0 };
        if (keyword) {
            whereCondition.name = { [Op.like]: `%${keyword}%` };
        }

        // Truyền whereCondition vào đây
        const pagination = await pagi(req, res, whereCondition);
        
        const services = await Service.findAll({
            where: whereCondition,
            limit: pagination.limitItem,
            offset: pagination.skip,
            raw: true
        });

        const processedServices = services.map(service => {
            let imageDisplay = "";
            if ((service as any).images) {
                try {
                    const imgs = JSON.parse((service as any).images);
                    imageDisplay = Array.isArray(imgs) ? imgs[0] : imgs;
                } catch (e) {
                    imageDisplay = (service as any).images; 
                }
            }

            return {
                ...service,
                images: imageDisplay,
                address: "Susannie Studio"
            };
        });

        res.render("admin/pages/service/index.pug", {
            services: processedServices,
            pagination: pagination,
            keyword: keyword,
            totalService: pagination.count,
            message: req.flash()
        });
    } catch (error) {
        console.error("Lỗi trang quản lý dịch vụ:", error);
        res.status(500).send("Lỗi hệ thống.");
    }
};
// [GET] /admin/services
// export const index = async (req: Request, res: Response) => {
//     try {
//         const pagination = await pagi(req, res);
        
//         // Chỉ lấy các trường hiện có trong Database sau khi em đã chạy SQL xóa cột
//         const services = await Service.findAll({
//             where: { is_deleted: 0 },
//             limit: (await pagination).limitItem,
//             offset: (await pagination).skip,
//             raw: true
//         });

//         // Xử lý dữ liệu an toàn để hiển thị ra danh sách
//         const processedServices = services.map(service => {
//             // 1. Xử lý ảnh an toàn (Lấy tấm đầu tiên)
//             let imageDisplay = "";
//             if ((service as any).images) {
//                 try {
//                     const imgs = JSON.parse((service as any).images);
//                     imageDisplay = Array.isArray(imgs) ? imgs[0] : imgs;
//                 } catch (e) {
//                     // Nếu không phải JSON (ví dụ link trực tiếp), dùng luôn link đó
//                     imageDisplay = (service as any).images; 
//                 }
//             }

//             // 2. Trả về object sạch, không còn rating hay artist_id
//             return {
//                 ...service,
//                 images: imageDisplay,
//                 address: "Susannie Studio" // Fix cứng vì đã xóa bảng Artist/artist_id
//             };
//         });

//         res.render("admin/pages/service/index.pug", {
//             services: processedServices,
//             pagination: pagination,
//             totalService: pagination.count,
//             message: req.flash()
//         });
//     } catch (error) {
//         console.error("Lỗi trang quản lý dịch vụ:", error);
//         res.status(500).send("Lỗi hệ thống: Dữ liệu bảng Service không khớp.");
//     }
// };
export const deleted = async (req: Request, res: Response) => {
  try {
    console.log("gdfugiosf");

    const id = req.params.id;

    if (!id) {
      req.flash("error2", "ID dịch vụ không hợp lệ!");
      return res.redirect(`/${system.prefixAdmin}/service`);
    }

    // ================= LOGIC KIỂM TRA LỊCH ĐẶT CHƯA HOÀN THÀNH =================
    // Tìm đơn đặt dịch vụ này đang ở trạng thái 'pending' (Chờ xác nhận) hoặc 'deposited' (Đã đặt cọc)
    const activeBooking = await Booking.findOne({
      where: {
        id_service: id, // Kiểm tra xem khóa ngoại liên kết dịch vụ là id_service hay service_id nha em
        is_deleted: 0,
        status: {
          [Op.in]: ["pending", "deposited"] // Các trạng thái lịch đặt chưa hoàn tất thanh toán
        }
      },
      raw: true
    });
    console.log("activeBooking khi xóa dịch vụ:", activeBooking);

    // Nếu tồn tại lịch hẹn chưa hoàn tất, chặn không cho xóa và phát thông báo lỗi
    if (activeBooking) {
        console.log("Không thể xóa dịch vụ vì còn lịch đặt chưa hoàn tất:", activeBooking);
      req.flash("error2", "Không thể xóa dịch vụ này vì hiện đang có lịch hẹn của khách hàng chưa hoàn tất");
      return res.redirect(`/${system.prefixAdmin}/service`);
    }
    // ===========================================================================

    // Nếu không vướng lịch đặt nào, tiến hành xóa mềm dịch vụ
    await Service.update(
      { is_deleted: 1 }, 
      { where: { id: id } }
    );

    req.flash("success", "Đã xóa dịch vụ thành công!");
    res.redirect(`/${system.prefixAdmin}/service`); 

  } catch (error) {
    console.error("Lỗi khi xử lý xóa dịch vụ:", error);
    req.flash("error2", "Có lỗi xảy ra ở hệ thống, không thể xóa dịch vụ!");
    res.redirect(`/${system.prefixAdmin}/service`);
  }
};
// [GET] /admin/service/create
export const create = async (req: Request, res: Response) => {
    try {
        // Lấy danh sách artist để chọn (Nếu không có artist thì trả về mảng rỗng)
        const artists = await Artist.findAll({ raw: true }) || [];
        res.render("admin/pages/service/create.pug", {
            message: req.flash(),
            artists: artists,
        });
    } catch (error) {
        res.render("admin/pages/service/create.pug", { artists: [] });
    }
}

// [POST] /admin/service/store
// export const store = async (req: Request, res: Response) => {
//     try {
//         const newService = req.body;
        
//         // Luôn đảm bảo lưu vào DB dưới dạng String của JSON
//         newService.amenities = JSON.stringify(req.body.amenities || "");
//         newService.images = JSON.stringify(req.body.images || []);

//         await Service.create(newService);
//         req.flash('success', 'Thêm dịch vụ thành công');
//         res.redirect(`${system.prefixAdmin}/services`);
//     } catch (error: any) {
//         console.error("LỖI SQL CHI TIẾT:", error.parent || error);
//         res.status(500).send("Lỗi lưu dịch vụ");
//     }
// }
// [POST] /admin/service/store
export const store = async (req: Request, res: Response) => {
  try {
    const newService = req.body;

    // 1. ÉP BUỘC thời lượng là 60 (Dù người dùng có gửi gì lên)
    newService.duration = 60;

    // 2. KIỂM TRA GIÁ (Phải >= 100.000)
    const price = parseInt(newService.price);
    if (!price || price < 100000) {
      req.flash('error', 'Giá dịch vụ phải ít nhất là 100.000 VNĐ');
      return res.redirect("back");
    }

    // 3. Xử lý dữ liệu khác
    newService.amenities = JSON.stringify(req.body.amenities || "");
    newService.images = JSON.stringify(req.body.images || []);

    console.log("Dữ liệu chuẩn hóa trước khi lưu:", newService);

    await Service.create(newService);
    
    req.flash('success', 'Thêm dịch vụ thành công');
    console.log("Dịch vụ mới đã được tạo thành công!");
    
    res.redirect("/admin/service");

  } catch (error: any) {
    console.error("LỖI SQL CHI TIẾT:", error);
    res.status(500).send("Lỗi hệ thống: " + error.message);
  }
}

// [GET] /admin/service/detail/:id
// export const detail = async (req: Request, res: Response) => {
//     try {
//         const id = req.params.id;
//         const service = await Service.findOne({
//             where: { id: id, is_deleted: 0 },
//             raw: true
//         });

//         if (!service) return res.redirect("back");

//         // Parse an toàn
//         try {
//             (service as any).images = JSON.parse((service as any).images || "[]");
//             (service as any).amenities = JSON.parse((service as any).amenities || "\"\"");
//         } catch (e) {}

//         const artist = await Artist.findOne({
//             where: { id: (service as any).artist_id },
//             raw: true
//         });

//         res.render("admin/pages/service/detail", {
//             service: service,
//             artistName: (artist as any)?.name || "N/A",
//         });
//     } catch (error) {
//         res.redirect("back");
//     }
// }

// [GET] /admin/service/detail/:id
export const detail = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        
        // Chỉ lấy các trường hiện có trong Database
        const service = await Service.findOne({
            where: { id: id, is_deleted: 0 },
            raw: true
        });

        if (!service) {
            req.flash('error', 'Không tìm thấy dịch vụ');
            return res.redirect("back");
        }

        // Parse JSON an toàn cho ảnh và tiện ích
        try {
            if ((service as any).images) {
                const parsedImages = JSON.parse((service as any).images);
                (service as any).images = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
            } else {
                (service as any).images = [];
            }

            if ((service as any).amenities) {
                const parsedAmenities = JSON.parse((service as any).amenities);
                (service as any).amenities = parsedAmenities;
            }
        } catch (e) {
            console.error("Lỗi parse JSON:", e);
        }

        res.render("admin/pages/service/detail.pug", {
            service: service,
            // Đã xóa phần tìm Artist vì cấu trúc bảng mới không còn dùng chung artist_id
        });
    } catch (error) {
        console.error("Lỗi trang chi tiết:", error);
        res.redirect("back");
    }
}
// [GET] /admin/service/edit/:id
// export const edit = async (req: Request, res: Response) => {
//     try {
//         const id = req.params.id;
//         const service = await Service.findOne({
//             where: { id: id, is_deleted: 0 },
//             raw: true
//         });

//         if (!service) return res.redirect("back");

//         // Parse dữ liệu cũ để hiện lên form
//         try {
//             (service as any).amenities = JSON.parse((service as any).amenities || "\"\"");
//             (service as any).images = JSON.parse((service as any).images || "[]");
//         } catch (e) {}

//         const artists = await Artist.findAll({ raw: true }) || [];

//         res.render("admin/pages/service/edit", {
//             service: service,
//             artists: artists,
//             message: req.flash()
//         });
//     } catch (error) {
//         res.redirect("back");
//     }
// }

// // [POST] /admin/service/edit/:id
// export const editPost = async (req: Request, res: Response) => {
//     try {
//         const id = req.params.id;
//         const dataUpdate = req.body;

//         // 1. Xử lý images
//         if (dataUpdate.images) {
//             dataUpdate.images = Array.isArray(dataUpdate.images) 
//                 ? JSON.stringify(dataUpdate.images) 
//                 : JSON.stringify([dataUpdate.images]);
//         }

//         // 2. Xử lý duration
//         if (dataUpdate.duration) {
//             dataUpdate.duration = parseInt(dataUpdate.duration.toString().replace(/\D/g, ''));
//         }

//         // 3. Xử lý amenities
//         dataUpdate.amenities = JSON.stringify(dataUpdate.amenities || "");

//         await Service.update(dataUpdate, { where: { id: id } });
        
//         req.flash("success", "Đã cập nhật thành công!");
//         res.redirect(`${system.prefixAdmin}/services`);
//     } catch (error) {
//         console.error("Lỗi Update:", error);
//         res.redirect("back");
//     }
// };
// [GET] /admin/service/edit/:id
export const edit = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const service = await Service.findOne({
            where: { id: id, is_deleted: 0 },
            raw: true
        });

        if (!service) return res.redirect(`/${system.prefixAdmin}/service`);

        // Parse dữ liệu để hiện lên form
        try {
            if ((service as any).images) {
                const parsedImgs = JSON.parse((service as any).images);
                (service as any).images = Array.isArray(parsedImgs) ? parsedImgs : [parsedImgs];
            } else {
                (service as any).images = [];
            }
            
            // Nếu amenities là chuỗi JSON thì parse, không thì để nguyên
            if ((service as any).amenities) {
                try {
                    (service as any).amenities = JSON.parse((service as any).amenities);
                } catch (e) { /* để nguyên chuỗi */ }
            }
        } catch (e) {
            console.error("Lỗi parse dữ liệu Edit:", e);
        }

        res.render("admin/pages/service/edit", {
            service: service,
            message: req.flash()
        });
    } catch (error) {
        res.redirect("back");
    }
}

// [PATCH] /admin/service/edit/:id
// export const editPost = async (req: Request, res: Response) => {
//     try {
//         const id = req.params.id;
//         const dataUpdate = req.body;

//         // 1. Xử lý images (Giữ ảnh cũ nếu không chọn ảnh mới)
//         // Kiểm tra nếu có dữ liệu images từ middleware upload gửi lên
//         if (dataUpdate.images && dataUpdate.images.length > 0) {
//             dataUpdate.images = Array.isArray(dataUpdate.images) 
//                 ? JSON.stringify(dataUpdate.images) 
//                 : JSON.stringify([dataUpdate.images]);
//         } else {
//             /**
//              * QUAN TRỌNG: Nếu người dùng không chọn ảnh mới, 
//              * ta xóa luôn key 'images' ra khỏi đối tượng update.
//              * Như vậy Sequelize sẽ không tác động đến cột images trong DB.
//              */
//             delete dataUpdate.images;
//         }

//         // 2. Xử lý duration & price (Ép kiểu số)
//         if (dataUpdate.duration) dataUpdate.duration = parseInt(dataUpdate.duration);
//         if (dataUpdate.price) dataUpdate.price = parseInt(dataUpdate.price);

//         // 3. Xử lý amenities
//         // Lưu ý: Nếu bạn muốn lưu dạng chuỗi để hiện lên textarea thì không cần stringify,
//         // nhưng nếu DB yêu cầu JSON thì giữ nguyên dòng dưới.
//         dataUpdate.amenities = JSON.stringify(dataUpdate.amenities || "");

//         // Thực hiện cập nhật
//         await Service.update(dataUpdate, { where: { id: id } });
        
//         req.flash("success", "Đã cập nhật thành công!");
//         res.redirect(`/${system.prefixAdmin}/service`);
        
//     } catch (error) {
//         console.error("Lỗi Update:", error);
//         req.flash("error", "Cập nhật thất bại!");
//         res.redirect("back");
//     }
// };
export const editPost = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const dataUpdate = req.body;

    // QUAN TRỌNG: Kiểm tra xem middleware có gửi ảnh mới về không
    if (dataUpdate.images && dataUpdate.images.length > 0) {
      // Nếu có ảnh mới (là mảng URL), ta stringify để lưu vào DB (cột longtext)
      dataUpdate.images = JSON.stringify(dataUpdate.images);
    } else {
      // Nếu KHÔNG có ảnh mới (req.body.images undefined), 
      // ta XÓA LUÔN cái key này để Sequelize không update đè giá trị NULL vào DB
      delete dataUpdate.images;
    }

    // Các trường khác xử lý bình thường
    if (dataUpdate.price) dataUpdate.price = parseInt(dataUpdate.price);
    if (dataUpdate.duration) dataUpdate.duration = parseInt(dataUpdate.duration);
    
    // Amenities nếu lưu JSON thì stringify, nếu lưu text thì để nguyên
    // dataUpdate.amenities = JSON.stringify(dataUpdate.amenities || "");

    await Service.update(dataUpdate, { where: { id: id } });

    req.flash("success", "Cập nhật dịch vụ thành công!");
    res.redirect(`/admin/service`);
  } catch (error) {
    console.error("Lỗi Controller Edit:", error);
    res.redirect("back");
  }
};
// [PATCH] /admin/service/delete/:id
// export const deleted = async(req: Request, res: Response) => {
//     try {
//         const id = req.params.id;

//         // Cập nhật trạng thái xóa
//         await Service.update(
//             { is_deleted: 1 }, 
//             { where: { id: id } }
//         );

//         req.flash("success", "Đã xóa dịch vụ thành công!");
        
//         // CHỈNH TẠI ĐÂY: Quay về trang danh sách thay vì quay lại trang detail đã mất
//         res.redirect(`/${system.prefixAdmin}/service`); 

//     } catch (error) {
//         console.error("Lỗi khi xóa:", error);
//         res.redirect(`/${system.prefixAdmin}/service`);
//     }
// }