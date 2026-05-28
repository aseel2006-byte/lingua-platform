const express=require('express'),db=require('../db'),{verifyToken,requireAdmin}=require('../middleware/auth');
const router=express.Router();
router.get('/',async(req,res)=>{
  const{lang,level,skill,page=1,limit=12}=req.query;
  const offset=(Number(page)-1)*Number(limit);
  const conds=['is_active=true'],params=[];let i=1;
  if(lang){conds.push('lang=$'+i++);params.push(lang);}
  if(level){conds.push('level=$'+i++);params.push(level);}
  if(skill){conds.push('skill=$'+i++);params.push(skill);}
  params.push(Number(limit),offset);
  const r=await db.query('SELECT * FROM products WHERE '+conds.join(' AND ')+' ORDER BY review_count DESC LIMIT $'+i+' OFFSET $'+(i+1),params);
  res.json({products:r.rows});
});
router.get('/:id',async(req,res)=>{
  const[p,rv]=await Promise.all([db.query('SELECT * FROM products WHERE id=$1',[req.params.id]),db.query('SELECT r.*,u.name AS user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 ORDER BY r.created_at DESC',[req.params.id])]);
  if(!p.rows[0])return res.status(404).json({error:'غير موجود'});
  res.json({product:p.rows[0],reviews:rv.rows});
});
router.post('/:id/review',verifyToken,async(req,res)=>{
  const{rating,comment}=req.body;
  const r=await db.query('INSERT INTO reviews(user_id,product_id,rating,comment)VALUES($1,$2,$3,$4)ON CONFLICT(user_id,product_id)DO UPDATE SET rating=$3,comment=$4 RETURNING *',[req.user.id,req.params.id,rating,comment||null]);
  res.status(201).json({review:r.rows[0]});
});
router.post('/',verifyToken,requireAdmin,async(req,res)=>{
  const{title,description,price,original_price,lang,level,skill,badge,is_free,stripe_price_id}=req.body;
  const r=await db.query('INSERT INTO products(title,description,price,original_price,lang,level,skill,badge,is_free,stripe_price_id)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)RETURNING *',[title,description,price,original_price,lang,level,skill,badge,is_free||false,stripe_price_id]);
  res.status(201).json({product:r.rows[0]});
});
router.delete('/:id',verifyToken,requireAdmin,async(req,res)=>{
  await db.query('UPDATE products SET is_active=false WHERE id=$1',[req.params.id]);
  res.json({message:'تم الحذف'});
});
module.exports=router;