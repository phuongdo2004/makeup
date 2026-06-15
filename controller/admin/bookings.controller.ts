import { Request, Response } from "express";
import { pagi } from "../../helpers/pagination.helper.js";
import Booking from "../../model/booking.model.js";
import Customer from "../../model/customer.model.js";
import Service from "../../model/service.model.js";
import { system } from "../../config/system.js";
import Artist from "../../model/artist.model.js"; 
import { Op } from "sequelize"; // Đã thêm Op để dùng toán tử Like và In

export const index = async (req: Request, res: Response) => {
  try {
    const limit = 4;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    // 1. Lấy từ khóa tìm kiếm từ URL query (nếu có)
    const keyword = (req.query.keyword as string) || "";

    // 2. Khởi tạo object điều kiện tìm kiếm cho bảng Booking
    const findCondition: any = {
      is_deleted: 0
    };

    // NẾU CÓ TỪ KHÓA TÌM KIẾM: Xử lý tìm kiếm theo tên khách hàng
    if (keyword) {
      // Tìm các khách hàng có tên chứa từ khóa
      const matchingCustomers = await Customer.findAll({
        where: {
          fullName: {
            [Op.like]: `%${keyword}%`
          }
        },
        attributes: ['customer_id'],
        raw: true
      });

      // Gom tất cả customer_id tìm được thành một mảng
      const customerIds = matchingCustomers.map((c: any) => c.customer_id);

      // Ép bảng Booking chỉ tìm những đơn đặt có id_customer nằm trong mảng trên
      findCondition.id_customer = {
        [Op.in]: customerIds
      };
    }

    // 3. Tính toán phân trang dựa trên điều kiện lọc động (findCondition)
    const countBookings = await Booking.count({ where: findCondition });
    const totalPage = Math.ceil(countBookings / limit);

    const pagination = {
      currentPage: page,
      limitItem: limit,
      totalPage: totalPage,
      skip: offset
    };

    // 4. Lấy danh sách lịch đặt theo bộ lọc tìm kiếm và phân trang
    const bookings = await Booking.findAll({
      limit: pagination.limitItem,
      offset: pagination.skip,
      raw: true,
      where: findCondition, // Đã truyền findCondition động vào đây
      order: [['created_at', 'DESC']],
    });

    // 5. Đổ dữ liệu chi tiết Khách hàng, Dịch vụ vào từng đơn đặt
    if (bookings.length > 0) {
      for (const booking of bookings) {
        const customer = await Customer.findOne({
          where: { customer_id: (booking as any).id_customer },
          attributes: ['fullName', 'phone'],
          raw: true
        }) as any;

        if (customer) {
          (booking as any).fullName = customer.fullName;
          (booking as any).phone = customer.phone;
        } else {
          (booking as any).fullName = "Khách vãng lai";
          (booking as any).phone = "N/A";
        }

        const service = await Service.findOne({
          where: { id: (booking as any).id_service },
          attributes: ['name'],
          raw: true
        }) as any;

        (booking as any).serviceName = service ? service.name : "Dịch vụ không tồn tại";

        const statusMap: { [key: string]: { label: string, class: string } } = {
          'pending': { label: 'Chờ xác nhận', class: 'bg-yellow-100 text-yellow-700' },
          'paid': { label: 'Đã thanh toán', class: 'bg-green-100 text-green-700' },
          'deposited': { label: 'Đã đặt cọc', class: 'bg-blue-100 text-blue-700' }
        };

        const currentStatus = (booking as any).status;
        (booking as any).statusDisplay = statusMap[currentStatus]?.label || 'Không xác định';
        (booking as any).statusClass = statusMap[currentStatus]?.class || 'bg-gray-100 text-gray-700';
      }
    }

    // 6. Render ra view kèm từ khóa tìm kiếm để giữ chữ trong ô input
    res.render("admin/pages/bookings/index.pug", {
      bookings: bookings,
      message: req.flash(),
      pagination: pagination,
      keyword: keyword // Truyền biến này để file Pug nhận diện hiển thị lên ô tìm kiếm
    });

  } catch (error) {
    console.error("Lỗi tại controller bookings:", error);
    res.status(500).send("Có lỗi xảy ra ở hệ thống!");
  }
};
/**
 * [POST] /admin/bookings/cancel/:id
 * Quyền Admin: Xóa mềm đơn đặt lịch hẹn làm tóc (Ẩn khỏi danh sách)
 */

