const rp = require('request-promise-native');
const agent = new require('http').Agent({
	keepAlive: true,
	maxSockets: 8
});
const config = require('../config').pgsql;
const pgp = require('pg-promise')();
const db = pgp(config);

function extractNumber(str) {
	return str.match(/(\d+)/)[1];
}

function pad(num) {
	let str = num.toString();
	let left = 3 - str.length;
	if (left > 0) {
		return new Array(left).fill(0).join('') + str;
	}
	return str;
}

module.exports = {
	getMetas: function (offset = 0, limit = 50) {
		return db.query(`
			SELECT * FROM eight_comic_meta
			OFFSET $1
			LIMIT $2`, [offset, limit], pgp.queryResult.many);
	},
	getMetaByComicID: function (comicID) {
		return db.query(`
			SELECT * FROM eight_comic_meta
			WHERE id = $1`, [comicID], pgp.queryResult.one);
	},
	getChapters: function (comicID) {
		return db.query(`
			SELECT * FROM eight_comic_chapter
			WHERE comic_id = $1`, [comicID], pgp.queryResult.many);
	},

	/**
	 * @param comicID {string}
	 * @param chapterID {string} useless
	 */
	getImages: function (comicID, chapterID) {
		//http://v.comicbus.com/online/comic-103.html?ch=1
		let options = {
			url: `http://v.comicbus.com/online/comic-${comicID}.html?ch=${chapterID}`,
			encoding: null,
			agent: agent,
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip, deflate, sdch',
				'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Cookie': 'RI=0',
				'Host': 'v.comicbus.com',
				'Pragma': 'no-cache',
				'Referer': 'http://www.comicbus.com/html/103.html',
				'Upgrade-Insecure-Requests': '1',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
			}
		};

		return rp(options).then((res) => {
			res = res.toString();
			let match = res.match(/var cs=\'([^\']+)\'/);
			if (match === null) {
				throw new Error('can not extract cs');
			}
			let cs = match[1];

			let encryptedChaters = cs.match(/(\w{3}\d|\w{2}\d{2}|\w\d{3})(\w\d|\d{2})(\d)(\w{2}\d|\w\d{2}|\d{3})(.{40})/g);
			if (encryptedChaters === null) {
				throw new Error('can not parse cs');
			}

			let metas = encryptedChaters.map(encryptedChapter => {
				let tokens = encryptedChapter.match(/(\w{3}\d|\w{2}\d{2}|\w\d{3})(\w\d|\d{2})(\d)(\w{2}\d|\w\d{2}|\d{3})(.{40})/);
				let num = tokens[1];
				let sid = tokens[2];
				let did = tokens[3];
				let pages = tokens[4];
				let code = tokens[5];
				let meta = {
					did: did,
					code: code,
					num: extractNumber(num),
					sid: extractNumber(sid),
					pages: parseInt(extractNumber(pages), 10)
				}
				return meta;
			})

			let meta = metas.find(meta => meta.num === chapterID);
			let images = [];
			for (let i = 1; i <= meta.pages; i++) {
				let m = ((i - 1) / 10) % 10 + ((i - 1) % 10) * 3;
				let img = pad(i) + '_' + meta.code.substr(m, 3);
				images.push(`http://img${meta.sid}.6comic.com:99/${meta.did}/${comicID}/${chapterID}/${img}.jpg`);
			}
			return images;
		})
	},

};
