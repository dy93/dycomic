const fs = require('fs-extra');
const config = require('../../config').lib.proxy_request;
const proxyRequest = require('../../lib/proxy_request');

describe('lib/proxy_request', () => {
	describe('cache system', () => {
		before(() => {
			return new Promise((resolve) => {
				return fs.remove(config.cacheDir, err => {
					if (err) {
						console.log(err);
					}
					proxyRequest.reload();
					return resolve();
				})
			})
		});

		it('request1 (no cache)', function () {
			return new Promise((resolve) => {
				proxyRequest.request('http://img2.6comic.com:99/4/11783/1/002_4sw.jpg').then(rStream => {
					rStream.pipe(fs.createWriteStream('a.jpg', { flags: 'w' }));
					rStream.on('end', resolve);
				})
			});
		});

		it('request2 (have cache)', function () {
			this.timeout(100);
			return new Promise((resolve) => {
				proxyRequest.request('http://img2.6comic.com:99/4/11783/1/002_4sw.jpg').then(rStream => {
					rStream.pipe(fs.createWriteStream('b.jpg', { flags: 'w' }));
					rStream.on('end', resolve);
				})
			});
		});

		after(() => {
			return Promise.all([
				new Promise((resolve) => {
					return fs.remove(config.cacheDir, err => {
						if (err) {
							console.log(err);
						}
						return resolve();
					})
				}),
				new Promise((resolve) => {
					fs.unlink('a.jpg', err => {
						if (err) {
							console.log(err);
						}
						return resolve();
					});
				}),
				new Promise((resolve) => {
					fs.unlink('b.jpg', err => {
						if (err) {
							console.log(err);
						}
						return resolve();
					});
				})
			]);
		});
	})

	describe('lru system', () => {
		let tmpconfig = Object.assign(config, {
			cacheFiles: 5
		});
		before(() => {
			//

		})
		after(() => {
			proxyR
		})
	});
});