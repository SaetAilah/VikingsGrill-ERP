export const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'You do not have permission to perform this action.' });
  }
  next();
};

export const requireOwner = requireRole('Owner');
export const requireManagerOrOwner = requireRole('Owner', 'Manager', 'management', 'administrator');
export const requireAccountingOrManagement = requireRole(
  'Owner',
  'Manager',
  'management',
  'administrator',
  'accounting_staff',
  'cashier'
);
export const requireProcurementAccess = requireRole(
  'Owner',
  'Manager',
  'management',
  'administrator',
  'accounting_staff',
  'inventory_staff'
);
export const requireStaffOrAbove = requireRole(
  'Owner',
  'Manager',
  'Staff',
  'management',
  'administrator',
  'cashier',
  'kitchen_staff',
  'inventory_staff',
  'hr_staff',
  'accounting_staff'
);

export default {
  requireRole,
  requireOwner,
  requireManagerOrOwner,
  requireAccountingOrManagement,
  requireStaffOrAbove,
};

