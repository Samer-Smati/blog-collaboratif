// Add this route BEFORE the '/:id' route
router.get("/tags", articleController.getAllTags);

// Existing routes
router.get("/:id", articleController.getArticleById);
