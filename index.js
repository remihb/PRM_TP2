/*jshint
loopfunc:true
*/

var fs = require('fs'),
	_ = require('lodash'),
	MailParser = require('mailparser').MailParser,
	similarity = require('compute-cosine-similarity');

var vocab = _.map(['java', 'offre', 'c#', 'php', 'emploi', 'stage', 'html', 'css', 'javascript', 'js', 'big', 'data', 'bigdata', 'business', 'intelligence', 'ingnieur', 'ingenieur', 'ingénieur', 'style', 'sap', 'programmation', 'sql', 'bdd', 'données', 'sgbd', 'tests', 'hadoop', 'agile', 'projet', 'système', 'systeme', 'saas', 'esn', 'sii', 'développement', 'développeur', 'dveloppeur', 'dveloppement', 'developpement', 'developpeur', 'gestion', 'entreprise', 'société', 'societe', 'socte', 'python', 'embauche', 'MIAGE', 'profil', 'technique', 'fonctionnel', 'ecole', 'service', 'numérique', 'numerique', 'numrique', 'candidat', 'compétence', 'comptence', 'competence', 'recrutement', 'recruter', 'recrute', 'formation', 'thèse', 'these', 'thse'], _.method('toLowerCase'));
var vectorRef = _.fill(Array(vocab.length), 1);
var COSRATE = 0.35;

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
var ensureExists = function(path, mask, cb) {
	if (typeof mask == 'function') {
		cb = mask;
		mask = 0777;
	}
	fs.mkdir(path, mask, function(err) {
		if (err) {
			if (err.code == 'EEXIST'){
				deleteFolderRecursive(path);
			}
			else cb(err);
		} else cb(null);
	});
};


var vectorSignature = function(mail) {
	return new Promise(function(resolve, reject) {
		var vector = _.fill(Array(vocab.length), 0);
		for (var i = 0; i < vocab.length; i++) {
			if (_.includes(mail.text, vocab[i])) {
				vector[i] = 1;
			}
		}
		var sim = similarity(vectorRef, vector);
		mail.sign = _.isNaN(sim) ? 0 : sim;
		resolve(mail);
	});
};

var extractMail = function(item) {
	return new Promise(function(resolve, reject) {
		fs.exists('mails/' + item, function(exists) {
			if (exists) {
				var mailparser = new MailParser();
				fs.createReadStream("mails/" + item).pipe(mailparser);
				mailparser.on("end", function(mail) {
					if (mail.hasOwnProperty('text')) {
						mail.text = _.lowerCase(mail.text);
						mail.filename = item;
						vectorSignature(mail)
							.then(function(signMail) {
								resolve({
									status: 'ok',
									content: signMail
								});
							});
					} else {
						resolve({
							status: 'ko',
							content: 'no content in mail'
						});
					}
				});
				mailparser.on("error", function(error) {
					resolve({
						status: 'ko',
						content: error
					});
				});
			} else {
				resolve({
					status: 'ko',
					content: 'no file found'
				});
			}
		});
	});
};

var sortMails = function() {
	return new Promise(function(resolve, reject) {
		fs.readdir('mails', function(err, items) {
			var promises = [];
			for (var i = 0; i < items.length; i++) {
				promises.push(extractMail(items[i]));
			}
			Promise.all(promises)
				.then(function(result) {
					var mails = _.remove(result, function(el) {
						return el.status == 'ok';
					});
					return _.map(mails, function(el) {
						return el.content;
					});
				})
				.then(function(mails) {
					var spam = _.remove(mails, function(mail) {
						return mail.sign < COSRATE;
					});
					var good = _.difference(mails, spam);
					resolve({
						good: good,
						spam: spam
					});
				})
				.catch(function(error) {
					reject(error);
				});
		});
	});
};



var writeMails = function(mails, dir) {
	return new Promise(function(resolve, reject) {
		var path = __dirname + '/mails' + dir;
		ensureExists(path, 0755, function(err) {
			if (err) {
				reject(err);
			} else {
				for (var i = 0; i < mails.length; i++) {
					fs.writeFile(path + mails[i].filename, mails[i].html, function(err) {
						if (err) {
							reject(err);
						}
					});
				}
				resolve();
			}
		});
	});
};

var execute = function() {
	deleteFolderRecursive(__dirname + '/mails/good');
	deleteFolderRecursive(__dirname + '/mails/spam');
	return new Promise(function(resolve, reject) {
		sortMails()
			.then(function(result) {
				writeMails(result.good, '/good/')
					.then(function() {
						writeMails(result.spam, '/spam/')
							.then(function() {
								resolve('all mails write');
							})
							.catch(function(error) {
								reject(error);
							});
					})
					.catch(function(error) {
						reject(error);
					});
			})
			.catch(function(error) {
				reject(error);
			});
	});
};

var start = new Date();
execute()
	.then(function(result) {
		setTimeout(function(argument) {
			// execution time simulated with setTimeout function
			var end = new Date() - start;
			console.info("Execution time: %dms", end);
		}, 1000);

		console.log(result);
	})
	.catch(function(error) {
		console.log(error);
	});
