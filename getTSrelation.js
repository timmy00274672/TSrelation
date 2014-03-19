var fs = require('fs'),
    format = require('util').format,
    curl = require('curling'),
    cheerio = require('cheerio'),
    async = require('async'),
    connection = require('./dbLink.js');

//constant
var START_YEAR = 80,
    END_YEAR = 85,
    SEARCHING_INTERVAL = 20;

var resultArray = [], //{TID,TName,SName}
    AMOUNT;

async.series([

    function(callback) {
        //calculate the #teachers
        var sql1 = "SELECT COUNT(*) AS count FROM person";
        connection.query(sql1, function(err, count) {
            if (err) callback(err);
            else {
                AMOUNT = count[0].count;
                // AMOUNT = 1105;
                callback(null, "counting is successed");
            }
        });
    },
    function(callback) {
        //query each sector of teachers seriesly
        var sectorBeginning = 0,
            teachersInSector = [];

        async.whilst(function() {
            return sectorBeginning <= AMOUNT;
        }, function(callback) {
            var sql2 = format("SELECT PersonId, Name FROM person LIMIT %d,%d", sectorBeginning, SEARCHING_INTERVAL);
            connection.query(sql2, function(err, teachers) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    async.each(teachers, searchForCertainTeacher, function(err) {
                        // fs.writeFile('temp.txt', JSON.stringify(resultArray));
                        if (err) callback(err);
                        else {
                            var msg = format("%d,%d is finished", sectorBeginning, sectorBeginning + SEARCHING_INTERVAL);
                            console.log(msg);
                            sectorBeginning += SEARCHING_INTERVAL;
                            if (resultArray.length != 0) {
                                msg += format("length = %d", resultArray.length);
                                var insertQuery = format("INSERT INTO ST (TID,TName,SName) VALUES %s;",
                                    resultArray.map(function(r) {
                                        return format("(%d,'%s','%s')", r.TID, r.TName, r.SName);
                                    }).join(","));
                                query(insertQuery, function(err) {
                                    if (err) callback(err);
                                    else callback(null, msg);
                                });
                                resultArray = [];

                            } else {
                                callback(null, msg);
                            }

                        }
                    });
                }
            });
            //sectorBeginning+=SEARCHING_INTERVAL;
        }, function(err) {
            //all teachers data should be saved in resultArray.
            if (err) callback(err);
            else callback(null, "all teachers finished");
        });

    }
], function(err, result) {
    //all teachers in db is finished.
    //should do output
    if (err) {
        console.log(err);
    } else {
        fs.writeFile('temp.txt', JSON.stringify(resultArray));
        console.log("ALL FINISH");
    }
    connection.end();

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
            var command = format("'http://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/ccd=cbfzRN/search' -H 'Pragma: no-cache' -H 'Origin: http://ndltd.ncl.edu.tw' -H 'Accept-Encoding: gzip,deflate,sdch' -H 'Accept-Language: en-US,en;q=0.8,zh-TW;q=0.6,zh;q=0.4' -H 'User-Agent: Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Cache-Control: no-cache' -H 'Referer: http://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/ccd=cbfzRN/search?mode=cmd' -H 'Cookie: ccd=QbTwRO; __utma=69409167.1031489124.1395128227.1395128227.1395146922.2; __utmz=69409167.1395128227.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); BIGipServerpool_query=426092736.20480.0000; style=ncl' -H 'Connection: keep-alive' --data 'qs0=%27%s%27.ad+AND+%27%d%27.yr&qf0=_hist_&gs32search.x=19&gs32search.y=9&displayonerecdisable=1&dbcode=nclcdr&action=&op=&h=&histlist=&opt=m&_status_=search__v2' --compressed", encodeURIComponent(name), yr);

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
            console.log("finish : ", teacher.Name, resultArray.length);
            callback(err, format("%s finish", teacher.Name));
        }
    );
};

var query = function(sql, callback) {
    connection.query(sql, function(err, results) {
        callback(err);
    });
};