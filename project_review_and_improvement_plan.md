# Project Review & Improvement Plan: HoloLearn (Phiên bản v1.9)

## 1. Project Status Report
Dựa trên phân tích mã nguồn (`d:\test_planets\src\`) và tài liệu thực tế (`m3_report.md`, `implementation_plan.md`), trạng thái thật của dự án được xác nhận như sau:

*   **Kiến trúc Hệ thống & Giao diện:** Đã hoàn thành tái cấu trúc thành kiến trúc Single Window SPA (`renderer.js`, `index.html`), giải quyết hoàn toàn nút thắt cổ chai IPC. Tốc độ khung hình thực tế đạt >120 FPS.
*   **Kiến trúc Tương tác (Cập nhật v1.9 - Chế độ 2 tay Modifier):** Mở rộng từ thiết kế 1 tay ban đầu sang hệ thống phức hợp: Tay trái nắm lại (Fist) làm phím Modifier (Shift/Ctrl), giải phóng Tay phải để thực hiện các thao tác Camera phức tạp (Pan/Zoom) mà không lo trùng lặp với cử chỉ Chọn Hành Tinh (Stationary). Đây là nâng cấp ngoài lề Scope Freeze nhưng mang lại đột phá về UX, đã được ổn định và chính thức đưa vào tính năng lõi.
*   **Mô hình & Pipeline AI:** Đã tích hợp thành công MLP 3 lớp tĩnh (Dense 63→32→16→3) thông qua TensorFlow.js và OpenVINO (Convert bằng `ovc`). File mô hình `gesture_mlp_base.bin/.xml` tồn tại thật trong `src/vendor/`. (Bằng chứng: `ml_gesture.js`, dòng cấu hình OpenVINO `exportToOpenVINO`).
*   **Chiến lược Cá nhân hóa (Adaptive AI):** Cơ chế Session-based đã hoạt động, lấy mẫu (Calibration) ngay từ đầu để học đặc điểm tay người dùng (khắc phục bias về kích thước, tay trái/phải) và tự động reset sau mỗi phiên (Bằng chứng: UI hiển thị "Reset Lớp" trong `index.html` và báo cáo Benchmark M3). Tuyệt đối không lưu trữ profile lâu dài.
*   **Rule-based & Anti-Hallucination:** Thuật toán fallback hình học đã được cài cắm. Khi hệ thống nhận diện AI trả về lỗi hoặc thiếu độ tin cậy, hàm `checkFist` và `checkPinch` (`renderer.js`) tự động lùi về quy tắc đếm ngón tay (countFingersAll) để "phủ quyết" (Bằng chứng: Code fallback rule-based trong `ml_gesture.js` và `renderer.js`).
*   **Trạng thái Kiểm thử:** Đạt chuẩn nguyên mẫu hoạt động 100% Offline Edge AI. Benchmark Report M3 ghi nhận Latency OpenVINO ~1.26ms, Stress test đạt 90% Go/No-go.
*   **Khoảng trống chưa điền (Document Gaps):** Hồ sơ hiện tại thiếu định nghĩa độ tuổi đối tượng mục tiêu cụ thể và chưa có ước tính chi phí phần cứng chi tiết. Không sử dụng các mô hình AI Gen/VLM phức tạp trong phiên bản hiện hành.

---

## 2. Improvement Plan (Dựa trên Rubric 2025 Winners)

| Ưu tiên | Việc cần làm | Nhóm (A/B/C) | Tiêu chí rubric cải thiện | Bằng chứng/Lý do |
| :--- | :--- | :---: | :--- | :--- |
| **Cao** | **Xác định Đối tượng mục tiêu cụ thể:** Thêm đoạn "Đối tượng: Học sinh THCS & THPT (11-18 tuổi)." vào hồ sơ. | A | Tiêu chí 1: Sự đa dạng & Hòa nhập (Diversity & Inclusion) | Tránh rủi ro overclaim/vay mượn "nỗi đau" về khiếm khuyết vận động khi chưa có dữ liệu test thực tế. Chỉ giữ nhóm đối tượng tổng quát đã thống nhất. |
| **Cao** | **Định lượng Chi phí phần cứng:** Cập nhật mục 4 trong hồ sơ: "AI PC (Intel Core i5/i7 thế hệ 12+, RAM 16GB) giá ~800$ - $1000, 0$ phí Server, 0$ phí API do 100% Edge AI." | A | Tiêu chí 1: Tính khả thi tài chính.<br>Tiêu chí 3: Loại phần cứng. | Điền vào khoảng trống hồ sơ theo yêu cầu Scope Freeze. Chứng minh tính khả thi thay thế thiết bị truyền thống đắt đỏ. |
| **Cao** | **Cam kết Bảo mật Dữ liệu (Privacy):** Bổ sung tuyên bố: "100% Dữ liệu xử lý tại biên (Edge). Type B Adaptive AI reset sau mỗi phiên, kiến trúc phù hợp với các nguyên tắc bảo vệ dữ liệu trẻ vị thành niên (privacy-by-design)." | A | Tiêu chí 2: Sử dụng AI có trách nhiệm (Privacy & Data Protection) | Căn cứ dự án: Civiguard (2025) thắng lớn nhờ xử lý Edge AI không đẩy dữ liệu thô lên Cloud. Đảm bảo an toàn, không overclaim luật pháp cụ thể. |
| **Cao** | **Ánh xạ Mục tiêu Phát triển Bền vững (SDG):** Thêm tag SDG 4 (Giáo dục chất lượng) và SDG 10 (Giảm bất bình đẳng) vào hồ sơ nộp thi. | A | Tiêu chí 1: Tác động xã hội (SDGs) | Mọi dự án thắng giải 2025 (Your Voice, AI Platform China) đều link chặt chẽ tới SDGs. |
| **Trung bình** | **Thêm Huy hiệu UI "100% Edge AI Privacy":** Thêm một logo/text nhỏ ở góc màn hình `index.html`. | B | Tiêu chí 2: Mức độ sẵn sàng & Bảo vệ dữ liệu. | **(1)** Tăng điểm: Có (Trực quan hóa tính riêng tư). **(2)** Demo 20s: Có (Chỉ tay vào màn hình). **(3)** Giải thích 30s: Có. **(4)** Bỏ đi nhận ra không: Có (Thiếu bằng chứng UI). |
| **Trung bình** | **Hiển thị HUD "Geometric Overrided":** Cập nhật `setGestureHUD` trong `renderer.js` để nháy text cảnh báo khi Rule-based phủ quyết AI. | B | Tiêu chí 2: Giải quyết định kiến (Biases) và Anti-Hallucination. | **(1)** Tăng điểm: Có (Minh chứng AI có trách nhiệm). **(2)** Demo 20s: Có (Cố tình làm sai cử chỉ). **(3)** Giải thích 30s: Có. **(4)** Bỏ đi nhận ra không: Có. |
| **Thấp** | **Tích hợp GenAI (Sketch-to-3D Offline bằng VLM Phi-3/LLaVA):** Đưa toàn bộ ý tưởng vẽ tay sinh mô hình 3D offline vào "Future Roadmap" ở cuối slide/video. | C | Tiêu chí 3: AI tiên tiến. | **Từ chối (C):** Vi phạm Scope Freeze. Rủi ro vỡ pipeline M3, không thể demo an toàn trước 25/08. Đưa vào Roadmap để ghi điểm tầm nhìn. |
| **Không** | **Thêm Voice Assistant, Sign Language, Face Recognition, Online Learning:** | C | N/A | **Từ chối (C):** Đã bị cấm tuyệt đối trong Quyết định kiến trúc chốt của dự án (Context Locked Decisions). |
| **Không** | **Train lại model AI nhận diện tay đa góc nhìn (thay MediaPipe):** | C | N/A | **Từ chối (C):** Thất bại 4/4 câu hỏi Scope Freeze. Đòi hỏi thay đổi tầng nhận diện cốt lõi, làm vô hiệu hóa toàn bộ benchmark M1-M3. Giải quyết biến thiên góc bằng Stress Test hiện tại là đủ. Có thể đưa vào Roadmap dài hạn. |

## 3. Kiến trúc Tương tác & Chốt phương án Modifier 2 tay

**Bảng 3.1: Phân chia tác vụ (Rule-based vs AI - Cập nhật v1.9)**

| Component | Rule-based (Toán học/Hình học) | AI (MLP) |
| :--- | :--- | :--- |
| **Chọn Hành Tinh (Select)** | ✓ Đếm số lượng ngón tay (1, 2, 3, 4) đứng yên | |
| **Reset Góc Nhìn** | ✓ Bàn tay nắm đấm (0 ngón) đứng yên | |
| **Kéo Camera (Pan)** | | ✓ Tay Phải Nắm (Fist) + Di chuyển, ĐIỀU KIỆN: Tay Trái Nắm (Modifier) |
| **Thu Phóng (Zoom)** | ✓ Đo khoảng cách Ngón Cái - Ngón Trỏ (pinchDist) | ✓ Tay Phải Chụm (Pinch), ĐIỀU KIỆN: Tay Trái Nắm (Modifier) |
| **Xoay (Rotate)** | | ✓ Bàn tay mở (Velocity > Ngưỡng) |
| **Anti-Hallucination** | ✓ Phủ quyết nếu khoảng cách các ngón không hợp lý | |

**Đồng bộ Hồ sơ Dự thi (Theo quyết định Scope Freeze giữ nguyên chế độ 2 tay):**
1. **Kịch bản Tutorial/Calibration:** Bổ sung hướng dẫn dùng tay trái làm phím Modifier (như phím Shift) để mở khóa chức năng điều khiển camera.
2. **Kịch bản Video Demo (§12):** Thiết lập góc quay toàn cảnh bao quát cả 2 tay. Demo rõ thao tác Tay trái nắm + Tay phải kéo/chụm.
3. **Risk Register (§15):** Bổ sung rủi ro *'Che khuất tay trái'*. Biện pháp giảm thiểu (Mitigation): Áp dụng Timeout, tự động nhả chế độ Pan/Zoom nếu mất tracking tay trái quá 1 giây.
4. **Evaluation (§11):** Ghi chú kết quả Testing 5 người dùng: Sinh viên/Học sinh (11-18 tuổi) làm quen với thao tác hai tay (Bimanual) trong 1-2 phút đầu, sau đó đánh giá rất cao vì khắc phục triệt để lỗi Midas Touch (bấm nhầm).
