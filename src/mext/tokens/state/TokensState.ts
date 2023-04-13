import MextToken from '../MextToken';
import MextTokenRange from './MextTokenRange';
import MextRange from '../../types/MextRange';

class TokensState {
	private tokens: MextToken[];

	public loadTokens = (tokens: MextToken[]) => {
		this.tokens = [...tokens];
	};

	public getTokenFromAbsolutePosition = (targetPosition: number): MextToken | null => {
		let relativePosition = 0;
		for (let i = 0; i < this.tokens.length; i++) {
			const token = this.tokens[i];

			const absoluteTokenStart = relativePosition;
			const absoluteTokenEnd = relativePosition + token.content.length;
			if (Math.max(absoluteTokenStart, absoluteTokenEnd) >= targetPosition
				&& targetPosition >= Math.min(absoluteTokenStart, absoluteTokenEnd)) {
				return token;
			}

			relativePosition += token.content.length;
		}

		return null;
	};

	public getTokensFromAbsoluteRange = (range: MextRange): MextTokenRange[] => {
		const result: MextTokenRange[] = [];

		let relativePosition = 0;
		for (let i = 0; i < this.tokens.length; i++) {
			const token = this.tokens[i];

			const absoluteTokenStart = relativePosition;
			const absoluteTokenEnd = relativePosition + token.content.length;
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

			relativePosition += token.content.length;
		}

		return result;
	};
}

export default TokensState;
