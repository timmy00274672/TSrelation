var fs = require('fs'),
    format = require('util').format,
    curl = require('curling'),
    cheerio = require('cheerio'),
    async = require('async'),
    connection = require('./dbLink.js');

//constant
var START_YEAR = 75,
    END_YEAR = 76;

var resultArray = []; //{TID,TName,SName}

var sql2 = format("SELECT PersonId, Name FROM person LIMIT 5476,3");
connection.query(sql2, function(err, teachers) {
    if (err) {
        console.log(err);
        return;
    }
    async.each(teachers, searchForCertainTeacher, function(err) {
        fs.writeFile('temp.txt', JSON.stringify(resultArray));
        return;
    });
});

/*
 *@param teacher {PersonId,Name}
 *@param callback is called when this search is over.
 *	callback(err,results)
 */
var searchForCertainTeacher = function(teacher, callback) {
    var name = teacher.Name,
        tid = teacher.PersonId;
    var yr = START_YEAR;
    async.whilst(
        function() {
            return yr < END_YEAR;
        },
        function(callback) {
            var command = format("'http://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/ccd=FZUhN_/search' -H 'Cookie: ccd=pW7aOE; BIGipServerpool_query=426092736.20480.0000; style=ncl' -H 'Origin: http://ndltd.ncl.edu.tw' -H 'Accept-Encoding: gzip,deflate,sdch' -H 'Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.146 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Cache-Control: max-age=0' -H 'Referer: http://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/ccd=FZUhN_/search?mode=cmd' -H 'Connection: keep-alive' --data 'qs0=%22%s%22.ad+AND+%22%d%22.yr&qf0=_hist_&gs32search.x=27&gs32search.y=6&displayonerecdisable=1&dbcode=nclcdr&action=&op=&h=&histlist=1%2C+2%2C+3&opt=m&_status_=search__v2' --compressed", encodeURIComponent(name), yr);



            curl.run(command, function(err, result) {
                if (err) throw err;
                // console.log(result.stats);
                // fs.writeFile('file.html', result.payload);
                $ = cheerio.load(result.payload);
                var arr = [];
                $('td.std2').each(function(i, elem) {
                    arr[i] = $(elem).text();
                });
                /* Now, array like below: 
				[ '運用HL7介面導入隨身醫囑之研究',
				  '國立成功大學／工程科學系專班／90／碩士',
				  '研究生:李賢輝',
				  '指導教授:陳澤生',
				  '\n\n 電子全文   紙本論文\n\n',
				  '多媒體診療助理系統',
				  '國立成功大學／工程科學系碩博士班／90／碩士',
				  '研究生:魏永澄',
				  '指導教授:陳澤生',
				  '\n\n 電子全文   紙本論文\n\n',
				  '植基於網路化之HL7/XML電子病歷系統',
				  '國立成功大學／工程科學系碩博士班／90／碩士',
				  '研究生:謝榮洲',
				  '指導教授:陳澤生',
				  '\n\n 電子全文   紙本論文\n\n',
				  '健保特定醫療事前審查作業數位化之研究',
				  '國立成功大學／工程科學系專班／90／碩士',
				  '研究生:林祥忠',
				  '指導教授:陳澤生',
				  '\n\n 電子全文   紙本論文\n\n',
				  '整合HL7/XML與XSL對電子病歷之轉換',
				  '國立成功大學／工程科學系碩博士班／90／碩士',
				  '研究生:關宇',
				  '指導教授:陳澤生',
				  '\n\n 電子全文   紙本論文\n\n' ]
	        */
                var index = 0;
                while (index < arr.length) {
                    resultArray.push({
                        TID: tid,
                        TName: name,
                        SName: arr[index + 2].split(':')[1]
                    });
                    index += 5;
                }
                yr++;
                callback(null, format("%s:%d", name, yr));
            });

        },
        function(err) {
            //this teacher is searched over.
            // fs.writeFile('temp.txt', JSON.stringify(resultArray));
            console.log("finish : ", teacher.Name);
            callback(err, format("%s finish", teacher.Name));
        }
    );
}