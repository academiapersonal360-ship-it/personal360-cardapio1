import {authorized,json,denied} from '../../_auth.js';
export async function onRequestGet({request,env}){
  if(!await authorized(request,env))return denied();
  const r=await env.DB.prepare('SELECT id,nome AS name,preco AS price,categoria AS category,foto AS photo,ordem AS sort FROM produtos ORDER BY ordem,id').all();
  return json(r.results);
}
export async function onRequestPost({request,env}){
  if(!await authorized(request,env))return denied();
  let d;
  try{d=await request.json()}catch{return json({error:'JSON inválido'},400)}
  if(!Array.isArray(d)||d.length>150)return json({error:'Lista inválida'},400);
  for(const p of d){
    if(typeof p.name!=='string'||!p.name.trim()||p.name.length>120||typeof p.category!=='string'||!p.category.trim()||p.category.length>80||typeof p.price!=='string'||!/^[0-9]{1,6}(?:,[0-9]{1,2})?$/.test(p.price)||typeof p.photo!=='string'||p.photo.length>1500000||(p.photo&&!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$|^https:\/\//.test(p.photo)))return json({error:'Produto inválido. Confira nome, preço e imagem (até 1 MB).'},400);
  }
  try{
    const sql='INSERT INTO produtos(nome,preco,categoria,foto,ordem,ativo) VALUES(?,?,?,?,?,1)';
    const statements=[env.DB.prepare('DELETE FROM produtos'),...d.map((p,i)=>env.DB.prepare(sql).bind(p.name.trim(),p.price,p.category.trim(),p.photo,i))];
    await env.DB.batch(statements);
    return json({ok:true,count:d.length});
  }catch(e){return json({error:'Não foi possível salvar. Reduza o tamanho das imagens e tente novamente.'},500)}
}