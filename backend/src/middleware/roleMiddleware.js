export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action.' });
  }
  next();
};

export const requireOwner = requireRole('Owner');
export const requireManagerOrOwner = requireRole('Owner', 'Manager');
export const requireStaffOrAbove = requireRole('Owner', 'Manager', 'Staff');

export default {
  requireRole,
  requireOwner,
  requireManagerOrOwner,
  requireStaffOrAbove,
};

