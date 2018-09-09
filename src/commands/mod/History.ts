import { Command, Message, Middleware } from '@yamdbf/core';
import { User, MessageEmbed } from 'discord.js';
import { ModClient } from '../../client/ModClient';
import { prompt, PromptResult } from '../../util/Util';

export default class extends Command<ModClient>
{
	public constructor()
	{
		super({
			name: 'history',
			desc: 'Check a user\'s offense history',
			usage: '<prefix>history [user [\'reset\']]',
			info: `To reset a user's history, just add the word 'reset' after the user to look up. If no user is provided, or you do not have permission to use mod commands, you will be DM'd your own history.`,
			group: 'mod',
			guildOnly: true
		});

		this.use(async (message, args) => {
			if (!await this.client.mod.canCallModCommand(message)) return [message, []];
			else return Middleware.resolve('user?: User').call(this, message, args);
		});
	}

	public async action(message: Message, [user, reset]: [User, string]): Promise<any>
	{
		user = user ? user : message.author;
		let offenses: any = await this.client.mod.actions.checkUserHistory(message.guild, user);
		let embed: MessageEmbed = new MessageEmbed()
			.setColor(offenses.color)
			.setAuthor(user.tag, user.avatarURL())
			.setFooter(offenses.toString());

		if (reset === 'reset')
		{
			if (!message.member.permissions.has('MANAGE_GUILD'))
				return message.channel.send(`You don't have permission to reset member history.`);

			const [result]: [PromptResult] = <[PromptResult]> await prompt(message,
				'Are you sure you want to reset this member\'s history? (__y__es | __n__o)',
				/^(?:yes|y)$/i, /^(?:no|n)$/i, { embed });
			if (result === PromptResult.TIMEOUT) return message.channel.send('Command timed out, aborting history reset.');
			if (result === PromptResult.FAILURE) return message.channel.send('Okay, aborting history reset.');

			await this.client.mod.managers.history.clear(user, message.guild);

			offenses = await this.client.mod.actions.checkUserHistory(message.guild, user);
			embed = new MessageEmbed()
				.setColor(offenses.color)
				.setAuthor(user.tag, user.avatarURL())
				.setFooter(offenses.toString());
		}

		message.channel.send({ embed });
	}
}
