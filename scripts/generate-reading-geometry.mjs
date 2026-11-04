import { writeFile } from 'node:fs/promises';

const glyphs = {
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
const phrase=[];
let letterIndex=0;
const cell=6.5, advance=34, lineY=12, lineStep=49;
function splitRun(run,target){
  const base=run.length, counts=Array(base).fill(1);
  let left=target-base;
  while(left-->0){let best=0;for(let i=1;i<counts.length;i++)if(run.length/counts[i]>run.length/counts[best])best=i;counts[best]++;}
  return counts;
}
for(const [li,line] of lines.entries()){
  const chars=[...line],startX=(360-(chars.length*advance-5))/2;
  for(const [ci,raw] of chars.entries()){
    if(raw===" ")continue;
    const ch=raw.normalize("NFD").replace(/\p{M}/gu,"");
    const rows=glyphs[ch],runs=[];
    rows.forEach((row,ri)=>{
      let col=0;
      while(col<row.length){
        if(row[col]!=="1"){col++;continue;}
        const start=col;while(col<row.length&&row[col]==="1")col++;
        runs.push({ri,start,length:col-start});
      }
    });
    const target=targets[letterIndex++];
    const accent=raw==="Á"||raw==="Ó";
    const regularTarget=target-(raw==="Á"?1:0);
    const totalLength=runs.reduce((n,r)=>n+r.length,0);
    const allocation=runs.map(r=>Math.max(1,Math.floor((regularTarget*r.length)/totalLength)));
    let remaining=regularTarget-allocation.reduce((a,b)=>a+b,0);
    const order=runs.map((r,i)=>({i,frac:(regularTarget*r.length)/totalLength-Math.floor((regularTarget*r.length)/totalLength)})).sort((a,b)=>b.frac-a.frac);
    for(let k=0;k<remaining;k++)allocation[order[k%order.length].i]++;
    // If minimum-one allocation overshot, remove subdivisions from longest runs first.
    while(allocation.reduce((a,b)=>a+b,0)>regularTarget){
      let idx=-1;for(let i=0;i<allocation.length;i++)if(allocation[i]>1&&(idx<0||allocation[i]>allocation[idx]))idx=i;
      if(idx<0)throw new Error("Alocação insuficiente para "+raw);
      allocation[idx]--;
    }
    runs.forEach((r,i)=>{
      const n=allocation[i],segment=(r.length*cell)/n;
      for(let k=0;k<n;k++)phrase.push({x:startX+ci*advance+r.start*cell+k*segment,y:lineY+li*lineStep+r.ri*cell,w:segment,h:cell,region:"phrase-"+li});
    });
    if(accent)phrase.push({x:startX+ci*advance+2*cell,y:lineY+li*lineStep-cell,w:cell,h:cell,region:"phrase-"+li});
  }
}
const grid=(x,y,cols,rows,size,region)=>Array.from({length:cols*rows},(_,i)=>({x:x+(i%cols)*size,y: y+Math.floor(i/cols)*size,w:size,h:size,region}));
const temple=[
 {id:"A",name:"Pináculo",count:6,cells:grid(174,8,2,3,6,"A")},
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
 {id:"R",name:"Telhado e frontão",count:21,cells:[
  ...grid(141,110,3,1,6,"R"),
  ...grid(135,116,5,1,6,"R"),
  ...grid(129,122,7,1,6,"R"),
  ...grid(123,128,6,1,6,"R")
 ]},
 {id:"B",name:"Corpo da capela",count:144,cells:grid(81,148,36,4,5.5,"B")},
 {id:"L",name:"Ala esquerda",count:20,cells:grid(0,151,10,2,8,"L")},
 {id:"D",name:"Ala direita",count:20,cells:grid(280,151,10,2,8,"D")},
 {id:"S",name:"Base",count:6,cells:grid(162,178,6,1,6,"S")}
];
const geometry={phrase,temple,chapel};
if(phrase.length!==239||temple.reduce((n,z)=>n+z.cells.length,0)!==239||chapel.reduce((n,z)=>n+z.cells.length,0)!==239)throw new Error("Contagem incorreta: "+[phrase.length,temple.reduce((n,z)=>n+z.cells.length,0),chapel.reduce((n,z)=>n+z.cells.length,0)]);
for(const z of [...temple,...chapel])if(z.cells.length!==z.count)throw new Error("Contagem incorreta na região "+z.id);
await writeFile(new URL("../src/reading-geometry.json",import.meta.url),JSON.stringify(geometry,null,2)+"\n");
console.log("Geometria alinhada gerada: 239 células por desenho.");
