import {Converter} from './opencc.js';
export type Result='exact'|'partial'|'miss'|'unknown';
export interface Servant { id:string; name:string; displayName:string; aliases:string[]; jp:string; en:string; pinyin:string[]; group:string|null; eligible:{easy:boolean;hard:boolean}; [key:string]:any }
export const fields={artist:'画师',cv:'声优',class:'职阶',alignment:'属性',sub:'副属性',gender:'性别',np:'宝具',region:'地域',origin:'出处',cn:'国服实装',cards:'配卡',acquisition:'获取途径'};
export const keys=(hard=false)=>Object.keys(fields).filter(k=>!hard||!['gender','np','region','cn'].includes(k));
export const missing=(v:any):boolean=>v==null||v===''||Array.isArray(v)&&(!v.length||v.some(missing));
const norm=(v:any):string=>String(v).normalize('NFKC').trim();
export function compare(k:string,a:any,b:any):Result {if(missing(a)||missing(b))return 'unknown';if(k==='region'||k==='origin')return compareLore(k,a,b);if(k==='cards'){a=a.replace(/\s/g,'').toUpperCase();b=b.replace(/\s/g,'').toUpperCase();if(!/^[BAQ]{5}$/.test(a)||!/^[BAQ]{5}$/.test(b))return 'unknown';a=a.split('').sort().join('');b=b.split('').sort().join('');}
if(k==='alignment')return a.every((v:any,i:number)=>norm(v)===norm(b[i]))?'exact':a.some((v:any,i:number)=>norm(v)===norm(b[i]))?'partial':'miss';
if(Array.isArray(a)&&Array.isArray(b)){const canon=(arr:any[])=>[...new Set(arr.map(v=>Array.isArray(v)?JSON.stringify(v.map(norm)):norm(v)))].sort();const aa=canon(a),bb=canon(b);if(JSON.stringify(aa)===JSON.stringify(bb))return 'exact';if(aa.some(v=>bb.includes(v)))return 'partial';if(k==='region'){const parts=(items:string[])=>items.flatMap(v=>v.split(/[·・]/)).map(norm);if(parts(a).some(v=>parts(b).includes(v)))return 'partial';}if(k==='np'&&a.some((x:any)=>b.some((y:any)=>x[0]===y[0]||x[1]===y[1])))return 'partial';return 'miss';}return a===b?'exact':'miss';}
export const day=(d=new Date())=>new Date(+d+28800000).toISOString().slice(0,10);
export function hash(text:string){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function daily(pool:any[],date=day(),version='v1'){if(!pool.length)throw Error('答案池为空');return pool[hash(version+date)%pool.length];}
export function randomAnswer(pool:Servant[],previous?:string,random=Math.random){const choices=pool.filter(x=>x.id!==previous);if(!choices.length)throw Error('可用答案不足');return choices[Math.floor(random()*choices.length)];}
export function submit(s:any,id:string,validIds?:Set<string>){if(s.gaveUp===true||validIds&&!validIds.has(id)||s.guesses.includes(id)||s.guesses.length>=8||s.guesses.includes(s.answer))return s;return {...s,guesses:[...s.guesses,id]};}
export function restore(raw:string|null,db:Servant[],expected?:string){try{const s=JSON.parse(raw||'null');const ids=new Set(db.map(x=>x.id));if(!s||!ids.has(s.answer)||expected&&s.answer!==expected||!Array.isArray(s.guesses)||s.guesses.length>8||new Set(s.guesses).size!==s.guesses.length||s.guesses.some((x:any)=>!ids.has(x))||s.guesses.includes(s.answer)&&s.guesses.at(-1)!==s.answer)return null;return s;}catch{return null;}}
const toSimple=Converter({from:'tw',to:'cn'});
export const normalize=(s:string)=>toSimple(s.normalize('NFKC')).toLowerCase().replace(/[\s·・〔〕\[\]（）()－—\-／/]/g,'');
export function distance(a:string,b:string){if(Math.abs(a.length-b.length)>2)return 99;let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){let next=[i+1];for(let j=0;j<b.length;j++)next[j+1]=Math.min(next[j]+1,row[j+1]+1,row[j]+(a[i]===b[j]?0:1));row=next;}return row[b.length];}
const cache=new WeakMap<object,any[]>();
export function search(db:Servant[],query:string){const q=normalize(query);if(!q)return [];let index=cache.get(db);if(!index){index=db.map(s=>({s,n:normalize(s.name),alias:s.aliases.map(normalize),other:[s.jp,s.en,s.displayName].filter(Boolean).map(normalize),py:(s.pinyin||[]).join('').replace(/\s/g,''),initial:(s.pinyin||[]).map(p=>p[0]).join('')}));cache.set(db,index);}
const ranked=index.map(({s,n,alias,other,py,initial})=>{let rank=n===q?0:alias.includes(q)?1:other.includes(q)?2:n.startsWith(q)?3:alias.some((a:string)=>a.startsWith(q))?4:n.includes(q)||alias.some((a:string)=>a.includes(q))?5:/^[a-z]+$/.test(q)&&q.length>1&&(py.startsWith(q)||initial.startsWith(q))?6:other.some((a:string)=>a.includes(q))&&q.length>1?6:q.length>=3&&[n,py,...other,...alias].some(a=>(distance(a,q)<=(q.length>6?2:1)||q.length>=4&&distance(a.slice(0,q.length),q)<=1))?7:99;return {s,rank};});const groups=new Set(ranked.filter(x=>x.rank<5&&x.s.group).map(x=>x.s.group));for(const r of ranked)if(r.rank===99&&groups.has(r.s.group))r.rank=8;return ranked.filter(x=>x.rank<99).sort((a,b)=>a.rank-b.rank||Number(a.s.id)-Number(b.s.id)).slice(0,30).map(x=>({...x.s,matchReason:x.rank===8?'关联版本':x.rank===7?'近似拼写':x.rank===6?'拼音 / 外文':''}));}
export function share(s:any,db:Servant[],hard:boolean,label:string){const target=db.find(x=>x.id===s.answer)!;return `芙一把 ${label} ${hard?'困难':'简单'} ${s.guesses.includes(s.answer)?s.guesses.length:'X'}/8\n`+s.guesses.map((id:string)=>keys(hard).map(k=>({exact:'🟩',partial:'🟨',miss:'⬜',unknown:'❔'})[compare(k,db.find(x=>x.id===id)![k],target[k])]).join('')).join('\n');}
export function completeAcquisition(s:any){if(s.rarity===3&&s.acquisition?.includes('圣晶石常驻'))return {...s,acquisition:[...new Set([...s.acquisition,'友情点召唤'])]};return s;}

