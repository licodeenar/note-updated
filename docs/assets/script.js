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
    document.getElementById(resultDispId).innerHTML = '<div class="note_status note_loading">しばらく時間がかかります。。。</div>';
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
        document.getElementById(elementId).innerHTML = '<div class="note_status">情報を取得できませんでした。</div>';
    } else {
        if (isJson) {
            // JSONのまま表示
            document.getElementById(elementId).innerHTML = '<span class="note_data_json">' + jasons + '</span>';
        } else {
            obj = JSON.parse(jasons);
            html = '<div class="note_count">' + obj.length + '人</div><ul class="note_list">';
            for (let i = 0; i < obj.length; i++) {
                let daydiff = obj[i].daydiff;
                let lastupdated = obj[i].lastupdated;
                if (daydiff == '') {
                    daydiff = '記事なし';
                }
                if (lastupdated == '') {
                    lastupdated = '-';
                }

                html += '<li class="note_item">' +
                    '<a href="' + obj[i].url + '" target="_blank" rel="noopener">' +
                    '<img class="note_avatar" src="' + obj[i].userProfileImagePath + '" alt="">' +
                    '<span class="note_body">' +
                    '<span class="note_data_name">' + obj[i].nickname + '</span>' +
                    '<span class="note_data_id">@' + obj[i].urlname + '</span>' +
                    '</span>' +
                    '<span class="note_updated"><b>' + daydiff + '</b>' + lastupdated + '</span>' +
                    '</a></li>';
            }
            html += '</ul>';

            document.getElementById(elementId).innerHTML = html;
        }
    }
}
