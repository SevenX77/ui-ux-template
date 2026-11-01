/* 语言：词典在 i18n.json，这里只负责读取和替换 */
const LANG={cur:'zh'};
let DICT={text:{},patterns:[]};
/* 词典由模版传入：{text:{中文:英文}, patterns:[[正则,替换]]} */
function useDictionary(d){DICT=d}
const HAS_ZH=/[㐀-鿿]/;
function tr(s){
  if(LANG.cur==='zh'||!HAS_ZH.test(s))return s;
  const k=s.trim();
  if(DICT.text[k]!=null)return s.replace(k,DICT.text[k]);
  for(const [re,to] of DICT.patterns){const m=k.match(new RegExp(re));if(m)return s.replace(k,k.replace(new RegExp(re),to))}
  return s;
}

export {LANG,HAS_ZH,tr,useDictionary};
