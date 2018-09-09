import { Command, Message, Middleware, CommandDecorators } from '@yamdbf/core';
import { MessageEmbed } from 'discord.js';
import { ModClient } from '../../../client/ModClient';
import { modOnly } from '../../../util/Util';

const { resolve, expect } = Middleware;
const { using } = CommandDecorators;

export default class extends Command<ModClient>
{
	public constructor()
	{
		super({
			name: 'reason',
			desc: 'Set a reason for a case or cases',
			usage: '<prefix>reason <#|#-#|latest> <...reason>',
			info: 'Can be used to edit your own cases or to set a reason for a ban/unban case that was posted by the bot',
			group: 'mod',
			guildOnly: true
		});
	}

	@modOnly
	@using(resolve('cases: String, ...reason: String'))
	@using(expect('cases: String, ...reason: String'))
	public async action(message: Message, [caseString, reason]: string[]): Promise<any>
	{
		const parseRange: RegExp = /(\d+)\-(\d+)/;
		let firstID: int;
		let secondID: int;

		if (parseRange.test(caseString))
		{
			const parsedRange: RegExpMatchArray = caseString.match(parseRange);
			firstID = parseInt(parsedRange[1]);
			secondID = parseInt(parsedRange[2]);
		}
		else if (caseString === 'latest')
		{
			firstID = await message.guild.storage.settings.get('cases');
			secondID = firstID;
		}
		else
		{
			firstID = parseInt(caseString);
			secondID = firstID;
		}
		if (!firstID || isNaN(firstID)) return message.channel.send('You must provide a case number.');
		if (secondID < firstID) return message.channel.send('Upper range cannot be below lower range.');

		const working: Message = <Message> await message.channel.send('Indexing cases...');

		const cases: Map<int, Message> = new Map();
		const errors: Map<int, string> = new Map();
		for (let i: int = firstID; i <= secondID; i++)
		{
			const caseMessage: Message = await this.client.mod.logs.findCase(message.guild, i);
			if (!caseMessage)
			{
				errors.set(i, 'Failed to fetch case.');
				continue;
			}
			if (caseMessage.author.id !== this.client.user.id)
			{
				errors.set(i, `I didn't post that case.`);
				continue;
			}

			const messageEmbed: MessageEmbed = caseMessage.embeds[0];
			if (messageEmbed.author.name !== message.author.tag
				&& messageEmbed.author.name !== this.client.user.tag
				&& !message.member.permissions.has('MANAGE_GUILD'))
				errors.set(i, 'That is not your case to edit.');

			cases.set(i, caseMessage);
		}

		if (errors.size > 0)
		{
			const errorMsgs: string[] = Array.from(errors.entries())
				.map((e => `**Case ${e[0]}:** ${e[1]}`));
			let errorOutput: string;
			if (errorMsgs.length > 10) errorOutput =
				`${errorMsgs.slice(0, 10).join('\n')}\n-- Plus ${errorMsgs.length - 10} other errors.`;
			else errorOutput = errorMsgs.join('\n');
			return working.edit(`Unable to complete operation due to errors:\n${errorOutput}`);
		}

		await working.edit('Updating cases...');
		for (const caseNum of cases.keys())
			await this.client.mod.logs.editCase(message.guild, caseNum, message.author, reason);

		if (firstID < secondID)	working.edit(`Set reason for cases #${firstID}-${secondID}.`);
		else working.edit(`Set reason for case #${firstID}.`);
	}
}
