// Maintenance mode decommissioned per system architecture update.
// Always pass-through.
const checkMaintenance = (req, res, next) => {
    next();
};

export { checkMaintenance };
