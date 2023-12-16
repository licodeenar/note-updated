function getNoteList() {
    const resultDispId = 'note_result';
    const api_key = 'AKfycbyc_pAj3wpWybNilwtrfmVaC8Hpz7qOUPqiIbKhCxKtudTelNCG2iXT-w2s2LWIqhw';
    let req = new XMLHttpRequest();
    let form = document.getElementById('setting');
    let url = 'https://script.google.com/macros/s/' + api_key +
        '/exec?id=' + form.note_id.value +
        '&key=' + form.note_key.value;
    let isJson = form.note_json.checked;

    //テーブルをクリア＆フォームをロック
    document.getElementById(resultDispId).innerHTML = 'しばらく時間がかかります。。。';
    setFormDisabled(true);

    req.open("GET", url, true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            //ロックを解除
            setFormDisabled(false);
            if (req.status == 200) {
                //結果を出力
                drawTable(req.responseText, resultDispId, isJson);
            } else {
                drawTable('', resultDispId, isJson);
            }
        }
    };
    req.send(null);
}

function setFormDisabled(lock) {
    document.getElementById('note_exe').disabled = lock;
    document.getElementById('note_id').disabled = lock;
}

function drawTable(jasons, elementId, isJson) {
    let obj;
    let html = '';

    if (jasons == '"error"' || jasons == '') {
        document.getElementById(elementId).innerHTML = '情報を取得できませんでした。';
    } else {
        if (isJson) {
            // JSONのまま表示
            document.getElementById(elementId).innerHTML = '<span class="note_data_json">' + jasons + '</span>';
        } else {
            obj = JSON.parse(jasons);
            html = '<table class="note_list"><tr>' + 
                    //'<th>#</th>' + //列番号
                    '<th><div class="note_title">' + 
                    '<div>なまえ / ID</div><div>最終更新日</div></div></th></tr>'
            for (let i = 0; i < obj.length; i++) {
                let daydiff = obj[i].daydiff;
                let lastupdated = obj[i].lastupdated;
                if(daydiff == ''){
                    daydiff = '記事なし';
                }
                if(lastupdated == ''){
                    lastupdated = '-';
                }

                html += '<tr>' + 
                    //'<td class="note_data_id">' + (i + 1) + '</td>' + //列番号
                    '<td>' +
                    '<div class="note_data_container">' +
                    '<div class="note_icon"><a href="' + obj[i].url + '" target="_blank">' + 
                    '<img class="note_icon_img" src="' + obj[i].userProfileImagePath + '"></a></div>' + 
                    '<div class="note_username">' + 
                    '<div class="note_username_nickname"><a href="' + obj[i].url + '" target="_blank">' + obj[i].nickname + '</a></div>' + 
                    '<div class="note_data_name">' + obj[i].urlname + '</div></div>' + 
                    '<div class="note_daydiff"><div><b>' + daydiff + '</b></div>' +
                    '<div>' + lastupdated + '</div></div>' +
                    '</div></td></tr>';
            }
            html += '</table>';

            document.getElementById(elementId).innerHTML = html;
        }
    }
}