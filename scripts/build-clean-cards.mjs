import fs from 'node:fs';
import path from 'node:path';
// Keep the original artwork and local edits intact; derive neutral transparent cards.
const root='assets/profile-clean';
for(const dark of [false,true]){
 const dir=path.join(root,dark?'dark':'');fs.mkdirSync(dir,{recursive:true});
 const map=dark?{'#1A1714':'#E6EDF3','#F4EFE6':'#E6EDF3','#655D53':'#9DA7B3','#746B61':'#9DA7B3','#B8431A':'#E6EDF3'}:{'#1A1714':'#1F2328','#655D53':'#59636E','#746B61':'#59636E','#B8431A':'#1F2328'};
 for(const file of fs.readdirSync('assets/profile-v3').filter(f=>f.endsWith('.svg'))){
 let s=fs.readFileSync(path.join('assets/profile-v3',file),'utf8');
 s=s.replace(/<pattern id="grain"[\s\S]*?<\/pattern>/g,'').replace(/<(?:path|rect)\b[^>]*fill="url\(#grain\)"[^>]*\/>/g,'').replace(/<path fill="#F4EFE6" d="M0 0h[^"]+"\/>/g,'').replace(/<rect width="100%" height="100%" fill="#F4EFE6"\/>/g,'');
 s=s.replace(/#[0-9a-f]{6}/gi,h=>map[h.toUpperCase()]??h);
 fs.writeFileSync(path.join(dir,file),s);
 }
 for(const mobile of [false,true]){
 const w=mobile?600:1200,h=mobile?160:190,x=mobile?32:64;
 fs.writeFileSync(path.join(dir,`opening${mobile?'-mobile':''}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>Chasen · AI / Agent Builder</title><g font-family="Segoe UI,Microsoft YaHei,sans-serif"><text x="${x}" y="${mobile?82:104}" font-size="${mobile?64:84}" font-weight="650" letter-spacing="-3" fill="${dark?'#E6EDF3':'#1F2328'}">Chasen</text><text x="${x}" y="${mobile?124:151}" font-size="${mobile?20:24}" fill="${dark?'#9DA7B3':'#59636E'}">AI / Agent Builder</text></g></svg>`);
 }
}
let readme=fs.readFileSync('README.md','utf8');
const opening=`<!-- Transparent artwork; separate text colours for GitHub light and dark mode. -->
<div><a href="https://chasen-intro.vercel.app/"><picture>
<source media="(max-width: 600px) and (prefers-color-scheme: dark)" srcset="./assets/profile-clean/dark/opening-mobile.svg"/>
<source media="(max-width: 600px)" srcset="./assets/profile-clean/opening-mobile.svg"/>
<source media="(prefers-color-scheme: dark)" srcset="./assets/profile-clean/dark/opening.svg"/>
<img align="top" src="./assets/profile-clean/opening.svg" width="100%" alt="Chasen · AI / Agent Builder"/>
</picture></a></div>`;
readme=readme.replace(/<!--[\s\S]*?<\/picture><\/a><\/div>/,opening).replaceAll('assets/profile-v3/','assets/profile-clean/');
fs.writeFileSync('README.md',readme);
console.log('Transparent neutral cards built.');
// Consistent typography and spacing for text-only rows, independent of SVG font outlines.
const rows={
 intro:['把想法 build 成真实产品。','构建 Agent 工具，探索 AI 产品。','在实测与开源中，持续学习和交付。'],
 'work-heading':['更多作品与实践'],
 resume:['Resume Skills','从真实经历建立母版，','按 JD 定制，检查 ATS。'],
 gap:['GAP · Grokbot And Pi','RPC 连接 Grok Bot 与 Pi，','支持 Webhook 唤醒与灾难删除保护。'],
 skills:['Chasen-Skills','并行编排、X 内容分析、','AI 热点雷达与个人 IP。'],
 supermew:['SuperMew','Agentic RAG 与上下文组织，','探索三层记忆架构。'],
 ecc:['Everything Claude Code','中文实践文档：','记录跑通的方法与踩过的坑。'],
 contact:['交流与机会','AI 产品经理方向，广州 / 深圳。','2558891266@qq.com']
};
for(const dark of [false,true])for(const mobile of [false,true])for(const [name,lines] of Object.entries(rows)){
 const w=mobile?600:1200,x=mobile?32:64,h=name==='work-heading'?90:name==='intro'?180:mobile?172:145;
 const ink=dark?'#E6EDF3':'#1F2328',muted=dark?'#9DA7B3':'#59636E';
 const titleSize=mobile?30:34;
 const text=lines.map((line,i)=>`<text x="${x}" y="${i===0?48:92+(i-1)*32}" font-size="${i===0?titleSize:mobile?23:23}" ${i===0?'font-weight="600"':''} fill="${i===0?ink:muted}">${line}</text>`).join('');
 fs.writeFileSync(path.join(root,dark?'dark':'',`${name}${mobile?'-mobile':''}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${lines.join(' ')}</title><g font-family="Segoe UI,Microsoft YaHei,sans-serif">${text}</g></svg>`);
}
