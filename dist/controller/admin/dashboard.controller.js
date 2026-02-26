import User from "../../model/user.model.js";
import Service from "../../model/service.model.js";
import Booking from "../../model/booking.model.js";
import Customer from "../../model/customer.model.js";
import { Op } from 'sequelize';
export const index = async (req, res) => {
    // --- 0. Thông tin User & Auth ---
    const user = await User.findOne({
        where: { tokenUser: req.cookies.token },
        raw: true
    });
    if (user && user.avatar) {
        try {
            user.avatar = JSON.parse(user.avatar);
        }
        catch { }
    }
    else if (user) {
        user.avatar = "/uploads/avatar-default.jpg";
    }
    // --- 1. Tính toán thống kê (Tháng hiện tại) ---
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // A. Doanh thu tháng (Chỉ tính các lịch đã thanh toán hoặc đặt cọc)
    const revenueData = await Booking.sum('price', {
        where: {
            status: ['paid', 'deposited'],
            is_deleted: 0,
            created_at: { [Op.gte]: startOfMonth }
        }
    }) || 0;
    // B. Tổng lịch đặt mới (Trong tháng này)
    const newBookingsCount = await Booking.count({
        where: {
            is_deleted: 0,
            created_at: { [Op.gte]: startOfMonth }
        }
    });
    // C. Tổng khách hàng (Tất cả khách hàng không bị xóa)
    const totalCustomers = await Customer.count({});
    // --- 2. Xử lý Phân trang & Danh sách Booking gần đây ---
    const limit = 4;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const countBookings = await Booking.count({ where: { is_deleted: 0 } });
    const totalPage = Math.ceil(countBookings / limit);
    const pagination = {
        currentPage: page,
        limitItem: limit,
        totalPage: totalPage,
        skip: offset
    };
    const bookings = await Booking.findAll({
        where: { is_deleted: 0 },
        limit: pagination.limitItem,
        offset: pagination.skip,
        raw: true,
        order: [['created_at', 'DESC']]
    });
    // --- 3. Gộp dữ liệu Customer & Service vào Booking ---
    for (const item of bookings) {
        const booking = item;
        // Lấy khách hàng
        const customer = await Customer.findOne({
            where: { customer_id: booking.id_customer },
            attributes: ['fullName', 'phone'],
            raw: true
        });
        booking.fullName = customer ? customer.fullName : "Khách vãng lai";
        booking.phone = customer ? customer.phone : "N/A";
        // Lấy dịch vụ
        const service = await Service.findOne({
            where: { id: booking.id_service },
            attributes: ['name'],
            raw: true
        });
        booking.serviceName = service ? service.name : "Dịch vụ";
        // Xử lý trạng thái hiển thị
        const statusMap = {
            'pending': { label: 'Chờ xác nhận', class: 'bg-yellow-100 text-yellow-700' },
            'paid': { label: 'Đã thanh toán', class: 'bg-green-100 text-green-700' },
            'deposited': { label: 'Đã đặt cọc', class: 'bg-blue-100 text-blue-700' }
        };
        booking.statusDisplay = statusMap[booking.status]?.label || 'Không xác định';
        booking.statusClass = statusMap[booking.status]?.class || 'bg-gray-100';
    }
    // --- 4. Render ---
    res.render("admin/pages/dashboard/index.pug", {
        user,
        bookings,
        stats: {
            revenue: revenueData.toLocaleString('vi-VN'),
            newBookings: newBookingsCount,
            totalCustomers: totalCustomers
        },
        pagination
    });
};
