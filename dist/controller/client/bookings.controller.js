import Booking from "../../model/booking.model.js";
import Artist from "../../model/artist.model.js"; // Import trực tiếp model Artist
/**
 * [GET] /bookings/history
 * Lấy danh sách lịch sử đặt lịch của Khách hàng hiện tại
 */
export const history = async (req, res) => {
    try {
        const currentCustomer = res.locals.Customer;
        if (!currentCustomer || !currentCustomer.customer_id) {
            res.redirect("/user/login");
            return;
        }
        // 1. Lấy danh sách lịch đặt thuần
        const bookings = await Booking.findAll({
            where: {
                id_customer: currentCustomer.customer_id,
                is_deleted: 0
            },
            order: [["booking_date", "DESC"], ["slot_time", "DESC"]],
            raw: true
        });
        // 2. Chạy vòng lặp bổ sung tên chuyên viên cho từng booking (Cách thủ công đơn giản)
        for (const booking of bookings) {
            if (booking.id_artist) {
                const artist = await Artist.findOne({
                    where: { id: booking.id_artist },
                    attributes: ["name"],
                    raw: true
                });
                // Gán trực tiếp thuộc tính artist_name vào object booking hiện tại
                booking.artist_name = artist ? artist.name : "Chưa phân bổ";
            }
            else {
                booking.artist_name = "Chưa phân bổ";
            }
        }
        res.render("client/pages/bookings/history.pug", {
            pageTitle: "Lịch sử đặt lịch",
            bookings: bookings,
            message: req.flash()
        });
    }
    catch (error) {
        console.error("Lỗi khi lấy lịch sử đặt lịch:", error);
        res.redirect("/");
    }
};
export const cancelBooking = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            req.flash("error2", "Mã lịch đặt không hợp lệ!");
            return res.redirect("/bookings/history");
        }
        // 1. Tìm đơn đặt lịch còn hoạt động của khách hàng
        const booking = await Booking.findOne({
            where: {
                id: id,
                is_deleted: 0
            }
        });
        if (!booking) {
            req.flash("error2", "Không tìm thấy lịch hẹn hoặc lịch hẹn này đã bị xóa trước đó!");
            return res.redirect("/bookings/history");
        }
        // 2. Bảo mật logic 22Client: Nếu đã làm xong và thanh toán 'paid' thì không cho khách tự xóa nữa
        if (booking.status === "paid") {
            req.flash("error2", "Lịch hẹn đã được thanh toán hoàn tất tại salon, không thể hủy bỏ!");
            return res.redirect(`/bookings/detail/${id}`);
        }
        // 3. Tiến hành XÓA MỀM (Cập nhật is_deleted = 1)
        await Booking.update({ is_deleted: 1 }, { where: { id: id } });
        req.flash("success", "Bạn đã hủy lịch hẹn thành công!");
        // Sau khi xóa mềm thành công, đơn này sẽ biến mất khỏi danh sách lịch sử
        res.redirect("/bookings/history");
    }
    catch (error) {
        console.error("Lỗi tại client controller cancelBooking:", error);
        req.flash("error2", "Hệ thống gặp sự cố, vui lòng thử lại sau!");
        res.redirect("/bookings/history");
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
        // 1. Tìm lịch đặt của khách hàng
        const booking = await Booking.findOne({
            where: {
                id: bookingId,
                id_customer: currentCustomer.customer_id,
                is_deleted: 0
            },
            raw: true
        });
        if (!booking) {
            req.flash("error", "Không tìm thấy thông tin lịch hẹn hoặc em không có quyền xem!");
            res.redirect("/bookings/history");
            return;
        }
        // 2. Tìm tên của chuyên viên dựa vào id_artist lấy được từ booking trên
        let artistName = "Chưa phân bổ";
        if (booking.id_artist) {
            const artist = await Artist.findOne({
                where: { id: booking.id_artist },
                attributes: ["name"],
                raw: true
            });
            if (artist) {
                artistName = artist.name;
            }
        }
        res.render("client/pages/bookings/detail", {
            pageTitle: `Chi tiết lịch hẹn`,
            booking: booking,
            artistName: artistName // Truyền trực tiếp chuỗi tên thợ sang view
        });
    }
    catch (error) {
        console.error("Lỗi khi lấy chi tiết lịch đặt:", error);
        req.flash("error", "Đã xảy ra lỗi hệ thống khi tải chi tiết lịch hẹn!");
        res.redirect("/bookings/history");
    }
};
