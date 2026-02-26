import { StreamUpload } from "../../helpers/streamUpload.helper.js";
import { NextFunction, Request, Response } from "express";
import Service from "../../model/service.model.js";
  export const uploadCloud = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("middleware uploadCloud called");
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | any;

    // KIỂM TRA: Object có tồn tại VÀ có ít nhất một trường file hay không
    if (files && Object.keys(files).length > 0) {
      console.log("Thực hiện upload ảnh mới lên Cloudinary");
      
      for (const key in files) {
        let images: string[] = [];

        for (const element of files[key]) {
          const result: any = await StreamUpload(element.buffer);
          images.push(result["url"]);
        }

        // Lưu mảng URL vào body để chuyển tiếp sang Controller
        req.body[key] = images;
      }
    } else {
      console.log("Không chọn ảnh mới, giữ nguyên ảnh cũ từ CSDL");
      
      // Lấy ID từ params hoặc body tùy vào route của bạn
      const id = req.params.id || req.body.id;
      if (id) {
        const service = await Service.findOne({
          where: { id: id }
        });

        if (service) {
          // Gán lại mảng ảnh cũ vào body để không bị mất dữ liệu khi update
          req.body["images"] = (service as any).images;
        }
      }else{
        
      }
    }

    next();
  } catch (error) {
    console.log("Lỗi Upload Cloud:", error);
    res.status(500).send("Upload failed");
  }
};