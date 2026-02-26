import Spinner from "react-bootstrap/Spinner";

export function LoadingState({ label = "Loading" }) {
  return (
    <div className="hp-card hp-loading">
      <Spinner animation="border" role="status" size="sm" />
      <span>{label}</span>
    </div>
  );
}
