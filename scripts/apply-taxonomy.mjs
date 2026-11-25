import fs from 'node:fs';
import assert from 'node:assert/strict';
import {applyTaxonomy} from '../src/engine.ts';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const region=read('data/region_taxonomy.json'),source=read('data/source_taxonomy.json'),db=read('data/servants.json');
for(const s of db)for(const [field,cfg]of [['region',region],['origin',source]])if(!cfg.overrides?.[s.id]&&!Object.hasOwn(cfg.exactInputs,s.raw?.[field]??'__NULL__'))throw Error(`未配置原文：${s.id} ${field}`);
const next=db.map(s=>applyTaxonomy(s,region,source));
next.forEach((s,i)=>{assert.deepEqual(s.raw,db[i].raw,'原始资料不能改动');assert.deepEqual({...s,region:null,origin:null},{...db[i],region:null,origin:null},'仅允许改两级标签');});
fs.writeFileSync('data/servants.json',JSON.stringify(next,null,2)+'\n');console.log('Applied taxonomy to',next.length,'servants; raw fields and other attributes unchanged.');
