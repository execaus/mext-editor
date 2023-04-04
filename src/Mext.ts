import MextRenderEngine from './mext/MextRenderEngine';
import MextModel from './mext/types/MextModel';
import TextAlign from './mext/types/TextAlign';
import MextParser from './mext/MextParser';
import MextCarriage from './mext/MextCarriage';
import CharCode from './mext/types/CharCode';
import MextToken from './mext/tokens/MextToken';
import SpecialPhrase from './mext/types/SpecialPhrase';
import MextFormat from './mext/types/MextFormat';
import MextRange from './mext/types/MextRange';
import MextTokenRange from './mext/types/MextTokenRange';
import MextTokenType from './mext/tokens/MextTokenType';
import MextCarriageTokenPosition from './mext/types/MextCarriageTokenPosition';
import FontSize from './mext/types/FontSize';
import ResultSplitTokens from './mext/types/ResultSplitTokens';

class Mext {
	private readonly containerElement: HTMLElement;
	private readonly targetElement: HTMLElement;
	private readonly renderEngine: MextRenderEngine;
	private readonly parser: MextParser;
	private readonly carriage: MextCarriage;

	private model: MextModel;
	private isPreventInput: boolean;

	constructor(containerElement: HTMLElement) {
		this.model = {
			id: '',
			tokens: [],
			lineHeight: 1.3,
			align: TextAlign.LEFT,
		};
		this.isPreventInput = false;
		this.targetElement = document.createElement('div');
		this.containerElement = containerElement;

		this.parser = new MextParser(this.targetElement);
		this.parser.appendSpecialChar(CharCode.Hash);

		this.carriage = new MextCarriage(this.targetElement);
		this.renderEngine = new MextRenderEngine(this.targetElement);
		this.setEventHandlers(this.containerElement);

		containerElement.append(this.targetElement);
	}

	public enableEditable = () => {
		this.containerElement.contentEditable = 'true';
	};

	public disableEditable = () => {
		this.containerElement.removeAttribute('contentEditable');
	};

	public setModel = (model: MextModel) => {
		this.model = model;
		this.render();
	};

	public setString = () => {
		// TODO
	};

	public getModel = (): MextModel => this.model;

	private setEventHandlers = (element: HTMLElement) => {
		element.addEventListener('keydown', this.onKeyDown);
		element.addEventListener('input', this.onInput);
		element.addEventListener('beforeinput', this.onBeforeInput);
		element.addEventListener('paste', this.onPaste);
	};

	private onBeforeInput = (ev: InputEvent) => {
		const carriagePosition = this.carriage.getPosition();
		if (carriagePosition === null) {
			throw new Error('insert position not found');
		}

		switch (ev.inputType) {
		case 'insertText': {
			const insertContent = this.parseInsertContent(ev.data);
			this.insertContent(carriagePosition, insertContent);
			break;
		}
		case 'deleteContentBackward': {
			this.isPreventInput = true;
			this.removeContent(carriagePosition);
			break;
		}
		case 'deleteContentForward': {
			this.isPreventInput = true;
			this.removeContent(carriagePosition + 1);
			break;
		}
		default: break;
		}
	};

	private onInput = (ev: Event) => {
		const specialPhrases = this.parser.parse();
		this.model.tokens = this.normalizeTokens(this.model.tokens, specialPhrases);
		this.render();

		if (this.isPreventInput) {
			ev.preventDefault();
			this.isPreventInput = false;
		}
	};

	private onPaste = (ev: ClipboardEvent) => {
		if (ev.clipboardData === null) {
			return;
		}
		const carriagePosition = this.carriage.getPosition();
		if (carriagePosition === null) {
			return;
		}

		const pasteText = ev.clipboardData.getData('text/plain');
		this.insertContent(carriagePosition, this.parser.convertToCodePoints(pasteText));
		this.render();
		setTimeout(() => {
			this.carriage.setPosition(carriagePosition + pasteText.length);
		}, 1000);
		ev.preventDefault();
	};

	private onKeyDown = (ev: KeyboardEvent) => {
		if (!ev.shiftKey && ev.key === 'Enter') {
			ev.preventDefault();
		}
		if (ev.shiftKey && ev.key === 'Enter') {
			ev.preventDefault();
		}
	};

	private normalizeTokens = (tokens: MextToken[], specialPhrases: SpecialPhrase[]): MextToken[] => {
		const result: MextToken[] = [...tokens];

		return this.mergeTokens(result);
	};

