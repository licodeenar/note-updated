// --------------------------------------------------
// グローバル定数の定義
const CONF = function (){
  return {
    MAX_REPEAT: 1,//fetchAll()を繰り返すMAX数
    FETCH_MAX: 26,  // fetchAll() で一度にフェッチするページ数（２０ユーザ/ページ）
    API_URL:{
      USER:'https://note.com/api/v2/creators/#__userid__#',
      FOLLOWS: 'https://note.com/api/v2/creators/#__userid__#/#__key__#?per=20&page=',
      CONTENTS: 'https://note.com/api/v2/creators/#__userid__#/contents?kind=note&page=1&per=1&disabled_pinned=true&with_notes=false'
    }
  }
}();

function debug(){
  main('licodeenar', 'followings', true);
  //followers || followings
}
