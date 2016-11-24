const fs = require('fs');

module.exports = {
	exists: function exists(path) {
		return new Promise((resolve, reject) => {
			fs.stat(path, (err, stats) => {
				if (err) {
					return resolve(false);
				}
				return resolve(true);
			})
		});
	}
}