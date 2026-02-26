import { DataTypes } from "sequelize";
import { sequelize } from "../config/database";
import { nanoid } from "nanoid";

const generateShortId = (length: number) => nanoid(length);

const Service = sequelize.define("Service", {
  id: {
    type: DataTypes.STRING(11),
    primaryKey: true,
    defaultValue: () => generateShortId(11)
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  artist_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  time_start: {
    type: DataTypes.TIME, 
    allowNull: false,
  },
  time_end: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true,
  },
  // THÊM TRƯỜNG RATING Ở ĐÂY
  rating: {
    type: DataTypes.FLOAT, // Khớp với kiểu 'float' trong ảnh database của bạn
    allowNull: true,       // Cho phép NULL như hiển thị trong cột 'Có'
    defaultValue: 4.0        // Mặc định là 0
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  amenities: {
    type: DataTypes.TEXT("long"), 
    allowNull: true,
  },
  images: {
    type: DataTypes.TEXT("long"), 
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT, 
    allowNull: true
  },
  is_deleted: {
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
  timestamps: false, 
  tableName: 'services', 
});

export default Service;