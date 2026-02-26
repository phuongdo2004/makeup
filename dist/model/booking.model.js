import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { v4 as uuidv4 } from "uuid"; // Hoặc dùng nanoid tùy dự án của bạn
const Booking = sequelize.define("Booking", {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: () => uuidv4(), // Tự động tạo UUID mới cho mỗi đơn đặt lịch
    },
    id_customer: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'customers', // Tên bảng thực tế
            key: 'customer_id'
        }
    },
    id_artist: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'artist', // Tên bảng thực tế (theo image_6640de.jpg)
            key: 'id'
        }
    },
    id_service: {
        type: DataTypes.STRING(11), // Khớp với VARCHAR(11) của bảng services
        allowNull: false,
        references: {
            model: 'services', // Tên bảng thực tế
            key: 'id'
        }
    },
    booking_date: {
        type: DataTypes.DATEONLY, // Chỉ lưu Ngày (DATE trong MySQL)
        allowNull: false,
    },
    // Ví dụ khai báo trong Model
    address: {
        type: DataTypes.STRING,
        allowNull: false, // Hoặc true tùy bạn, nhưng DB hiện đang bắt buộc
    },
    price: {
        type: DataTypes.DECIMAL(10, 2), // decimal(10,2) trong ảnh
        allowNull: true,
    },
    time_start: {
        type: DataTypes.TIME, // Lưu Giờ (TIME trong MySQL)
        allowNull: false,
    },
    time_end: {
        type: DataTypes.TIME, // Lưu Giờ (TIME trong MySQL)
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('paid', 'pending', 'deposited'),
        defaultValue: 'pending', // Sửa từ tiếng Việt sang giá trị ENUM
        allowNull: true,
    },
    is_deleted: {
        // Sửa từ DataTypes.TINYINT(1) thành:
        type: DataTypes.TINYINT({ length: 1 }),
        allowNull: false,
        defaultValue: 0
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false, // Vì bạn đã có created_at thủ công
    tableName: 'bookings',
    // Đảm bảo collation đồng nhất nếu cần (tùy chọn)
    collate: 'utf8mb4_general_ci'
});
export default Booking;
