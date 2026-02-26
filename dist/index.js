import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import multer from "multer";
const storage = multer.memoryStorage();
// khi dung storage thi req.file se chua buffer
const upload = multer({ storage: storage });
import { clientRouter } from "./router/client/index.route.js";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { adminRouter } from "./router/admin/index.route.js";
import { system } from "./config/system.js";
import { sequelize } from "./config/database.js";
sequelize;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import flash from 'connect-flash';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
// Phải đặt dòng này TRƯỚC các dòng định nghĩa Route
app.use(methodOverride('_method'));
app.use(cookieParser('KEY_SECRET_CUA_BAN'));
app.use(session({
    secret: 'SecretKeyCuaBan123', // Thêm dòng này vào để sửa lỗi ts(2345)
    resave: false, // Nên thêm để tối ưu hóa session
    saveUninitialized: true, // Nên thêm để khởi tạo session ngay cả khi chưa có dữ liệu
    cookie: {
        maxAge: 60000
    }
}));
app.use(flash());
// 1. Cấu hình các bộ parse dữ liệu trước
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.locals.prefixAdmin = system.prefixAdmin;
app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
app.use(express.static(`${__dirname}/public`));
const port = 2000;
console.log("oke");
adminRouter(app);
clientRouter(app);
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
