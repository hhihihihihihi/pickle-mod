import * as path from 'path';
import ModBot from './lib/ModBot';
const config: any = require('./config.json');
const pkg: any = require('../package.json');

const bot: ModBot = new ModBot({ // tslint:disable-line
	name: 'YAMDBF Mod',
	token: config.token,
	config: config,
	version: pkg.version,
	noCommandErr: false,
	statusText: 'Obey the law.',
	readyText: 'Ready\u0007',
	commandsDir: path.join(__dirname, 'commands'),
	disableBase: [
		// 'version',
		// 'reload'
	],
	ratelimit: '10/1m'
})
.setDefaultSetting('prefix', '?')
.setDefaultSetting('cases', 0)
.start()
.on('disconnect', () => process.exit(100));

process.on('unhandledRejection', (reason: string) => {
	if (/ETIMEDOUT|getaddrinfo|Something took too long to do/.test(reason)) process.exit(200);
	else console.error(reason);
});
