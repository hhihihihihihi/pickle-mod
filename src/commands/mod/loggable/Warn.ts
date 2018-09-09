import { Command, Message, Middleware, CommandDecorators, Logger, logger } from '@yamdbf/core';
import { User, GuildMember } from 'discord.js';
import { ModClient } from '../../../client/ModClient';
import { modOnly } from '../../../util/Util';

const { resolve, expect } = Middleware;
const { using } = CommandDecorators;

export default class extends Command<ModClient>
{
	@logger('Command:Warn')
	private readonly _logger: Logger;
	private readonly _timeouts: { [message: string]: NodeJS.Timer };

	public constructor()
	{
		super({
			name: 'warn',
			desc: 'Give a formal warning to a user',
			usage: '<prefix>warn <member> <...reason>',
			group: 'mod',
			guildOnly: true
		});

		this._timeouts = {};
	}

	@modOnly
	@using(resolve('member: Member, ...reason: String'))
	@using(expect('member: Member, ...reason: String'))
	public async action(message: Message, [member, reason]: [GuildMember, string]): Promise<any>
	{
		if (this.client.mod.actions.isLocked(message.guild, member.user))
			return message.channel.send('That user is currently being moderated by someone else');

		this.client.mod.actions.setLock(message.guild, member.user);
		try
		{
			const user: User = member.user;
			if (user.id === message.author.id)
				return message.channel.send(`I don't think you want to warn yourself.`);

			const modRole: string = await message.guild.storage.settings.get('modrole');
			if ((member && member.roles.has(modRole)) || user.id === message.guild.ownerID || user.bot)
				return message.channel.send('You may not use this command on that user.');

			const warning: Message = <Message> await message.channel.send(`Warning ${user.tag}...`);

			// Try to DM the warned user, but move on after 5 seconds if it fails to resolve
			await new Promise(async res => {
				this._timeouts[message.id] =
					setTimeout(() => res(message.channel.send(`Gave up trying to send warn DM to ${user.tag}`)), 5e3);

				try
				{
					await user.send(`**You've received a warning in ${message.guild.name}.**\n\n**Reason:** ${reason}`);
				}
				catch { this._logger.error(`Failed to send warn DM to ${user.tag}`); }
				clearTimeout(this._timeouts[message.id]);
				res(delete this._timeouts[message.id]);
			});

			await this.client.mod.actions.warn(member, message.guild);
			await this.client.mod.logs.logCase(user, message.guild, 'Warn', reason, message.author);
			this._logger.log(`Warned: '${user.tag}' in '${message.guild.name}'`);
			return warning.edit(`Warned ${user.tag}`);
		}
		finally { this.client.mod.actions.removeLock(message.guild, member.user); }
	}
}
