const STATUS_LABELS = {
  NEW: { text: "Шинэ", tone: "neutral" },
  PENDING: { text: "Хүлээгдэж буй", tone: "pending" },
  APPROVED: { text: "Баталгаажсан", tone: "approved" },
  REJECTED: { text: "Татгалзсан", tone: "rejected" }
};

export default function StatusBadge({ status }) {
  const meta = STATUS_LABELS[status] || { text: status, tone: "neutral" };
  return (
    <span className={`status-badge status-badge-${meta.tone}`}>
      {meta.text}
    </span>
  );
}