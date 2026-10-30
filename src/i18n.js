/* 语言：词典在 i18n.json，这里只负责读取和替换 */
const LANG={cur:'zh'};
const HAS_ZH=/[㐀-鿿]/;
function tr(s){
  if(LANG.cur==='zh'||!HAS_ZH.test(s))return s;
  const k=s.trim();
  if(I18N.text[k]!=null)return s.replace(k,I18N.text[k]);
  for(const [re,to] of I18N.patterns){const m=k.match(new RegExp(re));if(m)return s.replace(k,k.replace(new RegExp(re),to))}
  return s;
}
