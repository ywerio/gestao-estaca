import { writeFile } from 'node:fs/promises';
const glyphs={
 J:["00111","00010","00010","00010","10010","10010","01100"],
 A:["01110","10001","10001","11111","10001","10001","10001"],
 L:["10000","10000","10000","10000","10000","10000","11111"],
 I:["11111","00100","00100","00100","00100","00100","11111"],
 O:["01110","10001","10001","10001","10001","10001","01110"],
 V:["10001","10001","10001","10001","10001","01010","00100"],
 R:["11110","10001","10001","11110","10100","10010","10001"],
 D:["11110","10001","10001","10001","10001","10001","11110"],
 E:["11111","10000","10000","11110","10000","10000","11111"],
 M:["10001","11011","10101","10101","10001","10001","10001"],
 N:["10001","11001","10101","10011","10001","10001","10001"]
};
const lines=["JÁ LI O","LIVRO","DE","MÓRMON"];
const targets=[11,11,14,7,12,11,11,18,19,11,17,16,16,16,14,9,15,10];
const cell=6.5,advance=34,lineY=12,lineStep=49,phrase=[];
function tileGlyph(rows){
 const grid=rows.map(r=>r.split("").map(v=>v==="1"));
 const rects=[];
 while(grid.some(row=>row.some(Boolean))){
  let best=null;
  for(let y=0;y<grid.length;y++)for(let x=0;x<grid[0].length;x++)if(grid[y][x]){
   let w=0;while(x+w<grid[0].length&&grid[y][x+w])w++;
   let h=1;while(y+h<grid.length&&Array.from({length:w},(_,i)=>grid[y+h][x+i]).every(Boolean))h++;
   if(!best||w*h>best.w*best.h)best={x,y,w,h};
  }
  for(let y=best.y;y<best.y+best.h;y++)for(let x=best.x;x<best.x+best.w;x++)grid[y][x]=false;
  rects.push(best);
 }
 return rects;
}
function splitRect(r,n,x0,y0,region){
 const x=x0+r.x*cell,y=y0+r.y*cell,w=r.w*cell,h=r.h*cell,out=[];
 for(let i=0;i<n;i++){
  if(w>=h){const part=w/n;out.push({x:x+i*part,y,w:part,h,region});}
  else{const part=h/n;out.push({x,y:y+i*part,w,h:part,region});}
 }
 return out;
}
let li=0;
for(const [lineIndex,line] of lines.entries()){
 const chars=[...line],startX=(360-(chars.length*advance-5))/2;
 for(const [ci,raw] of chars.entries()){
  if(raw===" ")continue;
  const ch=raw.normalize("NFD").replace(/\p{M}/gu,"");
  const rects=tileGlyph(glyphs[ch]),target=targets[li++],regularTarget=target-(raw==="Á"?1:0);
  const totalArea=rects.reduce((n,r)=>n+r.w*r.h,0);
  const allocation=rects.map(r=>Math.max(1,Math.floor(regularTarget*r.w*r.h/totalArea)));
  const order=rects.map((r,i)=>({i,frac:regularTarget*r.w*r.h/totalArea-Math.floor(regularTarget*r.w*r.h/totalArea)})).sort((a,b)=>b.frac-a.frac);
  let left=regularTarget-allocation.reduce((a,b)=>a+b,0);
  for(let k=0;k<left;k++)allocation[order[k%order.length].i]++;
  while(allocation.reduce((a,b)=>a+b,0)>regularTarget){let idx=-1;for(let i=0;i<allocation.length;i++)if(allocation[i]>1&&(idx<0||allocation[i]>allocation[idx]))idx=i;if(idx<0)throw new Error("Target menor que as regiões da letra "+raw);allocation[idx]--;}
  rects.forEach((r,i)=>phrase.push(...splitRect(r,allocation[i],startX+ci*advance,lineY+lineIndex*lineStep,"phrase-"+lineIndex)));
  if(raw==="Á"||raw==="Ó")phrase.push({x:startX+ci*advance+2*cell,y:lineY+lineIndex*lineStep-cell,w:cell,h:cell,region:"phrase-"+lineIndex});
 }
}
const grid=(x,y,cols,rows,size,region)=>Array.from({length:cols*rows},(_,i)=>({x:x+(i%cols)*size,y:y+Math.floor(i/cols)*size,w:size,h:size,region}));
const temple=[
 {id:"A",name:"Pináculo",count:6,cells:grid(176,8,2,3,4,"A")},
 {id:"B",name:"Torre superior",count:8,cells:grid(164,80,2,4,16,"B")},
 {id:"C",name:"Torre inferior",count:16,cells:grid(152,144,4,4,14,"C")},
 {id:"D",name:"Corpo central",count:120,cells:grid(110,210,10,12,14,"D")},
 {id:"E",name:"Ala esquerda",count:25,cells:grid(40,245,5,5,14,"E")},
 {id:"F",name:"Ala direita",count:25,cells:grid(250,245,5,5,14,"F")},
 {id:"G",name:"Pórtico",count:15,cells:grid(145,378,5,3,14,"G")},
 {id:"H",name:"Escadaria",count:24,cells:grid(108,420,12,2,12,"H")}
];
const chapel=[
 {id:"T",name:"Torre e pináculo",count:28,cells:grid(132,40,4,7,9,"T")},
 {id:"R",name:"Telhado e frontão",count:21,cells:[...grid(141,110,3,1,6,"R"),...grid(135,116,5,1,6,"R"),...grid(129,122,7,1,6,"R"),...grid(123,128,6,1,6,"R")]},
 {id:"B",name:"Corpo da capela",count:144,cells:grid(81,148,36,4,5.5,"B")},
 {id:"L",name:"Ala esquerda",count:20,cells:grid(0,151,10,2,8,"L")},
 {id:"D",name:"Ala direita",count:20,cells:grid(280,151,10,2,8,"D")},
 {id:"S",name:"Base",count:6,cells:grid(162,178,6,1,6,"S")}
];
const geometry={phrase,temple,chapel};
const totals=[phrase.length,temple.reduce((n,z)=>n+z.cells.length,0),chapel.reduce((n,z)=>n+z.cells.length,0)];
if(totals.some(n=>n!==239))throw new Error("Cada desenho deve conter 239 células: "+totals.join(", "));
for(const z of [...temple,...chapel])if(z.cells.length!==z.count)throw new Error("Contagem incorreta na região "+z.id);
await writeFile(new URL("../src/reading-geometry.json",import.meta.url),JSON.stringify(geometry,null,2)+"\n");
console.log("Geometria legível gerada: 239 células por desenho.");
