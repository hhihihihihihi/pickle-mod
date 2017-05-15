import { Command, Message, Middleware, CommandDecorators } from 'yamdbf';
import { User } from 'discord.js';
import { modOnly } from '../../../lib/Util';
import ModBot from '../../../lib/ModBot';

const { resolveArgs, expect } = Middleware;
const { using } = CommandDecorators;

export default class Unban extends Command<ModBot>
{
	public constructor(bot: ModBot)
	{
		super(bot, {
			name: 'unban',
			description: 'Unban a user by id',
			usage: '<prefix>unban <user> <...reason>',
			group: 'mod',
			guildOnly: true
		});
	}

	@modOnly
	@using(resolveArgs({ '<user>': 'BannedUser', '<...reason>': 'String' }))
	@using(expect({ '<user>': 'User', '<...reason>': 'String' }))
	public async action(message: Message, [user, reason]: [User, string]): Promise<any>
	{
		const id: string = user.id;
		const unbanning: Message = <Message> await message.channel.send(
			`Unbanning ${user.username}#${user.discriminator}...`);

		try
		{
			this.client.mod.actions.unban(id, message.guild);
			const unbanCase: Message = <Message> await this.client.mod.logger.awaitBanCase(message.guild, user, 'Unban');
			this.client.mod.logger.editCase(message.guild, unbanCase, message.author, reason);

			return unbanning.edit(`Successfully unbanned ${user.username}#${user.discriminator}`);
		}
		catch (err)
		{
			return unbanning.edit(`Failed to unban user with id \`${id}\``);
		}
	}
}