// Keep source wording intact; normalize only the comparison labels.
const regionAliases:Record<string,string>={'不列颠':'英国','加勒比':'加勒比海','欧洲全域':'欧洲','西欧诸国':'西欧','美利坚合众国':'美国','北美大陆':'北美','古波斯':'波斯','古代以色列':'以色列'};
const regionParents:Record<string,string[]>={};
for(const [parent,children] of Object.entries({欧洲:['英国','法国','德国','罗马','希腊','爱尔兰','匈牙利','丹麦','罗马尼亚','挪威','芬兰','北欧','西欧','西班牙','瑞士','乌克兰','意大利','马其顿'],英国:['英格兰','苏格兰','伦敦','雪伍德'],希腊:['斯巴达','科林斯'],北美:['美国','加拿大'],美国:['马萨诸塞'],西亚:['波斯','美索不达米亚','巴比伦尼亚','以色列','中东'],巴比伦尼亚:['乌鲁克'],东非:['埃塞俄比亚'],日本:['冬木市','信州户隐','姬路城','秋叶原','新宿','冲绳'],南亚:['印度']}))for(const child of children)(regionParents[child]??=[]).push(parent);
export function loreTags(k:string,value:any):string[]{
const items=Array.isArray(value)?value:[value];let text=toSimple(items.map(norm).join('、')).replace(/\s+/g,' ').replace(/及び/g,'、');
if(k==='origin')text=text.replace(/[『「《]([^』」》]+)[』」》]/g,'、$1、').replace(/(?:大仲马著|依据|能剧|歌剧|芭蕾舞剧)/g,'').replace(/史实[与及]异闻带/g,'史实、异闻带').replace(/史实·传承/g,'史实、传承');
else text=text.replace(/[『「《』」》]/g,'').replace(/中国及日本/g,'中国、日本').replace(/中东及欧洲全域/g,'中东、欧洲').replace(/\d{4}年·/g,'');
text=text.replace(/[（(]([^）)]+)[）)]/g,'、$1、');
return [...new Set(text.split(k==='region'?/[、,，;；·・～~]/:/[、,，;；。]/).map(x=>x.trim().replace(/^(以及|主要是)/,'').replace(/(?:等等|等)[？?]?$/,'').replace(/[？?]+$/,'').trim()).filter(x=>x&&!/^(?:[-—―─]+|■+|不明|未知|其他|包裹在谜团当中|自称|史实……|三大化生之一|α)$/.test(x)).map(x=>k==='region'?(regionAliases[x]||x):x.replace(/\+α$/,'')))];
}
function compareLore(k:string,a:any,b:any):Result{const aa=loreTags(k,a),bb=loreTags(k,b);if(!aa.length||!bb.length)return 'unknown';const same=JSON.stringify([...aa].sort())===JSON.stringify([...bb].sort());if(same)return 'exact';if(aa.some(x=>bb.includes(x)))return 'partial';if(k==='region'){const expand=(xs:string[])=>{const set=new Set(xs);for(const x of set)for(const parent of regionParents[x]||[])set.add(parent);return set;};const ax=expand(aa),bx=expand(bb);if([...ax].some(x=>bx.has(x)))return 'partial';}return 'miss';}
