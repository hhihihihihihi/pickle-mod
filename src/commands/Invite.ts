import { Client, Command } from '@yamdbf/core';
import { Message } from 'discord.js';

export default class extends Command<Client>
{
	public constructor()
	{
		super({
			name: 'invite',
			desc: 'Get an invite url for this bot',
			usage: '<prefix>invite'
		});
	}

	public action(message: Message, args: string[]): void
	{
		message.channel.send(`You can invite me to your server with this link:\n`
			+ `<https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&scope=bot&permissions=297888791>\n\n`
			+ `Be sure to use the \`guide\` command for information `
			+ `on setting up your server for moderation! The default prefix for commands is \`-\`. `
			+ `You can change this with the \`setprefix\` command.\n\nIf you ever forget the command prefix, `
			+ `just use \`@${this.client.user.tag} prefix\`. `
			+ `Thanks for choosing ${this.client.user.username} for your server moderation control needs! 👏`);
	}
}
