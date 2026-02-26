import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { nanoid } from "nanoid";

const generateShortToken = (length: number) => nanoid(length);

const Artist = sequelize.define("Artist", {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4 
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
    avatar: {
    type: DataTypes.TEXT("long"), // longtext utf8mb4_bin
    allowNull: true,
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 2
  },
  // Bổ sung trường rating (số sao)
  rating: {
    type: DataTypes.DOUBLE, // Kiểu số thực để lưu 4.5, 4.8, 5.0
    allowNull: true,
    defaultValue: 5.0       // Mặc định cho nghệ sĩ mới là 5 sao
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "active"
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
    biography: {
  type: DataTypes.TEXT, // Chuyển từ STRING sang TEXT
  allowNull: true
},
  time_start: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  time_end: {
    type: DataTypes.TIME,
    allowNull: true,
  },

  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false, 
  tableName: 'artist',
});

export default Artist;