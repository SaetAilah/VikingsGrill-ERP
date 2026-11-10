export const errorMiddleware = (err, req, res, _next) => {
  console.error('[API Error]:', err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected error occurred.';
  res.status(status).json({ error: message });
};

export default errorMiddleware;

