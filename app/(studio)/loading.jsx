export default function Loading() {
  return (
    <main className="shell" aria-busy="true" aria-live="polite">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Patchie">
          <span className="brand-mark">P</span>
          <span>Patchie</span>
        </a>
        <nav className="studio-nav patchie-site-nav" aria-label="Điều hướng chính">
          <a className="studio-nav-active is-current" href="/" aria-current="page">Custom Workshop</a>
          <a href="/patches">Patch Market</a>
          <a href="/looks">Lookbook</a>
        </nav>
      </header>
      <section className="catalog-loading loading-card">
        <div className="loading-art" aria-hidden="true">
          <div className="loading-tee"><span>P</span></div>
          <i className="loading-patch loading-patch-a">✦</i>
          <i className="loading-patch loading-patch-b">♡</i>
          <i className="loading-patch loading-patch-c">☀</i>
          <i className="loading-patch loading-patch-d">✿</i>
          <span className="loading-spark loading-spark-a">✧</span>
          <span className="loading-spark loading-spark-b">✦</span>
        </div>
        <b>Đang dán chút đáng yêu lên shop…</b>
        <p>Patchie đang gom sản phẩm base và mấy miếng patch xinh cho bạn.</p>
        <div className="loading-dots" aria-label="Đang tải"><i></i><i></i><i></i></div>
      </section>
      <footer className="studio-footer">
        <div><span>Patchie · Customize your everyday</span><span>Chọn patch · Tạo mã đơn · Gửi shop</span></div>
      </footer>
    </main>
  );
}
