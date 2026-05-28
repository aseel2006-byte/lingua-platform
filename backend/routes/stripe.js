const express=require('express'),Stripe=require('stripe');
const db=require('../db'),{verifyToken}=require('../middleware/auth'),{sendOrderConfirmation}=require('../services/email');
const router=express.Router();
const stripe=Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/checkout-session',verifyToken,async(req,res)=>{
  try{
    const{items}=req.body;if(!items?.length)return res.status(400).json({error:'السلة فارغة'});
    const ids=items.map(i=>i.productId);
    const ph=ids.map((_,i)=>'$'+(i+1)).join(',');
    const prods=await db.query('SELECT id,title,price FROM products WHERE id IN('+ph+') AND is_active=true',ids);
    const total=prods.rows.reduce((s,p)=>s+Number(p.price),0);
    const or=await db.query("INSERT INTO orders(user_id,total,status)VALUES($1,$2,'pending')RETURNING id",[req.user.id,total]);
    const orderId=or.rows[0].id;
    for(const p of prods.rows)await db.query('INSERT INTO order_items(order_id,product_id,price)VALUES($1,$2,$3)',[orderId,p.id,p.price]);
    const session=await stripe.checkout.sessions.create({mode:'payment',line_items:prods.rows.map(p=>({price_data:{currency:'sar',unit_amount:Math.round(Number(p.price)*100),product_data:{name:p.title}},quantity:1})),success_url:process.env.FRONTEND_URL+'/success.html?session_id={CHECKOUT_SESSION_ID}',cancel_url:process.env.FRONTEND_URL+'/cart',customer_email:req.user.email,locale:'ar',metadata:{orderId,userId:req.user.id}});
    await db.query('UPDATE orders SET stripe_session=$1 WHERE id=$2',[session.id,orderId]);
    res.json({sessionId:session.id,url:session.url});
  }catch(e){console.error(e);res.status(500).json({error:'خطأ في الدفع'});}
});

router.post('/webhook',async(req,res)=>{
  let event;
  try{event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}
  catch(e){return res.status(400).send('Error: '+e.message);}
  if(event.type==='checkout.session.completed'){
    const{orderId,userId}=event.data.object.metadata||{};
    if(!orderId||!userId)return res.json({received:true});
    const client=await db.getClient();
    try{
      await client.query('BEGIN');
      await client.query("UPDATE orders SET status='paid',stripe_intent=$1 WHERE id=$2",[event.data.object.payment_intent,orderId]);
      const items=await client.query('SELECT product_id FROM order_items WHERE order_id=$1',[orderId]);
      for(const item of items.rows)await client.query("INSERT INTO enrollments(user_id,product_id)VALUES($1,$2)ON CONFLICT DO NOTHING",[userId,item.product_id]);
      await client.query('COMMIT');
      sendOrderConfirmation(userId,orderId).catch(console.error);
    }catch(e){await client.query('ROLLBACK');}finally{client.release();}
  }
  res.json({received:true});
});

router.post('/refund',verifyToken,async(req,res)=>{
  const{orderId}=req.body;
  const or=await db.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2',[orderId,req.user.id]);
  const o=or.rows[0];if(!o)return res.status(404).json({error:'غير موجود'});
  if(o.status!=='paid')return res.status(400).json({error:'لا يمكن الاسترداد'});
  if((Date.now()-new Date(o.created_at))/86400000>7)return res.status(400).json({error:'انتهت فترة 7 أيام'});
  await stripe.refunds.create({payment_intent:o.stripe_intent});
  await db.query("UPDATE orders SET status='refunded',refunded_at=NOW() WHERE id=$1",[orderId]);
  await db.query('DELETE FROM enrollments WHERE user_id=$1 AND product_id IN(SELECT product_id FROM order_items WHERE order_id=$2)',[req.user.id,orderId]);
  res.json({message:'تم الاسترداد بنجاح'});
});
module.exports=router;