export const getErrorMessage = (error, fallback = "Something went wrong") => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.join(", ");
  if (detail && typeof detail === "object") {
    if (typeof detail.message === "string") return detail.message;
    if (Array.isArray(detail.errors)) return detail.errors.join(", ");
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  return error?.message || fallback;
};

export const formatINR = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN")}`;
};
