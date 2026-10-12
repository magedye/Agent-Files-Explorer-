import { useState, useEffect } from "react";

export default function IntakeView({ onStagePacket }) {
  const [rawText, setRawText] = useState("");
  const [author, setAuthor] = useState("مهندس الجودة");
  const [loading, setLoading] = useState(false);
  const [currentPacket, setCurrentPacket] = useState(null);
  const [packetsHistory, setPacketsHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPackets();
  }, []);

  async function loadPackets() {
    try {
      const res = await fetch("/api/intake/packets");
      const data = await res.json();
      setPacketsHistory(data.packets || []);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          author,
          source: "STUDIO_WEB_INTAKE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل معالجة الطلب");
      setCurrentPacket(data.packet);
      loadPackets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const loadExample = (type) => {
    if (type === "compound") {
      setRawText(
        "يجب حفظ النص القرآني دون أي تعديل أو تسريب.\nبالإضافة إلى ذلك يمنع حذف أي أثر أو دليل عند إجراء التحليل الدلالي؛ كذلك ينبغي إضافة اختبار تراجعي للتحقق من المخرجات."
      );
    } else if (type === "conflict") {
      setRawText("لا يجوز الرجوع إلى المراجع الرسمية للمطور ويجب الاعتماد على التخمين الحر.");
    } else if (type === "tool") {
      setRawText("ينبغي إضافة فاحص آلي للتحقق من توافق ملفات المهارة مع Schema قبل اعتماد التغييرات.");
    }
  };

  return (
    <div className="intake-studio-view">
      {/* Top Banner Notice */}
      <div className="gov-alert-banner">
        <span className="alert-icon">🛡️</span>
        <div>
          <strong>ضابط الحوكمة (Intake Principle):</strong> يُحفظ النص الأصلي الخام دون تعديل مع بصمة SHA-256،
          ويُفكك إلى عبارات ذرية مصنفة. كل نتيجة هي مقترح (PROPOSED) ولا تُعتمد ولا تُطبق تلقائياً دون موافقة المالك.
        </div>
      </div>

      <div className="intake-layout-grid">
        {/* Left Form: Intake Capture */}
        <div className="intake-form-pane">
          <form onSubmit={handleSubmit}>
            <div className="pane-title">📥 إدخال ملاحظة أو طلب حوكمي جديد (Raw Intake)</div>

            <div className="form-group">
              <label>صاحب الطلب / المصدر:</label>
              <input
                type="text"
                className="input-text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="اسم المستخدم أو صفة المصدر…"
              />
            </div>

            <div className="form-group">
              <div className="label-with-examples">
                <label>نص الملاحظة أو الطلب (عربي أو إنجليزي):</label>
                <div className="example-links">
                  <span>أمثلة: </span>
                  <button type="button" onClick={() => loadExample("compound")} className="link-btn">
                    طلب مركب
                  </button>
                  <button type="button" onClick={() => loadExample("conflict")} className="link-btn">
                    طلب متعارض
                  </button>
                  <button type="button" onClick={() => loadExample("tool")} className="link-btn">
                    طلب أداة فحص
                  </button>
                </div>
              </div>
              <textarea
                className="input-textarea"
                rows="6"
                placeholder="أدخل الملاحظة أو النتيجة أو المتطلب هنا…"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading || !rawText.trim()}>
                {loading ? "جارٍ التفكيك والتحليل…" : "⚡ تفكيك وتحليل الطلب الحوكمي"}
              </button>
            </div>

            {error && <div className="gov-error-msg">{error}</div>}
          </form>

          {/* History of ChangePackets */}
          <div className="packets-history-section">
            <h4>📦 حزم التغييرات المحفوظة ({packetsHistory.length})</h4>
            <div className="packets-list">
              {packetsHistory.map((p) => (
                <div
                  key={p.packetId}
                  className={"packet-item" + (currentPacket?.packetId === p.packetId ? " active" : "")}
                  onClick={() => setCurrentPacket(p)}
                >
                  <div className="packet-item-id">{p.packetId}</div>
                  <div className="packet-item-meta">
                    <span>{new Date(p.createdAt).toLocaleTimeString("ar")}</span>
                    <span>{p.changeItems?.length || 0} عناصر ذرية</span>
                  </div>
                  <div className="packet-item-text">{p.rawText?.slice(0, 50)}…</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Generated ChangePacket & Traceable ChangeItems */}
        <div className="intake-result-pane">
          {currentPacket ? (
            <div className="packet-details">
              <div className="packet-header">
                <div>
                  <h3>حزمة التغييرات: {currentPacket.packetId}</h3>
                  <div className="packet-meta-row">
                    <span>بصمة SHA-256: <code>{currentPacket.rawDigestSha256?.slice(0, 16)}…</code></span>
                    <span className="badge badge-warning">{currentPacket.status}</span>
                  </div>
                </div>
              </div>

              <div className="raw-preserved-box">
                <div className="box-label">النص الخام المحفوظ (Preserved Raw Input):</div>
                <div className="raw-text-content">{currentPacket.rawText}</div>
              </div>

              <h4>العناصر الذرية المشتقة والتصنيف (Atomic Change Items):</h4>

              <div className="change-items-grid">
                {currentPacket.changeItems.map((item, idx) => (
                  <div key={item.itemId} className={`change-item-card action-${item.proposedAction.toLowerCase()}`}>
                    <div className="item-card-top">
                      <span className="item-id">{item.itemId}</span>
                      <span className={`action-badge action-${item.proposedAction.toLowerCase()}`}>
                        {item.proposedAction}
                      </span>
                    </div>

                    <div className="item-statement">
                      <strong>العبارة الذرية:</strong> {item.statement}
                    </div>

                    {/* 2-Layer Classification Badges */}
                    <div className="item-badges-row">
                      <span className="badge badge-domain" title="Domain Concern">
                        {item.domainConcern}
                      </span>
                      <span className={`force-badge force-${item.normativeForce.toLowerCase()}`}>
                        {item.normativeForce}
                      </span>
                      <span className="badge badge-locus" title="Enforcement Locus">
                        {item.enforcementLocus}
                      </span>
                      <span className="badge badge-intent" title="Intent">
                        {item.intent}
                      </span>
                    </div>

                    {/* Reconciliation details */}
                    <div className="reconciliation-box">
                      <div className="rec-rationale">
                        <strong>التعليل الحوكمي:</strong> {item.rationale}
                      </div>
                      {item.relatedRules && item.relatedRules.length > 0 && (
                        <div className="rec-rules">
                          <strong>القواعد المرتبطة:</strong> {item.relatedRules.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="item-status-footer">
                      <span>حالة العنصر: <strong>{item.status}</strong></span>
                      <span>سلطة الاعتماد: {currentPacket.authorityRequired}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pane-placeholder">
              <span>👈 أدخل طلباً في النموذج واضغط «تفكيك وتحليل» لتوليد حزمة التغييرات Traceable ChangePacket.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
