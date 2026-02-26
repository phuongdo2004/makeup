import Service from "../model/service.model";
import { Request, Response } from "express";

// Định nghĩa cấu trúc dữ liệu để TypeScript không báo lỗi
interface Pagination {
  currentPage: number;
  limitItem: number;
  skip: number;
  totalPage: number;
  count:number;
}

export const pagi = async (req: Request, res: Response): Promise<Pagination> => {
  // Khởi tạo đối tượng với giá trị mặc định
  const pagination: Pagination = {
    currentPage: 1,
    limitItem: 6,
    skip: 0,
    totalPage: 0,
    count: 0,

  };

  // 1. Kiểm tra và ép kiểu trang hiện tại từ Query String
  if (req.query.page) {
    const pageNumber = parseInt(req.query.page as string);
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
pagination.count  = count;

  // 4. Tính toán tổng số trang dựa trên giới hạn item
  pagination.totalPage = Math.ceil(count / pagination.limitItem);

  return pagination;
};