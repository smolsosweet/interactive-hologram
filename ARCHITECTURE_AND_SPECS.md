# BÁO CÁO KIỂM TOÁN SOURCE OF TRUTH (SỰ THẬT TỪ CODEBASE)

Đây là bản báo cáo đối chiếu Sự thật (từ Code thực tế đang chạy) với các tuyên bố/tài liệu cũ. Báo cáo này **thay thế** toàn bộ các báo cáo rời rạc trước đó để làm nguồn Sự thật duy nhất.

## 1. Bảng đối chiếu Sự thật từ Code

| Mục | Trạng thái thật trong code | Bằng chứng (file:dòng) | Mâu thuẫn với báo cáo nào |
| :--- | :--- | :--- | :--- |
| **1. Thuật toán phân loại** | **MLP** (Mạng nơ-ron truyền thẳng). Code khởi tạo mô hình bằng `tf.sequential()` với 3 output classes (Fist, Open, Pinch). Không dùng KNN. | `d:\test_planets\src\ml_gesture.js:194`<br>`d:\test_planets\src\ml_gesture.js:264-267` | *Không mâu thuẫn (khớp với quyết định đã chốt MLP).* |
| **2. Pipeline Convert** | **Không có bước ONNX nào**. Quá trình convert sang OpenVINO không thông qua ONNX. Lệnh grep toàn bộ codebase cho "onnx" trả về 0 kết quả. | Toàn bộ codebase (0 kết quả grep `onnx`). | *Đã từng ghi nhầm có ONNX trong các tài liệu cũ.* |
| **3. Cơ chế tương tác (Số tay)** | **2 tay (Bimanual)**.<br>- **Select:** Tay trái (1-4 ngón) chọn Jupiter-Neptune, Tay phải (1-5 ngón) chọn Sun-Mars.<br>- **Pan/Zoom:** Chế độ Modifier. Yêu cầu **Tay trái nắm đấm (Fist)** + **Tay phải Pinch/Di chuyển**.<br>- **Rotate:** Chỉ áp dụng cho Tay phải di chuyển nhanh. | - Select: `src/renderer.js:925` (hàm `fingersToPlanetIdx`)<br>- Pan/Zoom: `src/renderer.js:1281` (Check leftFist + right Pinch/Pan)<br>- Rotate: `src/renderer.js:1385` (`if (isRight)`) | *Mâu thuẫn với nhận định "dao động 3 lần (1 tay -> 2 tay -> 1 tay)". Code hiện tại KHÓA CỨNG ở chế độ 2 tay.* |
| **4. Độ phủ MLP cá nhân hóa** | **Chỉ áp dụng cho Fist (Nắm tay)**. <br>- `checkFist` gọi `predictMLGestureSync`.<br>- `checkPinch` **bỏ qua AI**, bị hardcode fallback hình học (`countFingersAll > 0`). | - Fist: `src/renderer.js:1072-1080`<br>- Pinch bypass: `src/renderer.js:1096-1102` | *Mâu thuẫn với quan điểm "MLP phân loại 3 lớp sẽ được dùng cho cả 3 thao tác". Thực tế Pinch không dùng ML.* |
| **5. FPS (141 FPS)** | **CÓ THẬT**. Con số 141 FPS không phải báo cáo khống, mà đã được ghi nhận trong file log stress test thực tế khi chạy engine TF.js và OpenVINO. | `d:\test_planets\benchmark_logs.txt:131`<br>`benchmark_logs.txt:195` | *Không mâu thuẫn. Đây là số liệu thật từ log.* |
| **6. Tính năng UI bị nghi mất** | **VẪN TỒN TẠI**.<br>- "Privacy Badge" (100% Edge AI) vẫn nằm trong thẻ HTML.<br>- HUD "Geometric Overridden" vẫn nằm trong logic Anti-Hallucination khi checkFist. | - Privacy Badge: `src/index.html:341`, `981`<br>- Geometric Overridden: `src/renderer.js:1086-1090` | *Không mâu thuẫn (việc revert nhánh màn hình đen không làm mất UI này).* |
| **7. Tài liệu tổng (MD files)** | **Mâu thuẫn nặng về nội dung và mục đích.**<br>- `project_review_and_improvement_plan.md`: Đang chứa thiết kế kiến trúc AI, Scope Freeze, chốt độ tuổi (11-18) và chế độ 2 tay.<br>- `implementation_plan.md`: Đã bị ghi đè hoàn toàn thành "Kế hoạch Cải thiện UI/UX (Dựa trên design-taste-frontend)" và không còn chứa kiến trúc code. | - `project_review_and_improvement_plan.md`<br>- `implementation_plan.md` | *Hai file này hiện tại không liên quan đến nhau. `implementation_plan.md` đã bị mất chức năng làm tài liệu tổng.* |

