const lockFile = require('lockfile');

const lockOpts = {
	wait: 5 * 1000,
	stale: 5 * 1000,
	retries: 25,
	retryWait: 100
}

module.exports = {
	lock: function lock(path) {
		return new Promise((resolve, reject) => {
			lockFile.lock(path, lockOpts, err => {
				if (err) {
					return reject(err);
				}
				return resolve();
			})
		});
	},
	unlock: function unlock(path) {
		return new Promise((resolve, reject) => {
			lockFile.unlock(path, err => {
				if (err) {
					return reject(err);
				}
				return resolve();
			})
		})
	}
}