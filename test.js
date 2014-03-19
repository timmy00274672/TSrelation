var fs = require('fs');
var format = require('util').format;
var curl = require('curling');
var cheerio = require('cheerio');

var name = '陳澤生';
name = encodeURIComponent(name);
var yr = 90;
var command = format("'http://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/ccd=FZUhN_/search' -H 'Cookie: ccd=pW7aOE; BIGipServerpool_query=426092736.20480.0000; style=ncl' -H 'Origin: http://ndltd.ncl.edu.tw' -H 'Accept-Encoding: gzip,deflate,sdch' -H 'Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4' -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.146 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' -H 'Cache-Control: max-age=0' -H 'Referer: http://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/ccd=FZUhN_/search?mode=cmd' -H 'Connection: keep-alive' --data 'qs0=%22%s%22.ad+AND+%22%d%22.yr&qf0=_hist_&gs32search.x=27&gs32search.y=6&displayonerecdisable=1&dbcode=nclcdr&action=&op=&h=&histlist=1%2C+2%2C+3&opt=m&_status_=search__v2' --compressed", name, yr);

curl.run(command, function (err, result) {
	if(err) throw err;
    console.log(result.stats);
    // fs.writeFile('file.html', result.payload);
    $ = cheerio.load(result.payload);
    var arr = [];
    $('td.std2').each(function(i, elem) {
	  arr[i] = $(elem).text();
	});
	console.log(arr);
});