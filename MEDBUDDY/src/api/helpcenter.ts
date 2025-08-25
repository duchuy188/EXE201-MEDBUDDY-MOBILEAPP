// helpcenter.ts

export interface HelpArticle {
  id: number;
  category: string;
  title: string;
  content: string;
}

export const helpArticles: HelpArticle[] = [
  // =============================
  // TÀI KHOẢN & HỒ SƠ (10 bài viết)
  // =============================
  {
    id: 1,
    category: "Tài khoản & Hồ sơ",
    title: "Cách tạo tài khoản mới",
    content: `
Để bắt đầu sử dụng ứng dụng, bạn cần tạo một tài khoản cá nhân. 
Quy trình đăng ký chỉ mất khoảng 1–2 phút:

1. Mở ứng dụng và chọn "Đăng ký".
2. Nhập các thông tin cơ bản: Họ tên, ngày sinh, số điện thoại và email.
3. Tạo mật khẩu mạnh (ít nhất 8 ký tự, có chữ hoa, chữ thường và số).
4. Nhấn "Xác nhận" để hoàn tất.

👉 Mẹo: Nên sử dụng email chính bạn thường dùng để có thể khôi phục tài khoản khi cần.`
  },
  {
    id: 2,
    category: "Tài khoản & Hồ sơ",
    title: "Cách chỉnh sửa thông tin cá nhân",
    content: `
Bạn có thể thay đổi thông tin cá nhân bất cứ lúc nào:

- Vào mục "Hồ sơ cá nhân".
- Nhấn "Chỉnh sửa".
- Thay đổi thông tin như: ảnh đại diện, địa chỉ, số điện thoại.
- Lưu thay đổi để cập nhật ngay lập tức.

⚠️ Lưu ý: Một số thông tin quan trọng (ví dụ số CMND/CCCD) chỉ có thể sửa khi gửi yêu cầu hỗ trợ.` 
  },
  {
    id: 3,
    category: "Tài khoản & Hồ sơ",
    title: "Cách thêm người thân vào hồ sơ",
    content: `
Ứng dụng cho phép bạn quản lý thông tin người thân để tiện theo dõi sức khỏe:

1. Vào "Hồ sơ".
2. Chọn "Thêm người thân".
3. Nhập thông tin: Họ tên, quan hệ, ngày sinh, số điện thoại liên hệ.
4. Lưu để hoàn tất.

👉 Tính năng này giúp bác sĩ có thể theo dõi tình hình sức khỏe cả gia đình bạn.`
  },
  {
    id: 4,
    category: "Tài khoản & Hồ sơ",
    title: "Khôi phục mật khẩu khi quên",
    content: `
Nếu bạn quên mật khẩu, hãy làm theo các bước sau:

- Chọn "Quên mật khẩu" tại màn hình đăng nhập.
- Nhập email hoặc số điện thoại đã đăng ký.
- Nhận mã OTP hoặc đường dẫn đặt lại mật khẩu.
- Tạo mật khẩu mới và đăng nhập lại.

⚠️ Mẹo: Không dùng lại mật khẩu cũ để tránh mất an toàn.`
  },
  {
    id: 5,
    category: "Tài khoản & Hồ sơ",
    title: "Xóa tài khoản vĩnh viễn",
    content: `
Nếu bạn không còn muốn sử dụng ứng dụng, có thể xóa tài khoản:

1. Vào mục "Cài đặt tài khoản".
2. Chọn "Xóa tài khoản".
3. Hệ thống sẽ cảnh báo về việc mất toàn bộ dữ liệu.
4. Xác nhận để xóa vĩnh viễn.

⚠️ Sau khi xóa, dữ liệu không thể khôi phục. Bạn nên sao lưu trước khi thực hiện.`
  },

  {
    id: 6,
    category: "Tài khoản & Hồ sơ",
    title: "Cách đổi số điện thoại đăng nhập",
    content: `
Bạn có thể thay đổi số điện thoại đăng nhập như sau:

1. Vào mục "Hồ sơ cá nhân".
2. Chọn "Đổi số điện thoại".
3. Nhập số điện thoại mới và xác nhận bằng mã OTP gửi về máy.
4. Lưu thay đổi để cập nhật.

⚠️ Lưu ý: Số điện thoại mới không được trùng với tài khoản khác.`
  },
  {
    id: 7,
    category: "Tài khoản & Hồ sơ",
    title: "Liên kết email với tài khoản",
    content: `
Việc liên kết email giúp bạn dễ dàng khôi phục tài khoản:

1. Vào "Cài đặt tài khoản".
2. Chọn "Liên kết email".
3. Nhập địa chỉ email và xác nhận qua mã gửi về email.
4. Hoàn tất liên kết.

👉 Nên sử dụng email cá nhân thường dùng để đảm bảo an toàn.`
  },
  {
    id: 8,
    category: "Tài khoản & Hồ sơ",
    title: "Bật bảo mật 2 lớp (2FA)",
    content: `
Tăng cường bảo mật tài khoản bằng xác thực hai lớp:

1. Vào "Cài đặt bảo mật".
2. Chọn "Bật xác thực 2 lớp".
3. Nhập số điện thoại/email để nhận mã xác thực.
4. Kích hoạt và lưu lại.

👉 Sau khi bật, mỗi lần đăng nhập sẽ cần mã xác thực gửi về thiết bị.`
  },
  {
    id: 9,
    category: "Tài khoản & Hồ sơ",
    title: "Quản lý thiết bị đăng nhập",
    content: `
Bạn có thể kiểm tra và quản lý các thiết bị đã đăng nhập tài khoản:

1. Vào "Cài đặt bảo mật".
2. Chọn "Thiết bị đăng nhập".
3. Xem danh sách thiết bị và thời gian đăng nhập.
4. Đăng xuất khỏi thiết bị lạ hoặc không sử dụng nữa.

⚠️ Nên thường xuyên kiểm tra để đảm bảo an toàn tài khoản.`
  },
  {
    id: 10,
    category: "Tài khoản & Hồ sơ",
    title: "Đăng xuất tài khoản từ xa",
    content: `
Nếu bạn nghi ngờ tài khoản bị truy cập trái phép, hãy đăng xuất từ xa:

1. Vào "Cài đặt bảo mật".
2. Chọn "Đăng xuất từ xa".
3. Chọn thiết bị cần đăng xuất và xác nhận.

👉 Tính năng này giúp bảo vệ tài khoản khi mất điện thoại hoặc thiết bị.`
  },

  // (tương tự, bạn sẽ có thêm các bài: đổi số điện thoại, liên kết email, bảo mật 2 lớp, quản lý thiết bị đăng nhập, đăng xuất từ xa...)

  // =============================
  // THUỐC & NHẮC NHỞ (30 bài viết)
  // =============================
  {
    id: 101,
    category: "Thuốc & Nhắc nhở",
    title: "Cách thêm thuốc mới",
    content: `
Ứng dụng giúp bạn quản lý thuốc dễ dàng hơn:


👉 Bạn có thể thêm cả hình ảnh vỉ thuốc để dễ nhận diện.`
  },

  {
    id: 102,
    category: "Thuốc & Nhắc nhở",
    title: "Cách sửa thông tin thuốc đã lưu",
    content: `
Bạn có thể chỉnh sửa thông tin thuốc bất cứ lúc nào:

- Vào mục "Thuốc & Nhắc nhở".
- Chọn thuốc cần sửa.
- Nhấn "Chỉnh sửa" và cập nhật thông tin.
- Lưu thay đổi để áp dụng.`
  },
  {
    id: 103,
    category: "Thuốc & Nhắc nhở",
    title: "Cách xóa thuốc khỏi danh sách",
    content: `
Nếu không còn sử dụng thuốc, bạn có thể xóa khỏi danh sách:

- Vào "Thuốc & Nhắc nhở".
- Chọn thuốc cần xóa.
- Nhấn "Xóa" và xác nhận.`
  },
  {
    id: 104,
    category: "Thuốc & Nhắc nhở",
    title: "Cài đặt nhắc nhở uống thuốc",
    content: `
Để không quên uống thuốc, hãy cài đặt nhắc nhở:

- Khi thêm/sửa thuốc, chọn thời gian nhắc nhở.
- Bật thông báo trên điện thoại.
- Ứng dụng sẽ gửi thông báo đúng giờ.`
  },
  {
    id: 105,
    category: "Thuốc & Nhắc nhở",
    title: "Theo dõi lịch sử uống thuốc",
    content: `
Bạn có thể xem lại lịch sử uống thuốc:

- Vào "Thuốc & Nhắc nhở".
- Chọn "Lịch sử" để xem các lần đã uống hoặc bỏ lỡ.`
  },
  {
    id: 106,
    category: "Thuốc & Nhắc nhở",
    title: "Cảnh báo khi quên uống thuốc",
    content: `
Ứng dụng sẽ nhắc nhở nếu bạn quên uống thuốc:

- Nếu không xác nhận đã uống, hệ thống sẽ gửi cảnh báo.
- Có thể thiết lập cảnh báo lặp lại nhiều lần.`
  },
  {
    id: 107,
    category: "Thuốc & Nhắc nhở",
    title: "Thêm hình ảnh cho thuốc",
    content: `
Bạn có thể thêm hình ảnh vỉ thuốc để dễ nhận diện:

- Khi thêm/sửa thuốc, chọn "Thêm ảnh".
- Chụp ảnh hoặc chọn từ thư viện.
- Lưu lại để hiển thị cùng thông tin thuốc.`
  },
  {
    id: 108,
    category: "Thuốc & Nhắc nhở",
    title: "Cách thêm thuốc cho người thân",
    content: `
Quản lý thuốc cho người thân rất đơn giản:

- Vào "Hồ sơ người thân".
- Chọn "Thuốc & Nhắc nhở".
- Thêm thuốc tương tự như tài khoản chính.`
  },
  {
    id: 109,
    category: "Thuốc & Nhắc nhở",
    title: "Cách tạm dừng nhắc nhở thuốc",
    content: `
Nếu tạm thời không cần nhắc nhở:

- Vào "Thuốc & Nhắc nhở".
- Chọn thuốc cần tạm dừng.
- Nhấn "Tạm dừng nhắc nhở".`
  },
  {
    id: 110,
    category: "Thuốc & Nhắc nhở",
    title: "Khôi phục nhắc nhở đã tạm dừng",
    content: `
Để bật lại nhắc nhở:

- Vào "Thuốc & Nhắc nhở".
- Chọn thuốc đã tạm dừng.
- Nhấn "Bật lại nhắc nhở".`
  },
  {
    id: 111,
    category: "Thuốc & Nhắc nhở",
    title: "Cách xem tổng hợp các loại thuốc đang dùng",
    content: `
Bạn có thể xem danh sách tổng hợp các loại thuốc:

- Vào "Thuốc & Nhắc nhở".
- Chọn "Tất cả thuốc" để xem chi tiết từng loại.`
  },
  {
    id: 112,
    category: "Thuốc & Nhắc nhở",
    title: "Cách tìm kiếm thuốc trong danh sách",
    content: `
Tìm kiếm nhanh thuốc bằng tên:

- Vào "Thuốc & Nhắc nhở".
- Sử dụng ô tìm kiếm ở đầu danh sách.`
  },
  {
    id: 113,
    category: "Thuốc & Nhắc nhở",
    title: "Cách lọc thuốc theo thời gian uống",
    content: `
Bạn có thể lọc thuốc theo buổi sáng, trưa, tối:

- Vào "Thuốc & Nhắc nhở".
- Chọn bộ lọc thời gian phù hợp.`
  },
  {
    id: 114,
    category: "Thuốc & Nhắc nhở",
    title: "Cách nhận thông báo khi sắp hết thuốc",
    content: `
Ứng dụng sẽ nhắc bạn khi số lượng thuốc gần hết:

- Khi thêm thuốc, nhập số lượng ban đầu.
- Hệ thống sẽ tự động tính toán và gửi thông báo khi gần hết.`
  },
  {
    id: 115,
    category: "Thuốc & Nhắc nhở",
    title: "Cách gia hạn đơn thuốc",
    content: `
Khi hết thuốc, bạn có thể gia hạn đơn thuốc:

- Vào "Thuốc & Nhắc nhở".
- Chọn thuốc cần gia hạn.
- Nhấn "Gia hạn" và nhập số lượng mới.`
  },
  {
    id: 116,
    category: "Thuốc & Nhắc nhở",
    title: "Cách xem hướng dẫn sử dụng thuốc",
    content: `
Bạn có thể xem hướng dẫn sử dụng chi tiết:

- Vào "Thuốc & Nhắc nhở".
- Chọn thuốc cần xem.
- Nhấn "Hướng dẫn sử dụng".`
  },
  {
    id: 117,
    category: "Thuốc & Nhắc nhở",
    title: "Cách thêm ghi chú cho từng lần uống thuốc",
    content: `
Bạn có thể thêm ghi chú cho mỗi lần uống:

- Khi xác nhận đã uống, nhập ghi chú nếu cần.
- Ghi chú sẽ lưu lại trong lịch sử.`
  },
  {
    id: 118,
    category: "Thuốc & Nhắc nhở",
    title: "Cách chia sẻ thông tin thuốc với bác sĩ/người thân",
    content: `
Chia sẻ thông tin thuốc rất dễ dàng:

- Vào "Thuốc & Nhắc nhở".
- Chọn thuốc cần chia sẻ.
- Nhấn "Chia sẻ" và chọn phương thức phù hợp.`
  },
  {
    id: 119,
    category: "Thuốc & Nhắc nhở",
    title: "Cách đồng bộ thuốc với thiết bị khác",
    content: `
Bạn có thể đồng bộ thông tin thuốc trên nhiều thiết bị:

- Đăng nhập cùng tài khoản trên thiết bị mới.
- Dữ liệu thuốc sẽ tự động đồng bộ.`
  },
  {
    id: 120,
    category: "Thuốc & Nhắc nhở",
    title: "Cách xuất danh sách thuốc ra file PDF/Excel",
    content: `
Bạn có thể xuất danh sách thuốc để in hoặc gửi cho bác sĩ:

- Vào "Thuốc & Nhắc nhở".
- Chọn "Xuất file" và chọn định dạng PDF hoặc Excel.
- Lưu hoặc chia sẻ file theo nhu cầu.`
  },

  // ... bạn sẽ có 30 bài viết chi tiết cho phần này (thêm, sửa, xóa thuốc, cài nhắc nhở, cách theo dõi lịch sử uống thuốc, cảnh báo khi quên thuốc, v.v.)

  // =============================
  // BÁO CÁO & CHIA SẺ DỮ LIỆU (15 bài viết)
  // =============================
  {
    id: 201,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Xuất báo cáo sức khỏe cho bác sĩ",
    content: `
Bạn có thể xuất dữ liệu thành file PDF để gửi cho bác sĩ:

1. Vào mục "Báo cáo".
2. Chọn khoảng thời gian (7 ngày, 30 ngày...).
3. Xuất file PDF hoặc Excel.
4. Gửi qua email hoặc Zalo.

👉 Báo cáo sẽ bao gồm: lịch uống thuốc, huyết áp, nhịp tim, cân nặng.`
  },

  {
    id: 202,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Chia sẻ báo cáo với người thân",
    content: `
Bạn có thể gửi báo cáo sức khỏe cho người thân:

1. Vào mục "Báo cáo".
2. Chọn báo cáo cần chia sẻ.
3. Nhấn "Chia sẻ" và chọn người nhận.
4. Gửi qua email, Zalo hoặc các ứng dụng khác.`
  },
  {
    id: 203,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "In báo cáo sức khỏe",
    content: `
Bạn có thể in báo cáo để lưu trữ hoặc mang đến bác sĩ:

1. Vào "Báo cáo".
2. Chọn báo cáo cần in.
3. Nhấn "In báo cáo" và chọn máy in phù hợp.`
  },
  {
    id: 204,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Bảo mật dữ liệu khi chia sẻ",
    content: `
Đảm bảo an toàn khi chia sẻ dữ liệu:

- Chỉ chia sẻ với người tin cậy.
- Sử dụng mật khẩu cho file PDF nếu cần.
- Không chia sẻ qua các kênh không bảo mật.`
  },
  {
    id: 205,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Xem lại các báo cáo đã xuất",
    content: `
Bạn có thể xem lại các báo cáo đã xuất trước đó:

1. Vào "Báo cáo".
2. Chọn "Lịch sử báo cáo" để xem danh sách.`
  },
  {
    id: 206,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Tùy chỉnh nội dung báo cáo",
    content: `
Bạn có thể chọn thông tin muốn xuất trong báo cáo:

1. Vào "Báo cáo".
2. Chọn "Tùy chỉnh nội dung".
3. Chọn các mục cần thiết (thuốc, huyết áp, nhịp tim...).`
  },
  {
    id: 207,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Xuất báo cáo theo định dạng Excel",
    content: `
Báo cáo có thể xuất ra file Excel để dễ dàng chỉnh sửa:

1. Vào "Báo cáo".
2. Chọn "Xuất file Excel".
3. Lưu file về máy hoặc gửi đi.`
  },
  {
    id: 208,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Gửi báo cáo trực tiếp cho bác sĩ qua ứng dụng",
    content: `
Bạn có thể gửi báo cáo trực tiếp cho bác sĩ:

1. Vào "Báo cáo".
2. Chọn bác sĩ trong danh bạ.
3. Nhấn "Gửi báo cáo".`
  },
  {
    id: 209,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Cách xem biểu đồ sức khỏe trong báo cáo",
    content: `
Báo cáo có thể hiển thị biểu đồ trực quan:

1. Vào "Báo cáo".
2. Chọn báo cáo cần xem.
3. Xem biểu đồ huyết áp, nhịp tim, cân nặng...`
  },
  {
    id: 210,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Cách lọc báo cáo theo thời gian",
    content: `
Bạn có thể lọc báo cáo theo ngày, tuần, tháng:

1. Vào "Báo cáo".
2. Chọn bộ lọc thời gian phù hợp.`
  },
  {
    id: 211,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Cách xuất báo cáo cho từng thành viên trong gia đình",
    content: `
Bạn có thể xuất báo cáo riêng cho từng người:

1. Vào "Hồ sơ người thân".
2. Chọn "Báo cáo" và thực hiện xuất như bình thường.`
  },
  {
    id: 212,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Cách kiểm tra báo cáo đã gửi thành công",
    content: `
Bạn có thể kiểm tra trạng thái gửi báo cáo:

1. Vào "Báo cáo".
2. Chọn "Lịch sử gửi báo cáo" để xem chi tiết.`
  },
  {
    id: 213,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Cách xóa báo cáo đã xuất",
    content: `
Bạn có thể xóa các báo cáo không cần thiết:

1. Vào "Báo cáo".
2. Chọn báo cáo cần xóa.
3. Nhấn "Xóa" và xác nhận.`
  },
  {
    id: 214,
    category: "Báo cáo & Chia sẻ dữ liệu",
    title: "Cách bảo vệ quyền riêng tư khi xuất báo cáo",
    content: `
Để bảo vệ quyền riêng tư:

- Chỉ xuất các thông tin cần thiết.
- Sử dụng mật khẩu cho file báo cáo.
- Không chia sẻ báo cáo công khai.`
  },

  // ... 15 bài viết về báo cáo, chia sẻ dữ liệu với người thân, bác sĩ, in báo cáo, bảo mật dữ liệu khi chia sẻ, v.v.

  // =============================
  // CÀI ĐẶT ỨNG DỤNG (10 bài viết)
  // =============================
  {
    id: 301,
    category: "Cài đặt ứng dụng",
    title: "Đổi ngôn ngữ trong ứng dụng",
    content: `
Ứng dụng hỗ trợ nhiều ngôn ngữ:


👉 Ứng dụng sẽ tự động cập nhật ngay lập tức.`
  },

  {
    id: 302,
    category: "Cài đặt ứng dụng",
    title: "Cài đặt thông báo nhắc nhở",
    content: `
Bạn có thể tùy chỉnh thông báo của ứng dụng:

- Vào "Cài đặt".
- Chọn "Thông báo".
- Bật/tắt các loại thông báo theo nhu cầu.
- Lưu thay đổi.`
  },
  {
    id: 303,
    category: "Cài đặt ứng dụng",
    title: "Quản lý quyền riêng tư",
    content: `
Bảo vệ thông tin cá nhân của bạn:

- Vào "Cài đặt".
- Chọn "Quyền riêng tư".
- Điều chỉnh các quyền truy cập dữ liệu cá nhân.
- Lưu lại để áp dụng.`
  },
  {
    id: 304,
    category: "Cài đặt ứng dụng",
    title: "Bật/tắt chế độ tối (Dark Mode)",
    content: `
Giảm mỏi mắt với chế độ tối:

- Vào "Cài đặt".
- Chọn "Chế độ hiển thị".
- Bật hoặc tắt chế độ tối theo ý thích.`
  },
  {
    id: 305,
    category: "Cài đặt ứng dụng",
    title: "Cập nhật phiên bản ứng dụng",
    content: `
Đảm bảo bạn luôn dùng phiên bản mới nhất:

- Vào "Cài đặt".
- Chọn "Cập nhật ứng dụng".
- Làm theo hướng dẫn để cập nhật nếu có phiên bản mới.`
  },
  {
    id: 306,
    category: "Cài đặt ứng dụng",
    title: "Quản lý bộ nhớ và dữ liệu",
    content: `
Tiết kiệm dung lượng và tối ưu hiệu suất:

- Vào "Cài đặt".
- Chọn "Bộ nhớ & Dữ liệu".
- Xóa bộ nhớ đệm hoặc dữ liệu không cần thiết.`
  },
  {
    id: 307,
    category: "Cài đặt ứng dụng",
    title: "Cài đặt bảo mật ứng dụng",
    content: `
Tăng cường bảo mật cho tài khoản:

- Vào "Cài đặt".
- Chọn "Bảo mật".
- Bật xác thực vân tay, FaceID hoặc mã PIN.`
  },
  {
    id: 308,
    category: "Cài đặt ứng dụng",
    title: "Cài đặt đồng bộ dữ liệu",
    content: `
Đồng bộ dữ liệu trên nhiều thiết bị:

- Vào "Cài đặt".
- Chọn "Đồng bộ dữ liệu".
- Bật đồng bộ và đăng nhập cùng tài khoản trên thiết bị khác.`
  },
  {
    id: 309,
    category: "Cài đặt ứng dụng",
    title: "Khôi phục cài đặt gốc ứng dụng",
    content: `
Đặt lại ứng dụng về trạng thái ban đầu:

- Vào "Cài đặt".
- Chọn "Khôi phục cài đặt gốc".
- Xác nhận để tiến hành khôi phục.`
  },
  {
    id: 310,
    category: "Cài đặt ứng dụng",
    title: "Cài đặt âm thanh và rung",
    content: `
Tùy chỉnh âm thanh và rung khi nhận thông báo:

- Vào "Cài đặt".
- Chọn "Âm thanh & Rung".
- Bật/tắt hoặc điều chỉnh mức âm lượng, chế độ rung.`
  },

  // ... 10 bài viết về cài đặt thông báo, quyền riêng tư, bảo mật, chế độ tối, cập nhật phiên bản, v.v.

  // =============================
  // LIÊN HỆ HỖ TRỢ (1 bài viết)
  // =============================
  {
    id: 401,
    category: "Liên hệ hỗ trợ",
    title: "Cách liên hệ với đội ngũ chăm sóc khách hàng",
    content: `
Nếu bạn gặp khó khăn, có thể liên hệ:

- Hotline: 1900-1800 (từ 8:00 - 21:00).
- Email: support@medbuddy.vn
- Chat trực tiếp trong ứng dụng (mục "Hỗ trợ").

👉 Đội ngũ hỗ trợ luôn sẵn sàng giải đáp thắc mắc của bạn.`
  }
];
