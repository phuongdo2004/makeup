import Customer from "../../model/customer.model.js";
import Service from "../../model/service.model.js";
import Artist from "../../model/artist.model.js";
import Comment from "../../model/comment.model.js";
export const index = async (req, res) => {
    try {
        const services = await Service.findAll({ limit: 3 });
        for (const service of services) {
            // tim address 
            const artist = await Artist.findOne({
                where: {
                    id: service.artist_id,
                }
            });
            if (artist) {
                service.address = artist.address;
            }
            if (service["images"]) {
                service["images"] = (JSON.parse(service["images"]))[0];
            }
        }
        const customer = res.locals.Customer;
        // Lấy top 3 phản hồi có rating cao nhất
        let feedbacks = [];
        try {
            const comments = await Comment.findAll({
                order: [['rating', 'DESC'], ['created_at', 'DESC']],
                limit: 3,
                raw: true
            });
            // Lấy thông tin khách hàng cho từng comment
            for (const comment of comments) {
                const commentedCustomer = await Customer.findOne({
                    where: { customer_id: comment.customer_id },
                    attributes: ['fullName', 'avatar'],
                    raw: true
                });
                let avatarUrl = null;
                if (commentedCustomer?.avatar) {
                    const avatarValue = commentedCustomer.avatar;
                    if (typeof avatarValue === 'string') {
                        const trimmed = avatarValue.trim();
                        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                            try {
                                const parsed = JSON.parse(trimmed);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    avatarUrl = parsed[0];
                                }
                                else {
                                    avatarUrl = String(parsed);
                                }
                            }
                            catch (error) {
                                avatarUrl = avatarValue;
                            }
                        }
                        else {
                            avatarUrl = avatarValue;
                        }
                    }
                    else {
                        avatarUrl = String(avatarValue);
                    }
                }
                comment.customer = {
                    fullName: commentedCustomer?.fullName || 'Khách hàng ẩn danh',
                    avatar: avatarUrl
                };
            }
            feedbacks = comments;
        }
        catch (error) {
            console.log("Lỗi khi lấy feedbacks:", error);
            feedbacks = [];
        }
        res.render("client/pages/home/index.pug", {
            services: services,
            message: req.flash(),
            customer: customer,
            feedbacks: feedbacks
        });
    }
    catch (error) {
        res.status(500).send("Lỗi máy chủ");
    }
};
