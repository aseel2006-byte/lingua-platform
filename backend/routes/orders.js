const express=require('express'),db=require('../db'),{verifyToken}=require('../middleware/auth');
const router=express.Router();
router.get('/',verifyToken,async(req,res)=>{
  const r=await db.query("SELECT o.id,o.total,o.status,o.created_at,json_agg(json_build_object('title',p.title))AS items FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC",[req.user.id]);
  res.json({orders:r.rows});
});
module.exports=router;