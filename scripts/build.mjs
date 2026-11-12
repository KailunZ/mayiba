import fs from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
fs.mkdirSync('dist',{recursive:true});for(const f of ['index.html','style.css','app.js'])fs.copyFileSync(f,'dist/'+f);fs.copyFileSync('src/opencc.js','dist/opencc.js');fs.writeFileSync('dist/engine.js',stripTypeScriptTypes(fs.readFileSync('src/engine.ts','utf8')));for(const f of ['servants.json','quality-report.json','daily-manifest.json'])if(fs.existsSync('data/'+f))fs.copyFileSync('data/'+f,'dist/'+f);fs.mkdirSync('dist/licenses',{recursive:true});fs.copyFileSync('vendor/opencc/package/LICENSE','dist/licenses/opencc.txt');fs.copyFileSync('vendor/opencc/package/THIRD_PARTY_LICENSES.md','dist/licenses/opencc-third-party.txt');console.log('Built dist');
fs.cpSync('data/releases','dist/releases',{recursive:true});

fs.copyFileSync('vendor/pinyin/package/LICENSE','dist/licenses/pinyin-pro.txt');
