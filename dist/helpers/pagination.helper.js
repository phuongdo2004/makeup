import Service from "../model/service.model.js";
export const pagi = async (req, res) => {
    // Khởi tạo đối tượng với giá trị mặc định
    const pagination = {
        currentPage: 1,
        limitItem: 6,
        skip: 0,
        totalPage: 0,
        count: 0,
    };
    // 1. Kiểm tra và ép kiểu trang hiện tại từ Query String
    if (req.query.page) {
        const pageNumber = parseInt(req.query.page);
        if (!isNaN(pageNumber) && pageNumber > 0) {
            pagination.currentPage = pageNumber;
        }
    }
    // 2. Tính toán vị trí bắt đầu lấy dữ liệu (offset)
    pagination.skip = (pagination.currentPage - 1) * pagination.limitItem;
    // 3. Đếm tổng số bản ghi TRƯA BỊ XÓA (is_deleted: 0)
    // Thêm điều kiện where để lọc dữ liệu chính xác
    const { count } = await Service.findAndCountAll({
        where: {
            is_deleted: 0
        }
    });
    pagination.count = count;
    // 4. Tính toán tổng số trang dựa trên giới hạn item
    pagination.totalPage = Math.ceil(count / pagination.limitItem);
    return pagination;
};
