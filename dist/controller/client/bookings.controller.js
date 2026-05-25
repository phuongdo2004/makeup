import Booking from "../../model/booking.model.js";
/**
 * [GET] /bookings/history
 * Lấy danh sách lịch sử đặt lịch của Khách hàng hiện tại
 */
export const history = async (req, res) => {
    try {
        // 1. Lấy trực tiếp thông tin khách hàng từ res.locals đã được middleware bóc tách sẵn
        const currentCustomer = res.locals.Customer;
        if (!currentCustomer || !currentCustomer.customer_id) {
            res.redirect("/user/login");
            return;
        }
        // 2. Dùng await lấy danh sách lịch đặt theo đúng id_customer của người này
        const bookings = await Booking.findAll({
            where: {
                id_customer: currentCustomer.customer_id,
                is_deleted: 0 // Chỉ lấy những lịch hẹn chưa bị xóa ẩn
            },
            order: [["booking_date", "DESC"], ["slot_time", "DESC"]],
            raw: true // Chuyển thành object thuần để đẩy sang Pug cho mượt
        });
        // 3. Render giao diện và truyền mảng bookings sang file Pug
        // Lưu ý: Ở file Pug, em có thể dùng thẳng #{Customer.fullName} để hiển thị tên mà không cần qua vòng lặp.
        res.render("client/pages/bookings/history.pug", {
            pageTitle: "Lịch sử đặt lịch",
            bookings: bookings
        });
    }
    catch (error) {
        console.error("Lỗi khi lấy lịch sử đặt lịch:", error);
        res.redirect("/");
    }
};
/**
 * [GET] /bookings/detail/:id
 * Xem chi tiết một lịch đặt cụ thể của khách hàng
 */
export const getBookingDetail = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const currentCustomer = res.locals.Customer;
        if (!currentCustomer || !currentCustomer.customer_id) {
            res.redirect("/user/login");
            return;
        }
        // 1. Tìm lịch đặt dựa vào ID trên URL và phải thuộc về khách hàng đang đăng nhập
        const booking = await Booking.findOne({
            where: {
                id: bookingId,
                id_customer: currentCustomer.customer_id,
                is_deleted: 0 // Lịch hẹn chưa bị xóa ẩn
            },
            raw: true // Lấy object thuần để truyền sang giao diện cho nhẹ
        });
        // 2. Nếu không tìm thấy lịch hẹn hoặc lịch hẹn của người khác
        if (!booking) {
            req.flash("error", "Không tìm thấy thông tin lịch hẹn hoặc em không có quyền xem!");
            res.redirect("/bookings/history");
            return;
        }
        // 3. Render giao diện chi tiết lịch đặt
        res.render("client/pages/bookings/detail", {
            pageTitle: `Chi tiết lịch hẹn`,
            booking: booking
        });
    }
    catch (error) {
        console.error("Lỗi khi lấy chi tiết lịch đặt:", error);
        req.flash("error", "Đã xảy ra lỗi hệ thống khi tải chi tiết lịch hẹn!");
        res.redirect("/bookings/history");
    }
};
