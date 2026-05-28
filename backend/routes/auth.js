// Auth: Email + Google OAuth + WebAuthn (Face ID)
const express=require('express'),bcrypt=require('bcrypt');
const{OAuth2Client}=require('google-auth-library');
const{generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse}=require('@simplewebauthn/server');
const db=require('../db');
const{generateTokens,verifyToken}=require('../middleware/auth');
const router=express.Router();
const SALT=12;
const gClient=new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RP_NAME='Lingua',RP_ID=process.env.WEBAUTHN_RP_ID||'localhost',RP_ORIGIN=process.env.WEBAUTHN_RP_ORIGIN||'http://localhost:3000';

// Email Register
router.post('/register',async(req,res)=>{
  try{
    const{name,email,phone,password}=req.body;
    if(!name||!email||!password)return res.status(400).json({error:'الاسم والإيميل وكلمة المرور مطلوبة'});
    if(password.length<8)return res.status(400).json({error:'كلمة المرور 8 أحرف+'});
    const ex=await db.query('SELECT id FROM users WHERE email=$1',[email.toLowerCase()]);
    if(ex.rows.length)return res.status(409).json({error:'البريد مسجّل مسبقاً'});
    const hashed=await bcrypt.hash(password,SALT);
    const{rows}=await db.query("INSERT INTO users(name,email,phone,password,auth_provider)VALUES($1,$2,$3,$4,'email')RETURNING id,name,email,role",[name,email.toLowerCase(),phone||null,hashed]);
    res.status(201).json({user:rows[0],...generateTokens(rows[0])});
  }catch(e){res.status(500).json({error:'خطأ في إنشاء الحساب'});}
});

// Email Login
router.post('/login',async(req,res)=>{
  try{
    const{email,password}=req.body;
    if(!email||!password)return res.status(400).json({error:'البريد وكلمة المرور مطلوبان'});
    const{rows}=await db.query('SELECT * FROM users WHERE email=$1 AND is_active=true',[email.toLowerCase()]);
    const user=rows[0];
    if(!user||!user.password)return res.status(401).json({error:'بيانات الدخول غير صحيحة'});
    if(!await bcrypt.compare(password,user.password))return res.status(401).json({error:'بيانات الدخول غير صحيحة'});
    const{password:_,...safe}=user;
    res.json({user:safe,...generateTokens(user)});
  }catch(e){res.status(500).json({error:'خطأ في الدخول'});}
});

// Google OAuth
router.post('/google',async(req,res)=>{
  try{
    const{credential}=req.body;
    const ticket=await gClient.verifyIdToken({idToken:credential,audience:process.env.GOOGLE_CLIENT_ID});
    const{sub:googleId,email,name,picture}=ticket.getPayload();
    let{rows}=await db.query('SELECT * FROM users WHERE google_id=$1 OR email=$2 LIMIT 1',[googleId,email.toLowerCase()]);
    let user=rows[0];
    if(user){
      const u=await db.query("UPDATE users SET google_id=$1,google_picture=$2,auth_provider=CASE WHEN auth_provider='email' THEN 'both' ELSE 'google' END WHERE id=$3 RETURNING id,name,email,role,google_picture",[googleId,picture,user.id]);
      user=u.rows[0];
    }else{
      const u=await db.query("INSERT INTO users(name,email,google_id,google_picture,auth_provider)VALUES($1,$2,$3,$4,'google')RETURNING id,name,email,role,google_picture",[name,email.toLowerCase(),googleId,picture]);
      user=u.rows[0];
    }
    res.json({user,...generateTokens(user)});
  }catch(e){console.error(e);res.status(401).json({error:'فشل التحقق من Google'});}
});

// WebAuthn Register Options
router.get('/webauthn/register-options',verifyToken,async(req,res)=>{
  const{rows}=await db.query('SELECT id,name,email FROM users WHERE id=$1',[req.user.id]);
  const user=rows[0];
  const existing=await db.query('SELECT credential_id FROM webauthn_credentials WHERE user_id=$1',[user.id]);
  const options=await generateRegistrationOptions({rpName:RP_NAME,rpID:RP_ID,userID:Buffer.from(user.id),userName:user.email,userDisplayName:user.name,timeout:60000,attestationType:'none',excludeCredentials:existing.rows.map(r=>({id:Buffer.from(r.credential_id,'base64url'),type:'public-key',transports:['internal']})),authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'preferred'},supportedAlgorithmIDs:[-7,-257]});
  await db.query("INSERT INTO webauthn_challenges(challenge,user_id,type)VALUES($1,$2,'registration')",[options.challenge,user.id]);
  res.json(options);
});

