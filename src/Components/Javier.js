import React, { useEffect } from "react";

function Javier() {
  useEffect(() => {
    // Thay đổi title khi component được mount
    document.title = "Javier | Web";
  }, []); // Mảng dependencies rỗng để useEffect chỉ chạy một lần khi mount

  return (
    <div>
      <h1>Trang Web của Javier</h1>
      {/* Thêm nội dung khác cho component của bạn ở đây */}
    </div>
  );
}

export default Javier;
