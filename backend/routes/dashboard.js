const express=require('express'),db=require('../db'),{verifyToken}=require('../middleware/auth');
const router=express.Router();
router.get('/enrollments',verifyToken,async(req,res)=>{
  const r=await db.query('SELECT e.*,p.title,p.lang,p.level,p.skill,p.download_url FROM enrollments e JOIN products p ON p.id=e.product_id WHERE e.user_id=$1 ORDER BY e.enrolled_at DESC',[req.user.id]);
  res.json({enrollments:r.rows});
});
router.put('/enrollments/:pid/progress',verifyToken,async(req,res)=>{
  const{progress}=req.body;
  const r=await db.query('UPDATE enrollments SET progress=$1,completed=($1=100),updated_at=NOW() WHERE user_id=$2 AND product_id=$3 RETURNING *',[progress,req.user.id,req.params.pid]);
  res.json({enrollment:r.rows[0]});
});
router.get('/stats',verifyToken,async(req,res)=>{
  const[t,a,d]=await Promise.all([db.query('SELECT COUNT(*) FROM enrollments WHERE user_id=$1',[req.user.id]),db.query('SELECT ROUND(AVG(progress)::numeric,1) AS avg FROM enrollments WHERE user_id=$1',[req.user.id]),db.query('SELECT COUNT(*) FROM enrollments WHERE user_id=$1 AND completed=true',[req.user.id])]);
  res.json({totalCourses:Number(t.rows[0].count),avgProgress:Number(a.rows[0].avg)||0,completedCount:Number(d.rows[0].count)});
});
router.get('/orders',verifyToken,async(req,res)=>{
  const r=await db.query("SELECT o.*,json_agg(json_build_object('title',p.title,'price',oi.price))AS items FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC",[req.user.id]);
  res.json({orders:r.rows});
});
module.exports=router;