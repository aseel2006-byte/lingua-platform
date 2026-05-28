const{Pool}=require('pg');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false,max:20});
pool.on('error',(err)=>{console.error('DB error',err);process.exit(-1);});
module.exports={query:(t,p)=>pool.query(t,p),getClient:()=>pool.connect()};