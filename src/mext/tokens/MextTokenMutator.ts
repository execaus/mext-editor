import MextToken from './MextToken';
import MextFormat from '../types/MextFormat';
import MextRange from '../types/MextRange';
import ResultSplitTokens from '../types/ResultSplitTokens';
import MextTokenType from './MextTokenType';
import TokensState from './state/TokensState';
import FontSize from '../types/FontSize';

class MextTokenMutator {
	private readonly tokensState: TokensState;

	/** Если удалены все токены, то это токен с настройками, которые стоит применить при новом наборе текста */
	private lastActualToken: MextToken | null;
	private defaultFontFamily: string;
	private defaultFontSize: FontSize;
	private defaultColor: string;

	constructor() {
		this.tokensState = new TokensState();
		this.lastActualToken = null;
		this.defaultFontFamily = 'Arial';
		this.defaultFontSize = FontSize.Pt16;
		this.defaultColor = '#000000';
	}

	public setFormat = (tokens: MextToken[], range: MextRange | null, format: MextFormat): MextToken[] => {
		if (range === null || range.length === 0) {
			this.setFormatTokens(tokens, format);
		} else {
			const splitResult = this.splitTokens(tokens, range);

			tokens = splitResult.updatedSequence;
			this.setFormatTokens(splitResult.crossedTokens, format);
		}

		return tokens;
	};

	public setColor = (tokens: MextToken[], range: MextRange | null, color: string): MextToken[] => {
		if (range === null || range.length === 0) {
			this.setColorTokens(tokens, color);
		} else {
			const splitResult = this.splitTokens(tokens, range);

			tokens = splitResult.updatedSequence;
			this.setColorTokens(splitResult.crossedTokens, color);
		}

		return tokens;
	};

	public setFontFamily = (tokens: MextToken[], range: MextRange | null, fontFamily: string): MextToken[] => {
		if (range === null || range.length === 0) {
			this.setFontFamilyTokens(tokens, fontFamily);
		} else {
			const splitResult = this.splitTokens(tokens, range);

			tokens = splitResult.updatedSequence;
			this.setFontFamilyTokens(splitResult.crossedTokens, fontFamily);
		}

		return tokens;
	};

	public setFontSize = (tokens: MextToken[], range: MextRange | null, fontSize: FontSize): MextToken[] => {
		if (range === null || range.length === 0) {
			this.setFontSizeTokens(tokens, fontSize);
		} else {
			const splitResult = this.splitTokens(tokens, range);

			tokens = splitResult.updatedSequence;
			this.setFontSizeTokens(splitResult.crossedTokens, fontSize);
		}

		return tokens;
	};

	public insertContent = (tokens: MextToken[], range: MextRange, insertContent: number[]): MextToken[] => {
		let result = [...tokens];

		if (range.length === 0) {
			return this.insertContentToPosition(result, range.start, insertContent);
		}

		result = this.removeRange(result, range);

		return this.insertContentToPosition(result, range.start, insertContent);
	};

	public updateLastActualToken = (tokens: MextToken[], updatedTokens: MextToken[]) => {
		if (updatedTokens.length === 0) {
			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i];
				if (token.type === MextTokenType.String) {
					this.lastActualToken = token;
					this.lastActualToken.content = [];
					break;
				}
			}
		}
	};

	private insertContentToPosition = (tokens: MextToken[], position: number, insertContent: number[]): MextToken[] => {
		const result = [...tokens];

		if (result.length === 0) {
			if (this.lastActualToken === null) {
				this.lastActualToken = {
					type: MextTokenType.String,
					content: [],
					format: 0,
					fontFamily: this.defaultFontFamily,
					fontSize: this.defaultFontSize,
					color: this.defaultColor,
				};
			}
			this.lastActualToken.content = insertContent;
			return [this.lastActualToken];
		}

		let currentPosition = 0;
		for (let i = 0; i < result.length; i++) {
			const token = result[i];
			if (position >= currentPosition && position <= currentPosition + token.content.length) {
				const relativePosition = position - currentPosition;
				token.content = [
					...token.content.slice(0, relativePosition),
					...insertContent,
					...token.content.slice(relativePosition),
				];
				break;
			}
			currentPosition += token.content.length;
		}

		return result;
	};

	public removeRange = (result: MextToken[], range: MextRange): MextToken[] => {
		const splitResult = this.splitTokens(result, range);
		return splitResult.updatedSequence.filter(token => !splitResult.crossedTokens.includes(token));
	};

	public setDefaultFontSize = (fontSize: FontSize) => {
		this.defaultFontSize = fontSize;
	};

	public setDefaultColor = (color: string) => {
		this.defaultColor = color;
	};

	public setDefaultFontFamily = (fontFamily: string) => {
		this.defaultFontFamily = fontFamily;
	};

	private setFormatTokens = (tokens: MextToken[], format: MextFormat): MextToken[] => {
		const isHaveFormat = tokens.some(token => token.format & format);
		const isEvery = tokens.every(token => token.format & format);

		if (isHaveFormat && isEvery) {
			this.disableFormat(tokens, format);
		} else {
			this.enableFormat(tokens, format);
		}

		return tokens;
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

	/** Разбить токены в местах начала и конца диапазона. */
	private splitTokens = (tokens: MextToken[], range: MextRange): ResultSplitTokens => {
		this.tokensState.loadTokens(tokens);

		const tokenRanges = this.tokensState.getTokensFromAbsoluteRange(range);
		const result: ResultSplitTokens = {
			updatedSequence: [],
			crossedTokens: [],
		};

		tokens.forEach(token => {
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

	private getDuplicate = (token: MextToken): MextToken => ({
		...token,
		content: [...token.content],
	});
}

export default MextTokenMutator;
