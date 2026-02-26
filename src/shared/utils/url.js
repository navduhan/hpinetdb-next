export function readQueryParams(search) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(params.entries());
}

export function buildSearch(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export function csvToArray(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split(/[\n,\t]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function arrayToCsv(list = []) {
  return list.join(",");
}
