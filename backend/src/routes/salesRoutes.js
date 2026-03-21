import express from "express";
import SalesController from "../controllers/salesController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/goals", auth, SalesController.AddOrUpdateMetrics);
router.post("/addsale", auth, SalesController.AddSale);
router.delete("/deletesale", auth, SalesController.DeleteSale);
router.get("/goals", auth, SalesController.ListMetrics);
router.post("/sales", auth, SalesController.ListSales);
router.get("/sales/:seller", auth, SalesController.ListSalesBySeller);
router.get(
  "/sales/:seller/:city",
  auth,
  SalesController.ListSalesBySellerAndCity,
);
router.get("/sales", auth, SalesController.ListAllSales);
router.delete("/salesdelete/:id", auth, SalesController.DeleteSale);
export default router;