---

## 2. Các quyết định ĐÃ ĐƯỢC CHỐT LẠI (Locked Decisions)

Dựa trên code và lịch sử, có 2 điểm dao động đã được người dùng (User) xác nhận chốt cứng phương án cuối cùng vào ngày 09/08/2026:

### A. Cơ chế tương tác (Số tay)
**Quyết định:** Giữ nguyên **2 tay (Bimanual Modifier)**. 
- Tay trái làm phím Modifier (Nắm đấm) và chọn các hành tinh vòng ngoài (Jupiter-Neptune).
- Tay phải thực hiện thao tác camera (Pan/Zoom/Rotate) và chọn hành tinh vòng trong (Sun-Mars).
- **Lý do:** Kịch bản Intro đã được viết lại toàn bộ sang concept "Bảng điều khiển phi thuyền 2 tay" để hướng dẫn người dùng "Khóa mục tiêu", làm tăng tính ngầu và phù hợp với UX Bimanual.

### B. Độ tuổi đối tượng mục tiêu
**Quyết định:** Đối tượng **11-18 tuổi (THCS & THPT)**.
- **Lý do:** Khớp với khả năng vận động tinh để điều khiển 2 tay độc lập. Người dùng đủ lớn để nắm bắt kịch bản "Đồng bộ Sinh trắc học" và điều khiển phi thuyền.

### C. Cơ chế nhận diện Pinch (Zoom)
**Quyết định:** **Plan B - Giữ nguyên Hybrid AI (Không dùng MLP cho Pinch)**.
- **Lý do Kỹ thuật (Hybrid Architecture):** Dùng AI đúng chỗ AI mạnh, dùng Rule-based đúng chỗ Rule-based mạnh. Thao tác Nắm tay (Fist) rất khó nhận diện bằng hình học do biến thiên về hình dáng và kích thước tay giữa các cá nhân -> **Giao cho AI (MLP) giải quyết**. Thao tác Zoom (Pinch) đòi hỏi đo đạc khoảng cách vật lý của ngón tay liên tục theo thời gian thực (đóng/mở liên tục) -> **Giao cho Rule-based (Hình học) giải quyết** để đảm bảo độ trễ thấp nhất, tránh hiện tượng giật lag ở các khung hình trung gian của AI.
- **Lưu ý triển khai:** Khẳng định quyết định phân chia tác vụ thông minh này một cách chủ động trong bài thuyết trình để biến một "lỗ hổng" thành một "điểm nhấn kiến trúc hệ thống".

---

## 3. Khuyến nghị dọn dẹp Tài liệu (Documentation Housekeeping)

Để tránh tình trạng trôi dạt thông tin và "ảo giác" trong tương lai, tôi khuyến nghị cấu trúc lại tài liệu như sau:

1. **Giữ lại làm Tài liệu Tổng duy nhất:**
   - Dùng chính file `SOURCE_OF_TRUTH_AUDIT.md` này làm tài liệu tổng (hoặc đổi tên thành `ARCHITECTURE_AND_SPECS.md`) vì nó phản ánh 100% sự thật từ code.
2. **Archive/Xóa các file gây mâu thuẫn:**
   - `implementation_plan.md`: Hiện chỉ chứa Task UI/UX ngắn hạn. Nên để nó quay về đúng nghĩa vụ là Kế hoạch thực thi tạm thời, xóa đi sau khi xong task.
   - `project_review_and_improvement_plan.md`: Đã lỗi thời về một số mặt. Khuyên dùng để tham khảo lịch sử các quyết định, nhưng KHÔNG dùng làm Source of Truth.
   - Các file báo cáo `m1`, `m2`, `m3` cũ: Chỉ dùng để lưu trữ.
