import Booking from "../../model/booking.model.js";
import axios from "axios";
import { createHmac } from "crypto";
import { system } from "../../config/system.js";
export const payment = async (req, res) => {
    try {
        const data = req.body;
        const customer = res.locals.Customer;
        // Kiểm tra dữ liệu đầu vào để tránh crash app
        if (!data.booking_date || !customer) {
            return res.status(400).send("Thiếu thông tin ngày đặt hoặc khách hàng.");
        }
        // 1. Xử lý định dạng ngày: '24/2/2026' -> '2026-02-24'
        const parts = data.booking_date.split('/');
        if (parts.length !== 3) {
            return res.status(400).send("Định dạng ngày không hợp lệ.");
        }
        const formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        const newBooking = await Booking.create({
            id_service: data.id_service,
            id_artist: data.id_artist,
            id_customer: customer.customer_id,
            address: data.address, // Bây giờ data.address đã có giá trị từ Form gửi lên
            booking_date: formattedDate,
            time_start: data.time_start,
            time_end: data.time_end,
            price: parseFloat(data.price) || 0,
            status: "pending"
        });
        // Lấy toàn bộ object dữ liệu sạch
        const bookingData = newBooking.get({ plain: true });
        const price = bookingData.price;
        // 3. Lấy ID sau khi tạo thành công
        // TRONG SEQUELIZE, ID mặc định là 'id', không phải '_id' như MongoDB
        const bookingId = newBooking.get('id') || newBooking.id;
        console.log("oke");
        console.log("✅ Tạo đơn đặt lịch thành công. ID:", bookingId);
        console.log("Thông tin booking:");
        let { accessKey, secretKey, orderInfo, partnerCode, 
        // redirectUrl,
        // ipnUrl,
        requestType, extraData, orderGroupId, autoCapture, lang, } = system;
        const ipnUrl = process.env.ipnUrl;
        const redirectUrl = process.env.redirectUrl;
        console.log(ipnUrl, redirectUrl);
        var requestId = bookingId;
        // Đảm bảo lấy giá trị ổn định
        const amount = price.toString();
        const currentIpnUrl = ipnUrl || "";
        const currentRedirectUrl = redirectUrl || "";
        // 1. Tạo chuỗi rawSignature ĐÚNG THỨ TỰ
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${currentIpnUrl}&orderId=${bookingId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${currentRedirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');
        // 2. Tạo Request Body khớp hoàn toàn với chuỗi ký
        const requestBodyObject = {
            partnerCode,
            partnerName: 'Test',
            storeId: 'MomoTestStore',
            requestId,
            amount, // Dùng biến chuỗi đã ép kiểu
            orderId: bookingId,
            orderInfo,
            redirectUrl: currentRedirectUrl,
            ipnUrl: currentIpnUrl,
            lang,
            requestType,
            autoCapture,
            extraData,
            orderGroupId,
            signature
        };
        const requestBody = JSON.stringify(requestBodyObject); // Chuyển đổi đối tượng sang JSON
        // options for axios
        const options = {
            method: 'POST',
            url: 'https://test-payment.momo.vn/v2/gateway/api/create',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
            data: requestBody,
        };
        // ... đoạn code gọi axios(options) bên trên
        let result = await axios(options);
        if (result.data && result.data.payUrl) {
            // Chuyển hướng người dùng sang trang thanh toán của MoMo
            return res.redirect(result.data.payUrl);
        }
        else {
            return res.status(400).send("Không thể khởi tạo thanh toán MoMo: " + result.data.message);
        }
        // Chuyển hướng sang trang thanh toán
        // res.redirect(`/payment/checkout/${bookingId}`);
    }
    catch (error) {
        console.error("Lỗi trong payment:", error.message);
        return res.status(500).json({ statusCode: 500, message: error.message });
    }
    console.log("chay het roi");
};
export const paymentCallback = async (req, res) => {
    console.log('MoMo Callback Data:');
    const { resultCode, orderId } = req.body;
    console.log(`MoMo Callback - orderId: ${orderId}, resultCode: ${resultCode}`);
    if (resultCode == 0) {
        // orderId chính là cái bookingId bạn gửi đi lúc đầu
        await Booking.update({ status: "paid" }, {
            where: {
                // PHẢI dùng đúng tên cột ID trong Database của bạn (id_booking)
                id: orderId
            }
        });
        console.log("✅ Cập nhật trạng thái 'paid' thành công cho đơn:", orderId);
    }
    else {
        console.log("❌ Thanh toán thất bại hoặc bị hủy. Code:", resultCode);
    }
    // MoMo yêu cầu trả về status 200 hoặc 204 để xác nhận đã nhận được IPN.
    // Trả về 200 OK để tránh một số client (hoặc proxy) chờ body khi nhận 204.
    return res.sendStatus(200);
};
