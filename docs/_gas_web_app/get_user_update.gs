'use strict';

// --------------------------------------------------
// fetchALLで非同期で処理を行う
// フォローしているユーザのリストを取得する
function main(userId, key, ascending) {
  //ユーザのFolloing数を取得
  const followingCount = getFollowingCount(userId);
  console.log('フォロー数： ' + followingCount);

  //ユーザリストを取得
  let users = getFollowingUsers(userId, key, followingCount);
  console.log('取得ユーザ数： ' + users.length);
  
  //最終更新日を取得する
  const result = getLastUpdate(users);

  //lastupdatedで昇順/降順にソート
  result.sort((a, b) => compareLastUpdated(a, b, ascending));
  printLog(result);

  return result;
}

//--------------------------------------------------
//ユーザ情報から全ユーザーの最終更新日時を取得する
function getLastUpdate(users){
  let result = [];

  for(let repeat = 0; repeat < users.length; ){
    //取得したユーザの最終更新日を取得する
    const requests = [];
    const request_users = [];
    for(let i = repeat; (i < repeat + CONF.FETCH_MAX) && (i < users.length); i++){
      let aUser = {
          urlname: users[i].urlname,
          nickname: users[i].nickname,
          url: users[i].url,
          id: users[i].id,
          userProfileImagePath: users[i].userProfileImagePath,
          lastupdated: '',
          daydiff: ''
      };
      if(users[i].urlname == 'GUEST' || users[i].urlname == '退会ユーザ'){
        // ゲストユーザの場合（記事なし） → 結果変数に直接保持
        result.push(aUser);
      }
      else{
        //ゲストユーザ以外 → 記事情報をFetchする準備
        request_users.push(aUser);
        //Fetch用のリクエスト生成
        requests.push(CONF.API_URL.CONTENTS
            .replace('#__userid__#', users[i].urlname)
        );
      }
    }
    repeat += CONF.FETCH_MAX;

    // 非同期でまとめて取得
    const responses = UrlFetchApp.fetchAll(
      requests.map(function(request) {
      return {url: request, muteHttpExceptions: true};
      })
    );


    //ユーザの記事情報を抽出
    for(let i = 0; i < responses.length; i++){
      const json_data = JSON.parse(responses[i].getContentText('UTF-8'))['data'];
      if(json_data['contents'] == null){
        //ユーザが存在しない場合（退会ユーザ） -> スキップ
        // DEBUG
        //console.log(request_users[i]);
      }
      else if(json_data['contents'].length == 0){
        //記事がひとつもない場合
        result.push(request_users[i]);
      }
      else{      
        // 記事がある場合
        result.push({
          urlname: request_users[i].urlname,
          nickname: request_users[i].nickname,
          url: request_users[i].url,
          id: request_users[i].id,
          userProfileImagePath: request_users[i].userProfileImagePath,
          lastupdated: formatJapaneseDate(json_data['contents'][0].publishAt),
          daydiff: calculateDateTimeDifference(formatJapaneseDate(json_data['contents'][0].publishAt))
        });
      }
    }
  }
  return result;
}

//--------------------------------------------------
//ユーザ情報を取得 （フォローしてる・されている）
function getFollowingUsers(userId, key, count){
  let users = [];

  //ユーザの最大ページ数
  let maxPage = parseInt(Math.ceil(count / 20), 10);
  if(maxPage > 50){
    //noteの仕様上の最大値
    maxPage = 50;
  }

  //ユーザのリストを取得する
  for(let repeat = 0; (repeat < CONF.MAX_REPEAT) && (repeat * CONF.FETCH_MAX * 20 <= count); repeat++){
    let requests = [];

    // リクエストを生成
    const start = maxPage - (repeat * CONF.FETCH_MAX);
    const end = start - CONF.FETCH_MAX;
    for(let i = start; (i > end) && (i > 0); i--){
      requests.push(CONF.API_URL.FOLLOWS
        .replace('#__userid__#', userId)
        .replace('#__key__#', key) + i);
    }

    // 非同期でまとめて取得
    const responses = UrlFetchApp.fetchAll(requests);

    for(let i = 0; i < responses.length; i++){
      const json_data = JSON.parse(responses[i].getContentText('UTF-8'))['data'];

      // ユーザ情報を抽出
      users = users.concat(getFollowList(json_data));
    }
  }

  return users;
}

