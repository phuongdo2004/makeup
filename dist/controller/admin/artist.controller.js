import Artist from "../../model/artist.model.js";
import { system } from "../../config/system.js";
import { Op } from "sequelize";
import Booking from "../../model/booking.model.js";
/**
 * [POST/PATCH] /admin/artists/deleted/:id
 * Chuyển trạng thái hoạt động của Artist sang Tạm nghỉ (Nghỉ việc)
 */
export const deleted = async (req, res) => {
    try {
        const artistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!artistId) {
            req.flash("error", "ID chuyên viên không hợp lệ!");
            return res.redirect(`/${system.prefixAdmin}/artists`);
        }
        // ================= BỔ SUNG LOGIC KIỂM TRA LỊCH ĐẶT =================
        // Tìm kiếm xem artist này có lịch đặt nào đang ở trạng thái Chờ xác nhận hoặc Đã đặt cọc hay không
        // Giả sử tên cột lưu liên kết Artist trong bảng Booking của em là id_artist (hoặc artist_id tùy DB của em nhé)
        const activeBooking = await Booking.findOne({
            where: {
                id_artist: artistId,
                is_deleted: 0,
                status: {
                    [Op.in]: ['pending', 'deposited'] // Lịch hẹn chưa thanh toán dứt điểm
                }
            },
            raw: true
        });
        // Nếu tìm thấy lịch hẹn chưa hoàn thành, chặn không cho nghỉ việc
        if (activeBooking) {
            req.flash("error2", "Không thể cho chuyên viên này nghỉ việc vì vẫn còn lịch hẹn chưa hoàn tất!");
            return res.redirect(`/${system.prefixAdmin}/artists`);
        }
        // ===================================================================
        // Nếu không vướng lịch hẹn nào, tiến hành cập nhật trạng thái nghỉ việc
        const artist = await Artist.findByPk(artistId);
        if (artist) {
            await artist.update({ status: 'inactive' });
            req.flash("success", "Cập nhật trạng thái nghỉ việc thành công!");
        }
        else {
            req.flash("error2", "Không tìm thấy dữ liệu chuyên viên trong hệ thống!");
        }
        res.redirect(`/${system.prefixAdmin}/artists`);
    }
    catch (error) {
        console.error("Lỗi khi xử lý cho Artist nghỉ việc:", error);
        req.flash("error", "Có lỗi xảy ra ở hệ thống, không thể cập nhật trạng thái!");
        res.redirect(`/${system.prefixAdmin}/artists`);
    }
};
export const index = async (req, res) => {
    const artists = await Artist.findAll({ where: { status: 'active' } });
    for (const artist of artists) {
        if (artist["avatar"]) {
            artist["avatar"] = (JSON.parse(artist["avatar"]))[0];
        }
    }
    res.render("admin/pages/artists/index.pug", {
        artists: artists,
        message: req.flash(),
    });
};
export const create = async (req, res) => {
    res.render("admin/pages/artists/create.pug", {
        message: req.flash(),
    });
};
export const createPost = async (req, res) => {
    try {
        console.log("start");
        const newArtist = req.body;
        newArtist.avatar = JSON.stringify(req.body.avatar);
        const artist = await Artist.create(newArtist);
        console.log("okk");
        await artist.save();
        req.flash("success", "Tạo nghệ sĩ thành công");
        res.redirect("/admin/artists");
    }
    catch (error) {
        console.error(error);
    }
};
// [GET] /admin/artists/detail/:id
export const detail = async (req, res) => {
    // try {
    const artistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!artistId) {
        return res.status(400).send("ID nghệ sĩ không hợp lệ");
    }
    else {
        const artist = await Artist.findByPk(artistId);
        if (artist["avatar"]) {
            artist["avatar"] = (JSON.parse(artist["avatar"]))[0];
        }
        res.render("admin/pages/artists/detail.pug", {
            artist: artist,
        });
    }
    // }
    //   catch (error) {
    //     res.status(500).send(error);
    //   }
};
// ?[GET] edit artist
export const edit = async (req, res) => {
    const artistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!artistId) {
        return res.status(400).send("ID nghệ sĩ không hợp lệ");
    }
    else {
        const artist = await Artist.findByPk(artistId);
        if (artist["avatar"]) {
            artist["avatar"] = (JSON.parse(artist["avatar"]))[0];
        }
        res.render("admin/pages/artists/edit.pug", {
            artist: artist,
        });
    }
};
export const editPost = async (req, res) => {
    try {
        console.log("edit post");
        const artistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!artistId) {
            return res.status(400).send("ID nghệ sĩ không hợp lệ");
        }
        else {
            const artist = await Artist.findByPk(artistId);
            if (artist) {
                const updatedData = req.body;
                if (req.body.avatar) {
                    updatedData.avatar = JSON.stringify(req.body.avatar);
                }
                await artist.update(updatedData);
                req.flash("success", "Cập nhật nghệ sĩ thành công");
                res.redirect("/admin/artists");
            }
        }
    }
    catch (error) {
        res.status(500).send(error);
    }
};
// export const deleted = async( req :Request, res:Response) =>{
//   try {
//     console.log("delete artist");
//     const artistId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
//     if(!artistId){
//       return res.status(400).send("ID nghệ sĩ không hợp lệ");
//     }else{
//       const artist = await Artist.findByPk(artistId);   
//       if(artist){
//         await artist.update({status: 'inactive'});
//         req.flash("success", "Xóa nghệ sĩ thành công");
//         res.redirect(`/${system.prefixAdmin}/artists`);
//       }
//     }
//   } catch (error) {
//   }
// }
