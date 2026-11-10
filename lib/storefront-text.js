import {create} from 'fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';
let fontsPromise;
async function fonts(){
  if(!fontsPromise)fontsPromise=Promise.all(['manrope-latin.woff2','manrope-vietnamese.woff2','manrope-latin-ext.woff2'].map(async name=>create(await fs.readFile(path.join(process.cwd(),'public/fonts',name))))).catch(error=>{fontsPromise=null;throw error;});
  return fontsPromise;
}
// Convert bundled font glyphs to geometry: Sharp never needs a system font.
export async function outlinedText(value,{x,y,size,fill,bold=false,maxWidth=1060}){
  const available=await fonts();
  const runs=[];
  for(const char of String(value).normalize('NFC')){
    const font=available.find(f=>f.hasGlyphForCodePoint(char.codePointAt(0)));
    if(!font)throw new Error(`Ảnh bìa chưa hỗ trợ ký tự “${char}”. Hãy dùng chữ tiếng Việt, tiếng Anh hoặc số.`);
    if(runs.at(-1)?.font===font)runs.at(-1).text+=char;else runs.push({font,text:char});
  }
  let cursor=0;const paths=[];
  for(const {font,text} of runs){const run=font.layout(text),scale=size/font.unitsPerEm;
    for(let i=0;i<run.glyphs.length;i++){const glyph=run.glyphs[i],pos=run.positions[i];
      if(!glyph.id)throw new Error('Không đọc được chữ trên ảnh bìa.');
      const d=glyph.path.toSVG();if(d)paths.push(`<path vector-effect="non-scaling-stroke" d="${d}" transform="translate(${cursor+pos.xOffset*scale} ${-pos.yOffset*scale}) scale(${scale} ${-scale})"/>`);
      cursor+=pos.xAdvance*scale;
    }
  }
  const fit=cursor>maxWidth?maxWidth/cursor:1;
  return `<g fill="${fill}" stroke="${fill}" stroke-width="${bold?1:0.45}" stroke-linejoin="round" transform="translate(${x} ${y}) scale(${fit})">${paths.join('')}</g>`;
}
