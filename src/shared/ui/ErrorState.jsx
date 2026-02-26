import Button from "react-bootstrap/Button";

export function ErrorState({ message, onRetry }) {
  return (
    <div className="hp-card hp-error">
      <h5>Request failed</h5>
      <p>{message || "Unable to load data."}</p>
      {onRetry ? (
        <Button variant="outline-danger" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
