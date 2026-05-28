const jwt=require('jsonwebtoken');
const SECRET=process.env.JWT_SECRET||'lingua_dev_secret';
function verifyToken(req,res,next){const h=req.headers.authorization||'';const t=h.startsWith('Bearer ')?h.slice(7):null;if(!t)return res.status(401).json({error:'لا يوجد رمز'});try{req.user=jwt.verify(t,SECRET);next();}catch(e){return res.status(401).json({error:'رمز غير صالح'});}}
function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'للمشرفين فقط'});next();}
function generateTokens(user){const p={id:user.id,email:user.email,role:user.role,name:user.name};return{token:jwt.sign(p,SECRET,{expiresIn:'7d'}),refresh:jwt.sign({id:user.id},SECRET+'_refresh',{expiresIn:'30d'})};}
module.exports={verifyToken,requireAdmin,generateTokens};