	public setFormat = (format: MextFormat) => {
		const range = this.carriage.getSelection();
		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.setFormatTokens(this.model.tokens, format);
		} else {
			const splitResult = this.splitTokens(range);

			this.model.tokens = splitResult.updatedSequence;
			this.setFormatTokens(splitResult.crossedTokens, format);
		}

		this.render();
	};

	public setFontSize = (fontSize: FontSize) => {
		const range = this.carriage.getSelection();
		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.setFontSizeTokens(this.model.tokens, fontSize);
		} else {
			const splitResult = this.splitTokens(range);

			this.model.tokens = splitResult.updatedSequence;
			this.setFontSizeTokens(splitResult.crossedTokens, fontSize);
		}

		this.render();
	};

	public setColor = (color: string) => {
		const range = this.carriage.getSelection();
		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.setColorTokens(this.model.tokens, color);
		} else {
			const splitResult = this.splitTokens(range);

			this.model.tokens = splitResult.updatedSequence;
			this.setColorTokens(splitResult.crossedTokens, color);
		}

		this.render();
	};

	public setFontFamily = (fontFamily: string) => {
		const range = this.carriage.getSelection();
		if (range === null) {
			return;
		}

		if (range.length === 0) {
			this.setFontFamilyTokens(this.model.tokens, fontFamily);
		} else {
			const splitResult = this.splitTokens(range);

			this.model.tokens = splitResult.updatedSequence;
			this.setFontFamilyTokens(splitResult.crossedTokens, fontFamily);
		}

		this.render();
	};

	private setFormatTokens = (tokens: MextToken[], format: MextFormat) => {
		const isHaveFormat = tokens.some(token => token.format & format);
		const isEvery = tokens.every(token => token.format & format);

		if (isHaveFormat && isEvery) {
			this.disableFormat(tokens, format);
		} else {
			this.enableFormat(tokens, format);
		}
	};

	private setFontSizeTokens = (tokens: MextToken[], fontSize: FontSize) => {
		tokens.forEach(token => {
			token.fontSize = fontSize;
		});
	};

	private setColorTokens = (tokens: MextToken[], color: string) => {
		tokens.forEach(token => {
			token.color = color;
		});
	};

	private setFontFamilyTokens = (tokens: MextToken[], fontFamily: string) => {
		tokens.forEach(token => {
			token.fontFamily = fontFamily;
		});
	};

	private splitTokens = (range: MextRange): ResultSplitTokens => {
		const tokenRanges = this.getCrossRangeTokens(range);
		const result: ResultSplitTokens = {
			updatedSequence: [],
			crossedTokens: [],
		};

		this.model.tokens.forEach(token => {
			const tokenRange = tokenRanges.find(t => t.token === token);

			if (tokenRange === undefined) {
				result.updatedSequence.push(token);
				return;
			}

			if (tokenRange.isFull) {
				result.crossedTokens.push(token);
				result.updatedSequence.push(token);
				return;
			}

			if (token.type !== MextTokenType.String && token.type !== MextTokenType.NewLine) {
				result.crossedTokens.push(token);
				result.updatedSequence.push(token);
				return;
			}

			if (tokenRange.start !== 0 && tokenRange.end !== token.content.length) {
				// Добавить токен без форматирования справа и слева
				const leftDuplicate = this.getDuplicate(token);
				const rightDuplicate = this.getDuplicate(token);

				leftDuplicate.content = leftDuplicate.content.slice(0, tokenRange.start);
				rightDuplicate.content = rightDuplicate.content.slice(tokenRange.end, token.content.length);
				token.content = token.content.slice(tokenRange.start, tokenRange.end);

				result.updatedSequence.push(leftDuplicate);
				result.updatedSequence.push(token);
				result.updatedSequence.push(rightDuplicate);

				result.crossedTokens.push(token);
			} else if (tokenRange.start !== 0 && tokenRange.end === token.content.length) {
				// Добавить токен без форматирования слева
				const leftDuplicate = this.getDuplicate(token);
				leftDuplicate.content = leftDuplicate.content.slice(0, tokenRange.start);

				token.content = token.content.slice(tokenRange.start, token.content.length);

				result.updatedSequence.push(leftDuplicate);
				result.updatedSequence.push(token);

				result.crossedTokens.push(token);
			} else if (tokenRange.start === 0 && tokenRange.end !== token.content.length) {
				// Добавить токен без форматирования справа
				const rightDuplicate = this.getDuplicate(token);
				rightDuplicate.content = rightDuplicate.content.slice(tokenRange.end, token.content.length);

				token.content = token.content.slice(0, tokenRange.end);

				result.updatedSequence.push(token);
				result.updatedSequence.push(rightDuplicate);

				result.crossedTokens.push(token);
			}
		});

		return result;
	};

	private parseInsertContent = (data: string | null): number[] => {
		if (data === null) {
			return [];
		}

		return this.parser.convertToCodePoints(data);
	};

	private insertContent = (insertPosition: number, insertContent: number[]) => {
		let currentPosition = 0;

		for (let i = 0; i < this.model.tokens.length; i++) {
			const token = this.model.tokens[i];
			if (insertPosition >= currentPosition && insertPosition <= currentPosition + token.content.length) {
				const relativePosition = insertPosition - currentPosition;
				token.content = [
					...token.content.slice(0, relativePosition),
					...insertContent,
					...token.content.slice(relativePosition),
				];
				break;
			}
			currentPosition += token.content.length;
		}
	};

	private removeContent = (removePosition: number) => {
		let currentPosition = 0;

		for (let i = 0; i < this.model.tokens.length; i++) {
			const token = this.model.tokens[i];
			if (removePosition >= currentPosition && removePosition <= currentPosition + token.content.length) {
				if (token.type === MextTokenType.NewLine) {
					this.model.tokens = [
						...this.model.tokens.slice(0, i),
						...this.model.tokens.slice(i + 1),
					];
					break;
				}
				const relativePosition = removePosition - currentPosition;
				token.content = [
					...token.content.slice(0, relativePosition - 1),
					...token.content.slice(relativePosition),
				];
				break;
			}
			currentPosition += token.content.length;
		}
	};

	private render = () => {
		this.renderEngine.render(this.model);
	};

	private mergeTokens = (tokens: MextToken[]): MextToken[] => {
		const result: MextToken[] = [...tokens];

		return result;
	};

	private getCarriagePositionToken = (position: number): MextCarriageTokenPosition | null => {
		let currentPosition = 0;

		for (let i = 0; i < this.model.tokens.length; i++) {
			const token = this.model.tokens[i];
			if (position === currentPosition) {
				return {
					leftBound: true,
					rightBound: false,
					position: 0,
					token,
				};
			}
			if (position === currentPosition + token.content.length) {
				return {
					leftBound: false,
					rightBound: true,
					position: 0,
					token,
				};
			}
			if (position > currentPosition && position < currentPosition + token.content.length) {
				return {
					leftBound: false,
					rightBound: false,
					position: position - currentPosition,
					token,
				};
			}
			currentPosition += token.content.length;
		}

		return null;
	};

	private disableFormat = (tokens: MextToken[], format: MextFormat) => {
		tokens.forEach(token => {
			token.format ^= format;
		});
	};

	private enableFormat = (tokens: MextToken[], format: MextFormat) => {
		tokens.forEach(token => {
			if (format === MextFormat.None) {
				token.format = 0;
				return;
			}
			token.format |= format;
		});
	};

	private getCrossRangeTokens = (range: MextRange): MextTokenRange[] => {
		const result: MextTokenRange[] = [];

		let currentPosition = 0;
		this.model.tokens.forEach(token => {
			const absoluteTokenStart = currentPosition;
			const absoluteTokenEnd = currentPosition + token.content.length;
			if (Math.max(absoluteTokenStart, absoluteTokenEnd) >= Math.min(range.start, range.end)
				&& Math.max(range.start, range.end) >= Math.min(absoluteTokenStart, absoluteTokenEnd)) {
				if (absoluteTokenStart >= range.start && absoluteTokenEnd <= range.end) {
					result.push({
						isFull: true,
						start: 0,
						end: 0,
						token,
					});
				} else {
					result.push({
						isFull: false,
						start: absoluteTokenStart >= range.start
							? 0
							: range.start - absoluteTokenStart,
						end: absoluteTokenEnd >= range.end
							? token.content.length - (absoluteTokenEnd - range.end)
							: token.content.length,
						token,
					});
				}
			}

			currentPosition += token.content.length;
		});

		return result;
	};

	private getDuplicate = (token: MextToken): MextToken => ({
		...token,
		content: [...token.content],
	});
}

export default Mext;
