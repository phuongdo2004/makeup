import { Request, Response } from "express";
import User from "../../model/user.model.js";
import Booking from "../../model/booking.model.js";
import Customer from "../../model/customer.model.js";
import { sequelize } from "../../config/database.js"; // Import cấu hình sequelize để chạy hàm SUM, COUNT nhóm theo ngày
import { Op } from 'sequelize';

export const index = async (req: Request, res: Response) => {
  try {
    // --- 0. Thông tin User & Auth ---
    const user = await User.findOne({
      where: { tokenUser: req.cookies.token },
      raw: true
    }) as any;
    
    if (user && user.avatar) {
      try { user.avatar = JSON.parse(user.avatar); } catch { }
    } else if (user) { user.avatar = "/uploads/avatar-default.jpg"; }

    // --- 1. Xử lý bộ lọc Khoảng ngày ---
    let { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    if (!endDate) endDate = todayString;
    if (!startDate) {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 2);
      startDate = firstDayOfMonth.toISOString().split('T')[0];
    }

    // Điều kiện lọc chung
    const dateRangeCondition = {
      status: ['paid', 'deposited'],
      is_deleted: 0,
      booking_date: { [Op.between]: [startDate, endDate] }
    };

    // --- 2. Tính toán số liệu thống kê cho 3 Cards ---

// A. TỔNG DOANH THU THỰC TẾ: Đơn đã paid thì lấy toàn bộ price, đơn deposited thì chỉ lấy phần deposit đã thu
const revenueResult = await Booking.findOne({
  attributes: [
    [
      sequelize.literal(`
        SUM(
          CASE 
            WHEN status = 'paid' THEN price
            WHEN status = 'deposited' THEN deposit 
            ELSE 0 
          END
        )
      `),
      'total_real_revenue'
    ]
  ],
  where: dateRangeCondition,
  raw: true
}) as any;

const revenueData = revenueResult ? Number(revenueResult.total_real_revenue) : 0;

// B. Tổng số đơn lịch đặt thành công
const totalBookingsCount = await Booking.count({ where: dateRangeCondition });

// C. Tổng số khách hàng đăng ký
const totalCustomers = await Customer.count({});


// --- 3. Nhóm dữ liệu theo Ngày để vẽ Biểu đồ & làm Bảng chi tiết ---

const chartRawData = await Booking.findAll({
  attributes: [
    'booking_date',
    [sequelize.fn('COUNT', sequelize.col('id')), 'daily_bookings'],
    
    // 1. TIỀN ĐẶT CỌC: Chỉ tính tiền cọc của những đơn ĐANG ở trạng thái đặt cọc 'deposited'
    // Đơn đã 'paid' sẽ KHÔNG bị cộng tiền cọc vào đây nữa, giúp phân tách dòng tiền rạch ròi
    [
      sequelize.literal(`
        SUM(CASE WHEN status = 'deposited' THEN deposit ELSE 0 END)
      `),
      'daily_deposited'
    ],
    
    // 2. ĐÃ THANH TOÁN: Lấy toàn bộ tổng giá trị (price) của các đơn đã hoàn thành tất toán 'paid'
    [
      sequelize.literal(`
        SUM(CASE WHEN status = 'paid' THEN price ELSE 0 END)
      `),
      'daily_paid'
    ],
    
    // 3. TỔNG DOANH THU: Cộng gộp dòng tiền thực tế thu được trong ngày (Cọc của đơn cọc + Toàn bộ của đơn paid)
    [
      sequelize.literal(`
        SUM(
          CASE 
            WHEN status = 'paid' THEN price 
            WHEN status = 'deposited' THEN deposit 
            ELSE 0 
           END
        )
      `),
      'daily_revenue'
    ]
  ],
  where: dateRangeCondition,
  group: ['booking_date'],
  order: [['booking_date', 'ASC']],
  raw: true
}) as any[];

const revenueChartData = chartRawData.map(item => ({
  booking_date: item.booking_date,
  daily_bookings: item.daily_bookings,
  daily_deposited: Number(item.daily_deposited || 0),
  daily_paid: Number(item.daily_paid || 0),
  daily_revenue: Number(item.daily_revenue || 0)
}));

    // --- 4. Render ---
    res.render("admin/pages/dashboard/index.pug", {
      user,
      startDate,
      endDate,
      stats: {
        revenue: revenueData.toLocaleString('vi-VN'), // Vẫn định dạng chấm phẩy đẹp mắt
        totalBookings: totalBookingsCount,
        totalCustomers: totalCustomers
      },
      revenueChartData
    });

  } catch (error: any) {
    console.error("❌ Lỗi tại dashboard controller:", error.message);
    res.status(500).send("Có lỗi xảy ra trong quá trình xử lý thống kê.");
  }
};