//--------------------------------------------------
// ユーザのFollowingCountを取得する
function getFollowingCount(userId){
  let url = CONF.API_URL.USER.replace('#__userid__#', userId);
  let params = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, params);

  if (response.getResponseCode() === 200) {
      let result = parseInt(JSON.parse(response.getContentText('UTF-8')).data.followingCount, 10);
      if(!isNaN(result)){
        return result;
      }
  }
  return null;
}

// --------------------------------------------------
// ユーザー情報の結果からユーザー情報を抽出（ゲストユーザーやカスタムドメインユーザーを判定）
function getFollowList(json){
  const list = json['follows'];
  let result = [];

  for(let i = 0; i < list.length; i++){
    let userURL = '';
    let userName = '';
    if(list[i].urlname === null){
      // ゲストユーザ
      userURL = 'https://note.com/_nourlname/?user_id=' + list[i].id;
      userName = 'GUEST';
    }
    else if(list[i].withdrawal){
      //退会ユーザ
      userURL = 'https://note.com';
      userName = '退会ユーザ';

    }
    else if(list[i].customDomain === null){
      // 通常ユーザ
      userURL = 'https://note.com/' + list[i].urlname;
      userName = list[i].urlname;
    }
    else{
      // カスタムドメインユーザ
      userURL = 'https://' + list[i].customDomain.host;
      userName = list[i].urlname;
    }

    // JSONに変換
    result.push({
      urlname: userName,
      nickname: list[i].nickname,
      url: userURL,
      id: list[i].id,
      userProfileImagePath: list[i].userProfileImagePath,
    });
  }
  return result;
}

// --------------------------------------------------
// lastupdatedを日付型に変換する関数（ソート用）
function parseLastUpdated(dateString) {
  return new Date(dateString);
}

// --------------------------------------------------
// lastupdatedを比較する関数（ソート用）
function compareLastUpdated(a, b, ascending) {
  let dateA;
  let dateB;

  if(a.lastupdated == ''){
    //投稿記事がない場合は1999-01-01としてソート
    dateA = parseLastUpdated('1999-01-01');
  }else{
    dateA = parseLastUpdated(a.lastupdated)
  }

  if(b.lastupdated == ''){
    //投稿記事がない場合は1999-01-01としてソート
    dateB = parseLastUpdated('1999-01-01');
  }else{
    dateB = parseLastUpdated(b.lastupdated);
  }

  if(ascending){
    return dateA.getTime() - dateB.getTime();
  }else{
    return dateB.getTime() - dateA.getTime();
  }
}

// --------------------------------------------------
//日付フォーマットを整形する
function formatJapaneseDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

//--------------------------------------------------
// 現在時刻との差分を表示する
function calculateDateTimeDifference(targetDateTime) {
  const now = new Date();
  const target = new Date(targetDateTime);

  const yearDiff = now.getFullYear() - target.getFullYear();
  const monthDiff = now.getMonth() - target.getMonth();
  const dayDiff = now.getDate() - target.getDate();
  const hourDiff = now.getHours() - target.getHours();
  const minuteDiff = now.getMinutes() - target.getMinutes();

  if (yearDiff > 0) {
    return `${yearDiff}年前`;
  } else if (monthDiff > 0) {
    return `${monthDiff}ヶ月前`;
  } else if (dayDiff > 0) {
    if(dayDiff >= 21 && dayDiff < 28){
      return '3週間前';
    }else if(dayDiff >= 14 && dayDiff < 21){
      return '2週間前';  
    }else{
      return `${dayDiff}日前`;
    }
  } else if (hourDiff > 0) {
    return `${hourDiff}時間前`;
  } else if (minuteDiff > 0) {
    return `${minuteDiff}分前`;
  } else {
    return 'たった今';
  }
}

// --------------------------------------------------
// 実行ログにユーザ名を出力する Debug用
function printLog(users){
  for(let i = 0; i < users.length; i++){
    console.log('ユーザ名（' + (i + 1) + '）： ' + 
      users[i].nickname + ' ' +
      users[i].urlname + ' ' + 
      users[i].daydiff + ' ' + 
      users[i].url);
  }
}
