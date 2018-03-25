const apiRoutes = require('../router/routes/apiRoutes');

const mainRouter = {
    "sample":apiRoutes.sample,
    "notfound":apiRoutes.notFound,
    "ping":apiRoutes.ping,
    "users":apiRoutes.users,
    "tokens":apiRoutes.tokens,
    "checks":apiRoutes.checks
};

module.exports = mainRouter;