// WebAuthn Register Verify
router.post('/webauthn/register-verify',verifyToken,async(req,res)=>{
  const{body,deviceName}=req.body;
  const ch=await db.query("SELECT * FROM webauthn_challenges WHERE user_id=$1 AND type='registration' AND used=false AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1",[req.user.id]);
  if(!ch.rows[0])return res.status(400).json({error:'انتهت الجلسة'});
  const v=await verifyRegistrationResponse({response:body,expectedChallenge:ch.rows[0].challenge,expectedOrigin:RP_ORIGIN,expectedRPID:RP_ID,requireUserVerification:true});
  if(!v.verified)return res.status(400).json({error:'فشل التحقق'});
  const{credentialID,credentialPublicKey,counter}=v.registrationInfo;
  await db.query("INSERT INTO webauthn_credentials(user_id,credential_id,public_key,sign_count,device_name)VALUES($1,$2,$3,$4,$5)ON CONFLICT(credential_id)DO UPDATE SET sign_count=$4",[req.user.id,Buffer.from(credentialID).toString('base64url'),Buffer.from(credentialPublicKey).toString('base64url'),counter,deviceName||'جهازي']);
  await db.query('UPDATE webauthn_challenges SET used=true WHERE id=$1',[ch.rows[0].id]);
  res.json({verified:true,message:'تم تسجيل البصمة!'});
});

// WebAuthn Login Options
router.post('/webauthn/login-options',async(req,res)=>{
  const{email}=req.body;
  const ur=await db.query('SELECT id FROM users WHERE email=$1 AND is_active=true',[email?.toLowerCase()]);
  const user=ur.rows[0];
  if(!user)return res.status(404).json({error:'المستخدم غير موجود'});
  const creds=await db.query('SELECT credential_id FROM webauthn_credentials WHERE user_id=$1',[user.id]);
  if(!creds.rows.length)return res.status(404).json({error:'لا توجد بصمة مسجّلة'});
  const options=await generateAuthenticationOptions({rpID:RP_ID,timeout:60000,allowCredentials:creds.rows.map(c=>({id:Buffer.from(c.credential_id,'base64url'),type:'public-key',transports:['internal']})),userVerification:'required'});
  await db.query("INSERT INTO webauthn_challenges(challenge,user_id,type)VALUES($1,$2,'authentication')",[options.challenge,user.id]);
  res.json({...options,userId:user.id});
});

// WebAuthn Login Verify
router.post('/webauthn/login-verify',async(req,res)=>{
  const{body,userId}=req.body;
  const ch=await db.query("SELECT * FROM webauthn_challenges WHERE user_id=$1 AND type='authentication' AND used=false AND expires_at>NOW() ORDER BY created_at DESC LIMIT 1",[userId]);
  if(!ch.rows[0])return res.status(400).json({error:'انتهت الجلسة'});
  const credId=Buffer.from(body.id,'base64url').toString('base64url');
  const cr=await db.query('SELECT * FROM webauthn_credentials WHERE credential_id=$1 AND user_id=$2',[credId,userId]);
  if(!cr.rows[0])return res.status(401).json({error:'البصمة غير معروفة'});
  const c=cr.rows[0];
  const v=await verifyAuthenticationResponse({response:body,expectedChallenge:ch.rows[0].challenge,expectedOrigin:RP_ORIGIN,expectedRPID:RP_ID,requireUserVerification:true,authenticator:{credentialID:Buffer.from(c.credential_id,'base64url'),credentialPublicKey:Buffer.from(c.public_key,'base64url'),counter:c.sign_count}});
  if(!v.verified)return res.status(401).json({error:'فشل التحقق من البصمة'});
  await db.query('UPDATE webauthn_credentials SET sign_count=$1,last_used_at=NOW() WHERE id=$2',[v.authenticationInfo.newCounter,c.id]);
  await db.query('UPDATE webauthn_challenges SET used=true WHERE id=$1',[ch.rows[0].id]);
  const ur=await db.query('SELECT id,name,email,role,google_picture FROM users WHERE id=$1',[userId]);
  res.json({user:ur.rows[0],...generateTokens(ur.rows[0])});
});

router.get('/me',verifyToken,async(req,res)=>{
  const{rows}=await db.query('SELECT id,name,email,phone,role,avatar_url,google_picture,auth_provider,created_at FROM users WHERE id=$1',[req.user.id]);
  res.json({user:rows[0]});
});

router.post('/forgot-password',async(req,res)=>{
  res.json({message:'إذا كان البريد مسجّلاً سيصلك رابط الاسترداد'});
});

module.exports=router;