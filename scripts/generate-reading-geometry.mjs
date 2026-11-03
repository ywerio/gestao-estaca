import { writeFile } from 'node:fs/promises';

const glyphs = {
  "J": [
    "00111",
    "00010",
    "00010",
    "00010",
    "10010",
    "10010",
    "01100"
  ],
  "A": [
    "01110",
    "10001",
    "10001",
    "11111",
    "10001",
    "10001",
    "10001"
  ],
  "L": [
    "10000",
    "10000",
    "10000",
    "10000",
    "10000",
    "10000",
    "11111"
  ],
  "I": [
    "11111",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100",
    "11111"
  ],
  "O": [
    "01110",
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "01110"
  ],
  "V": [
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "01010",
    "00100"
  ],
  "R": [
    "11110",
    "10001",
    "10001",
    "11110",
    "10100",
    "10010",
    "10001"
  ],
  "D": [
    "11110",
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "11110"
  ],
  "E": [
    "11111",
    "10000",
    "10000",
    "11110",
    "10000",
    "10000",
    "11111"
  ],
  "M": [
    "10001",
    "11011",
    "10101",
    "10101",
    "10001",
    "10001",
    "10001"
  ],
  "N": [
    "10001",
    "11001",
    "10101",
    "10011",
    "10001",
    "10001",
    "10001"
  ]
};
const makeCells = (x,y,cols,rows,w,h,region) =>
  Array.from({length:cols*rows},(_,i)=>({x:x+(i%cols)*w,y:y+Math.floor(i/cols)*h,w,h,region}));

const lines=['JÁ LI O','LIVRO','DE','MÓRMON'];
const targets=[11,11,14,7,12,11,11,18,19,11,17,16,16,16,14,9,15,10];
const phrase=[];
let letterIndex=0;
for (const [lineIndex,line] of lines.entries()) {
  const chars=[...line], advance=40, startX=(360-(chars.length*advance-8))/2;
  for (const [ci,raw] of chars.entries()) {
    if (raw===' ') continue;
    const ch=raw.normalize('NFD').replace(/\p{M}/gu,'');
    const points=[];
    glyphs[ch].forEach((row,ri)=>[...row].forEach((bit,xi)=>{
      if(bit==='1')points.push({x:startX+ci*advance+xi*7.2,y:4+lineIndex*49+ri*7.2,w:7.2,h:7.2,region:'phrase-'+lineIndex});
    }));
    const accent=raw==='Á'?{x:startX+ci*advance+14.4,y:4+lineIndex*49-7.2,w:7.2,h:7.2,region:'phrase-'+lineIndex}:null;
    const target=targets[letterIndex++],regularTarget=target-(accent?1:0);
    let chosen;
    if(points.length>regularTarget)chosen=Array.from({length:regularTarget},(_,i)=>points[Math.floor(i*points.length/regularTarget)]);
    else if(points.length===regularTarget)chosen=points;
    else {const extra=regularTarget-points.length,split=new Set(Array.from({length:extra},(_,i)=>Math.floor(i*points.length/extra)));chosen=points.flatMap((p,i)=>split.has(i)?[{...p,w:p.w/2},{...p,x:p.x+p.w/2,w:p.w/2}]:[p]);}
    phrase.push(...chosen); if(accent)phrase.push(accent);
    if(raw==='Ó')phrase.push({x:startX+ci*advance+14.4,y:4+lineIndex*49-7.2,w:7.2,h:7.2,region:'phrase-'+lineIndex});
  }
}
const temple=[
 {id:'A',name:'Pináculo',count:6,cells:[{x:176,y:14,w:8,h:11},{x:174,y:25,w:12,h:11},{x:172,y:36,w:16,h:11},{x:170,y:47,w:20,h:11},{x:168,y:58,w:24,h:11},{x:166,y:69,w:28,h:11}].map(v=>({...v,region:'A'}))},
 {id:'B',name:'Torre superior',count:8,cells:makeCells(162,80,2,4,18,16,'B')},
 {id:'C',name:'Torre inferior',count:16,cells:makeCells(144,144,4,4,18,16,'C')},
 {id:'D',name:'Corpo central',count:120,cells:makeCells(110,210,10,12,14,14,'D')},
 {id:'E',name:'Ala esquerda',count:25,cells:makeCells(40,245,5,5,14,14,'E')},
 {id:'F',name:'Ala direita',count:25,cells:makeCells(250,245,5,5,14,14,'F')},
 {id:'G',name:'Pórtico',count:15,cells:makeCells(145,378,5,3,14,14,'G')},
 {id:'H',name:'Escadaria',count:24,cells:makeCells(72,420,12,2,18,12,'H')}
];
const chapel=[
 {id:'T',name:'Torre e pináculo',count:28,cells:makeCells(132,40,4,7,11,10,'T')},
 {id:'R',name:'Telhado e frontão',count:21,cells:makeCells(108,108,7,3,12,6,'R')},
 {id:'B',name:'Corpo da capela',count:144,cells:makeCells(80,140,18,8,11.1,4.75,'B')},
 {id:'L',name:'Ala esquerda',count:20,cells:makeCells(0,142,5,4,16,8,'L')},
 {id:'D',name:'Ala direita',count:20,cells:makeCells(280,142,5,4,16,8,'D')},
 {id:'S',name:'Base',count:6,cells:makeCells(132,178,6,1,16,5,'S')}
];
const geometry={phrase,temple,chapel};
const counts=[phrase.length,...temple.map(z=>z.cells.length),...chapel.map(z=>z.cells.length)];
if(phrase.length!==239 || temple.reduce((n,z)=>n+z.cells.length,0)!==239 || chapel.reduce((n,z)=>n+z.cells.length,0)!==239) throw new Error('Cada desenho deve ter 239 células: '+counts.join(','));
for(const z of [...temple,...chapel]) if(z.cells.length!==z.count) throw new Error('Contagem incorreta na região '+z.id);
await writeFile(new URL('../src/reading-geometry.json',import.meta.url),JSON.stringify(geometry,null,2)+'\n');
console.log('Geometria gerada: frase, templo e capela com 239 células cada.');
