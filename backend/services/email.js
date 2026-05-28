const db=require('../db');
async function sendOrderConfirmation(userId,orderId){
  const[u,o]=await Promise.all([db.query('SELECT name,email FROM users WHERE id=$1',[userId]),db.query("SELECT o.total,array_agg(p.title) AS products FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN products p ON p.id=oi.product_id WHERE o.id=$1 GROUP BY o.id",[orderId])]);
  if(!u.rows[0]||!o.rows[0])return;
  console.log('📧 Order confirmation for',u.rows[0].email);
}
module.exports={sendOrderConfirmation};