import { Command, Message, Middleware, CommandDecorators } from '@yamdbf/core';
import { GuildMember } from 'discord.js';
import { ModClient } from '../../../client/ModClient';
import { modOnly } from '../../../util/Util';

const { resolve, expect } = Middleware;
const { using } = CommandDecorators;

export default class extends Command<ModClient>
{
	public constructor()
	{
		super({
			name: 'prune',
			desc: 'Remove the last given quantity of messages for the provided member',
			usage: '<prefix>prune <quantity> <member>',
			info: 'Removes as many messages as possible from the given member within the given quantity of messages. Can delete up to 100 messages per command call',
			group: 'prune',
			guildOnly: true
		});
	}

	@modOnly
	@using(resolve('quantity: Number, member: Member'))
	@using(expect('quantity: Number, member: Member'))
	public async action(message: Message, [quantity, member]: [int, GuildMember]): Promise<any>
	{
		if (!quantity || quantity < 1)
			return message.channel.send('You must enter a valid number of messages to prune');

		if (!member) return message.channel.send('You must mention a user to prune');

		const messages: Message[] = (await message.channel.messages.fetch(
			{ limit: 100, before: message.id }))
			.filter((a: Message) => a.author.id === member.id)
			.array();
		messages.length = Math.min(quantity, messages.length);
		if (messages.length === 0) return message.reply(
			'There were no messages by that user to delete in the past 100 messages.');

		if (messages.length === 1) await messages[0].delete();
		else await message.channel.bulkDelete(messages);
		if (member.id === message.author.id) message.delete();

		return message.author.send('Prune operation completed.');
	}
}
