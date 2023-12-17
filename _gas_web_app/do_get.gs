//HTTP GETをハンドリングする
function doGet(e){

  //リクエストパラメータ名"id"の値を取得する
  let paramID = e.parameter.id;
  let paramKey = e.parameter.key;
  let result;
  let out;

  try{
    if(paramID !== '' && (paramKey == 'asc' || paramKey == 'desc')){
      // フォローを取得
      result = main(paramID, 'followings', paramKey == 'asc');

    } else {
      throw new Error('パラメータが正しく指定されていません。');
    }
  }catch(e){
    console.log(e);
    result = 'error';
  }

  //Mime TypeをJSONに設定
  out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);
  out.setContent(JSON.stringify(result));

  return out;
}