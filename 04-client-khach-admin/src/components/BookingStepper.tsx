export default function BookingStepper({ current }: { current: number }) {
  const steps = ["1. Phim", "2. Suất", "3. Ghế", "4. Đồ ăn vặt", "5. Thanh toán"];
  return (
    <div className="stepper">
      {steps.map((label, i) => (
        <span key={label} className={i + 1 <= current ? "step on" : "step"}>{label}</span>
      ))}
    </div>
  );
}