export const detail = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; 

    const booking = await Booking.findOne({
      where: { id: id, is_deleted: 0 },
      raw: true
    }) as any;

    if (!booking) {
      req.flash("error", "Không tìm thấy lịch đặt!");
      return res.redirect("back");
    }

    // 1. Tìm thông tin khách hàng
    const customer = await Customer.findOne({
      where: { customer_id: booking.id_customer },
      raw: true
    }) as any;

    // 2. Tìm thông tin dịch vụ
    const service = await Service.findOne({
      where: { id: booking.id_service },
      raw: true
    }) as any;

    // 3. PHẦN THÊM MỚI: Tìm thông tin chuyên viên dựa trên id_artist từ lịch đặt
    const artist = await Artist.findOne({
      where: { id: booking.id_artist },
      attributes: ["name"], // Chỉ lấy cột name cho nhẹ
      raw: true
    }) as any;

    const statusMap: any = {
      'pending': { label: 'Chờ xác nhận', class: 'bg-yellow-100 text-yellow-700' },
      'paid': { label: 'Đã thanh toán', class: 'bg-green-100 text-green-700' },
      'deposited': { label: 'Đã đặt cọc', class: 'bg-blue-100 text-blue-700' },
      'cancelled': { label: 'Đã hủy lịch', class: 'bg-red-100 text-red-700' }
    };

    // Tính toán số tiền đã trả tạm thời dựa vào trạng thái
    let paidAmount = Number(booking.deposit || 0);
    if (booking.status === "paid") {
      paidAmount = Number(booking.price || 0);
    }

    const displayData = {
      ...booking,
      customerName: customer ? customer.fullName : "N/A",
      customerPhone: customer ? customer.phone : "N/A",
      serviceName: service ? service.name : "N/A",
      
      // Gán tên chuyên viên vào dữ liệu hiển thị (Nếu không tìm thấy thợ thì hiện N/A)
      artistName: artist ? artist.name : "N/A", 

      statusLabel: statusMap[booking.status]?.label || booking.status,
      statusClass: statusMap[booking.status]?.class || 'bg-gray-100',
      
      // Định dạng chuỗi số tiền gửi qua giao diện Pug
      priceDisplay: Number(booking.price || 0).toLocaleString('vi-VN'),
      depositDisplay: Number(booking.deposit || 0).toLocaleString('vi-VN'),
      paidDisplay: paidAmount.toLocaleString('vi-VN'),
      remainingDisplay: Number(booking.remaining_balance || 0).toLocaleString('vi-VN')
    };

    res.render("admin/pages/bookings/detail.pug", {
      booking: displayData
    });

  } catch (error) {
    console.error("Error in booking detail:", error);
    req.flash("error", "Đã xảy ra lỗi hệ thống!");
    res.redirect("back");
  }
};
// [POST/PATCH] /admin/bookings/cancel/:id
// export const cancel = async (req: Request, res: Response) => {
//   const id = req.params.id as string; // Thêm "as string" sửa lỗi TS
  
//   await Booking.update({ is_deleted: 1 }, {
//     where: { id: id }
//   });
  
//   req.flash("success", "Hủy lịch đặt thành công!");
//   res.redirect(`/${system.prefixAdmin}/bookings`);
// };

// [POST/PATCH] /admin/bookings/change-status/:id
export const changeStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // Thêm "as string" sửa lỗi TS
    const status = req.body.status;

    const updateData: any = { status: status };

    // Tự động xử lý tiền nợ (remaining_balance) theo logic đơn giản
    if (status === "paid") {
      updateData.remaining_balance = 0; // Hoàn thành thì xóa nợ về 0
    } else if (status === "deposited") {
      const booking = await Booking.findByPk(id);
      if (booking) {
        const price = Number(booking.get("price") || 0);
        const deposit = Number(booking.get("deposit") || 0);
        updateData.remaining_balance = price - deposit; // Tính lại nợ gốc ban đầu
      }
    }

    await Booking.update(updateData, {
      where: { id: id }
    });

    req.flash("success", "Cập nhật trạng thái thành công!");
    res.redirect(`/admin/bookings/detail/${id}`);

  } catch (error) {
    console.error("❌ Lỗi tại changeStatus controller:", error);
    req.flash("error", "Có lỗi xảy ra khi cập nhật trạng thái.");
    res.redirect(`/admin/bookings`);
  }
};